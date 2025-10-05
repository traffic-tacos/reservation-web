import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const queueJoinDuration = new Trend('queue_join_duration');
const queueStatusDuration = new Trend('queue_status_duration');
const queueEnterDuration = new Trend('queue_enter_duration');
const fallbackTokensUsed = new Counter('fallback_tokens_used');
const realTokensUsed = new Counter('real_tokens_used');

export const options = {
  // 부하테스트 시나리오
  scenarios: {
    // 시나리오 1: 점진적 증가 (Warm-up)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 },    // 0 → 500 VUs (1분)
        { duration: '2m', target: 2000 },   // 500 → 2k VUs (2분)
        { duration: '3m', target: 5000 },   // 2k → 5k VUs (3분)
        { duration: '4m', target: 10000 },  // 5k → 10k VUs (4분)
        { duration: '5m', target: 10000 },  // 10k VUs 유지 (5분)
        { duration: '2m', target: 0 },      // 10k → 0 VUs (2분)
      ],
      gracefulRampDown: '30s',
    },

    // 시나리오 2: 30k RPS 스파이크 테스트 (목표!)
    spike_30k_rps: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 5000,
      maxVUs: 30000,
      stages: [
        { duration: '1m', target: 1000 },   // 100 → 1k RPS
        { duration: '2m', target: 5000 },   // 1k → 5k RPS
        { duration: '2m', target: 10000 },  // 5k → 10k RPS
        { duration: '3m', target: 20000 },  // 10k → 20k RPS
        { duration: '2m', target: 30000 },  // 20k → 30k RPS (목표!)
        { duration: '5m', target: 30000 },  // 30k RPS 유지 (5분)
        { duration: '2m', target: 5000 },   // 30k → 5k RPS (급격한 감소)
        { duration: '1m', target: 0 },      // 5k → 0 RPS
      ],
      startTime: '20m', // ramp_up 완료 후 시작
    },
  },

  // 부하 테스트용 완화된 임계값
  thresholds: {
    'http_req_duration': ['p(95)<2000'],      // P95 < 2초 (완화)
    'http_req_failed': ['rate<0.3'],          // 실패율 30% 미만 (완화)
    'errors': ['rate<0.3'],                   // 에러율 30% 미만
    'queue_join_duration': ['p(95)<3000'],    // Queue join P95 < 3초
    'queue_status_duration': ['p(95)<1000'],  // Queue status P95 < 1초
    'fallback_tokens_used': ['count>0'],      // Fallback 사용 추적
  }
};

// 환경 변수로 API 베이스 URL 설정
const BASE_URL = __ENV.API_BASE_URL || 'https://api.traffictacos.store';

