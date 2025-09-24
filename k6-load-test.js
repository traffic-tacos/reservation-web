import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// 커스텀 메트릭
const errorRate = new Rate('errors');
const successRate = new Rate('success');

export const options = {
  // 부하테스트 시나리오
  scenarios: {
    // 점진적 증가
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 1000 },   // 2분간 1000 VU까지
        { duration: '5m', target: 5000 },   // 5분간 5000 VU까지
        { duration: '10m', target: 10000 }, // 10분간 10000 VU 유지
        { duration: '5m', target: 0 },      // 5분간 점진적 감소
      ],
    },

    // 스파이크 테스트
    spike: {
      executor: 'ramping-vus',
      startTime: '22m',
      startVUs: 1000,
      stages: [
        { duration: '30s', target: 30000 }, // 30초 만에 30000 VU
        { duration: '1m', target: 30000 },  // 1분간 30000 VU 유지
        { duration: '30s', target: 1000 },  // 30초 만에 1000 VU로 감소
      ],
    }
  },

  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%가 500ms 미만
    http_req_failed: ['rate<0.01'],   // 실패율 1% 미만
    'success': ['rate>0.99'],         // 성공률 99% 이상
  }
};

// 테스트 시나리오들
const scenarios = [
  { path: '/api/v1/reservations', method: 'GET', weight: 40 },
  { path: '/api/v1/events', method: 'GET', weight: 30 },
  { path: '/healthz', method: 'GET', weight: 20 },
  { path: '/api/v1/queue/status', method: 'GET', weight: 10 },
];

function getRandomScenario() {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }
  return scenarios[0];
}

export default function() {
  const scenario = getRandomScenario();
  const baseUrl = 'http://localhost:8000';

  // 부하테스트 전용 헤더
  const headers = {
    'Authorization': 'Bearer load-test-bypass-token',
    'X-Load-Test': 'true',
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test/1.0'
  };

  // API 호출
  const response = http.request(
    scenario.method,
    `${baseUrl}${scenario.path}`,
    null,
    { headers }
  );

  // 응답 검증
  const success = check(response, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
    'has content': (r) => r.body.length > 0,
  });

  // 메트릭 기록
  if (success) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    console.log(`❌ Failed request: ${scenario.method} ${scenario.path} - Status: ${response.status}`);
  }

  // 100-200ms 랜덤 대기 (실제 사용자 시뮬레이션)
  sleep(0.1 + Math.random() * 0.1);
}

// 테스트 완료 후 실행
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const { indent = '', enableColors = false } = options;

  return `
${indent}📊 Load Test Summary
${indent}====================
${indent}Total Requests: ${data.metrics.http_reqs.count}
${indent}Success Rate: ${(data.metrics.success?.rate * 100).toFixed(2)}%
${indent}Error Rate: ${(data.metrics.errors?.rate * 100).toFixed(2)}%
${indent}Avg Response Time: ${data.metrics.http_req_duration.avg.toFixed(2)}ms
${indent}95th Percentile: ${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms
${indent}Max Response Time: ${data.metrics.http_req_duration.max.toFixed(2)}ms
${indent}RPS: ${(data.metrics.http_reqs.count / (data.state.testRunDurationMs / 1000)).toFixed(2)}
  `;
}