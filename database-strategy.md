# 🎯 3만 RPS 부하테스트를 위한 DB 전략

## 1. 💡 스마트 데이터 전략

### Option A: 가상 사용자 풀 (권장)
```sql
-- 1000명의 실제 사용자만 생성
INSERT INTO users (id, email, name) VALUES
('user-1', 'user1@test.com', 'Test User 1'),
('user-2', 'user2@test.com', 'Test User 2'),
...
('user-1000', 'user1000@test.com', 'Test User 1000');

-- 부하테스트에서는 user_id를 동적 생성
-- load-test-user-{random_id} 형태로 사용
```

### Option B: 사용자 존재 여부 우회
```go
// Gateway나 서비스에서 load-test-user- prefix 체크
func isLoadTestUser(userID string) bool {
    return strings.HasPrefix(userID, "load-test-user-")
}

func validateUser(userID string) error {
    if isLoadTestUser(userID) {
        return nil // 부하테스트 사용자는 검증 생략
    }
    // 실제 사용자는 DB 조회
    return checkUserInDB(userID)
}
```

## 2. 🚀 확장 가능한 아키텍처

### Cache Layer
```yaml
# Redis 클러스터로 인증 캐시
redis:
  cluster:
    - redis-1:6379
    - redis-2:6379
    - redis-3:6379

# 사용자 정보 캐싱 (1시간)
cache:
  user_profiles: "user:{id}"
  ttl: 3600
```

### Database Sharding
```sql
-- User ID 기반 샤딩
shard_1: user_id % 4 = 0
shard_2: user_id % 4 = 1
shard_3: user_id % 4 = 2
shard_4: user_id % 4 = 3
```

## 3. 📈 부하테스트 최적화

### K6 실행 명령어
```bash
# 로컬 테스트
k6 run k6-load-test.js

# 분산 테스트 (여러 머신에서)
k6 run --out json=results.json k6-load-test.js

# Cloud 테스트
k6 cloud k6-load-test.js
```

### 모니터링 설정
```yaml
# Prometheus + Grafana
monitoring:
  - k6 metrics → InfluxDB
  - Gateway metrics → Prometheus
  - Database metrics → Grafana
  - Real-time alerts → Slack
```

## 4. 🎭 현실적인 시나리오 믹스

### API 호출 비율
- 40% - 예약 조회 (GET /reservations)
- 30% - 이벤트 조회 (GET /events)
- 20% - Health check (GET /healthz)
- 10% - 대기열 상태 (GET /queue/status)

### 사용자 행동 패턴
- 80% - 조회만 하는 사용자
- 15% - 예약 시도하는 사용자
- 5% - 결제까지 완료하는 사용자

## 5. 💾 데이터 정리 전략

### 부하테스트 후 Cleanup
```sql
-- 부하테스트 데이터만 삭제
DELETE FROM reservations
WHERE user_id LIKE 'load-test-user-%';

DELETE FROM queue_entries
WHERE user_id LIKE 'load-test-user-%';

-- Cache 클리어
FLUSHDB 1;  -- Test DB만 클리어
```

## 6. 🔧 환경별 설정

### 개발 환경
- 100 VU, 1분 테스트
- 로컬 DB, 로컬 Redis

### 스테이징 환경
- 1000 VU, 10분 테스트
- AWS RDS, ElastiCache

### 운영 환경 (Blue-Green)
- 30000 VU, 30분 테스트
- Multi-AZ RDS, Redis 클러스터
- 실제 트래픽과 분리된 별도 환경

## 7. 📊 성공 지표

### 목표 SLA
- 응답시간: p95 < 500ms
- 가용성: 99.9%
- 에러율: < 0.1%
- 처리량: 30000 RPS

### 임계 지표
- CPU: < 80%
- Memory: < 85%
- DB Connection: < 90%
- Queue Depth: < 1000