export default function() {
  const eventId = `evt_loadtest_${Math.floor(Math.random() * 100)}`;
  const userId = `user_${__VU}_${__ITER}`;

  // 공통 헤더
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-super-key-local-testing',
    'X-Load-Test': 'true',
    'User-Agent': 'k6-load-test/1.0'
  };

  // 1. Queue Join (대기열 참여)
  const joinPayload = JSON.stringify({
    event_id: eventId,
    user_id: userId,
  });

  const joinHeaders = {
    ...headers,
    'Idempotency-Key': `join_${__VU}_${__ITER}_${Date.now()}`,
  };

  const joinStart = Date.now();
  const joinRes = http.post(`${BASE_URL}/api/v1/queue/join`, joinPayload, {
    headers: joinHeaders,
    timeout: '5s',
  });
  queueJoinDuration.add(Date.now() - joinStart);

  const joinSuccess = check(joinRes, {
    'queue join status 202': (r) => r.status === 202,
    'queue join has waiting_token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.waiting_token !== undefined || body.data?.waiting_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!joinSuccess) {
    errorRate.add(1);
    console.log(`❌ [LOAD TEST] Queue join failed: ${joinRes.status} - ${joinRes.body}`);
  } else {
    successRate.add(1);
  }

  // 토큰 추출 (실패 시 fallback)
  let waitingToken;
  try {
    const joinBody = JSON.parse(joinRes.body);
    waitingToken = joinBody.waiting_token || joinBody.data?.waiting_token;
    
    if (waitingToken && waitingToken.includes('fallback')) {
      fallbackTokensUsed.add(1);
    } else if (waitingToken) {
      realTokensUsed.add(1);
    }
  } catch (e) {
    waitingToken = `wtkn_k6_fallback_${Date.now()}_${__VU}`;
    fallbackTokensUsed.add(1);
  }

  // 짧은 대기 (폴링 시뮬레이션)
  sleep(Math.random() * 2 + 1); // 1-3초 랜덤

  // 2. Queue Status (폴링 시뮬레이션 - 3번)
  for (let i = 0; i < 3; i++) {
    const statusStart = Date.now();
    const statusRes = http.get(
      `${BASE_URL}/api/v1/queue/status?token=${waitingToken}`,
      { headers, timeout: '3s' }
    );
    queueStatusDuration.add(Date.now() - statusStart);

    const statusSuccess = check(statusRes, {
      'queue status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });

    if (statusSuccess) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }

    sleep(2); // 2초 간격 폴링
  }

  // 3. Queue Enter (입장 허가)
  const enterPayload = JSON.stringify({
    waiting_token: waitingToken,
  });

  const enterHeaders = {
    ...headers,
    'Idempotency-Key': `enter_${__VU}_${__ITER}_${Date.now()}`,
  };

  const enterStart = Date.now();
  const enterRes = http.post(`${BASE_URL}/api/v1/queue/enter`, enterPayload, {
    headers: enterHeaders,
    timeout: '5s',
  });
  queueEnterDuration.add(Date.now() - enterStart);

  const enterSuccess = check(enterRes, {
    'queue enter success': (r) => r.status === 200 || r.status === 201,
  });

  if (enterSuccess) {
    successRate.add(1);
  } else {
    errorRate.add(1);
  }

  sleep(1);
}

// 테스트 완료 후 실행
export function handleSummary(data) {
  const summary = generateSummary(data);
  
  return {
    'stdout': summary,
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.txt': summary,
  };
}

function generateSummary(data) {
  const totalRequests = data.metrics.http_reqs?.count || 0;
  const duration = (data.state.testRunDurationMs || 0) / 1000;
  const rps = duration > 0 ? (totalRequests / duration).toFixed(2) : 0;
  
  const successRate = data.metrics.success?.rate || 0;
  const errorRate = data.metrics.errors?.rate || 0;
  
  const avgDuration = data.metrics.http_req_duration?.avg || 0;
  const p95Duration = data.metrics.http_req_duration?.['p(95)'] || 0;
  const maxDuration = data.metrics.http_req_duration?.max || 0;
  
  const queueJoinP95 = data.metrics.queue_join_duration?.['p(95)'] || 0;
  const queueStatusP95 = data.metrics.queue_status_duration?.['p(95)'] || 0;
  const queueEnterP95 = data.metrics.queue_enter_duration?.['p(95)'] || 0;
  
  const fallbackTokens = data.metrics.fallback_tokens_used?.count || 0;
  const realTokens = data.metrics.real_tokens_used?.count || 0;
  const totalTokens = fallbackTokens + realTokens;
  const fallbackRate = totalTokens > 0 ? ((fallbackTokens / totalTokens) * 100).toFixed(2) : 0;

  return `
╔═══════════════════════════════════════════════════════════════╗
║           🚀 Traffic Tacos Load Test Results 🚀              ║
╚═══════════════════════════════════════════════════════════════╝

📊 Overall Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Requests:       ${totalRequests.toLocaleString()}
  Test Duration:        ${duration.toFixed(2)}s
  Requests per Second:  ${rps} RPS
  Success Rate:         ${(successRate * 100).toFixed(2)}%
  Error Rate:           ${(errorRate * 100).toFixed(2)}%

⏱️  Response Times
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Average:              ${avgDuration.toFixed(2)}ms
  95th Percentile:      ${p95Duration.toFixed(2)}ms
  Maximum:              ${maxDuration.toFixed(2)}ms

🎯 Queue API Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Queue Join P95:       ${queueJoinP95.toFixed(2)}ms
  Queue Status P95:     ${queueStatusP95.toFixed(2)}ms
  Queue Enter P95:      ${queueEnterP95.toFixed(2)}ms

🔄 Token Usage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Real Tokens:          ${realTokens.toLocaleString()}
  Fallback Tokens:      ${fallbackTokens.toLocaleString()}
  Fallback Rate:        ${fallbackRate}%

${rps >= 30000 ? '✅ 30k RPS 목표 달성!' : rps >= 20000 ? '⚠️  20k RPS 달성 (30k 목표 근접)' : '❌ 30k RPS 목표 미달성'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}