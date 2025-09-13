import { useMemo } from 'react'
import { generateIdempotencyKey } from '@/api/client'

/**
 * 멱등성 키를 생성하고 캐시하는 커스텀 훅
 * 같은 컴포넌트 인스턴스에서 재사용 시 동일한 키를 반환합니다.
 */
export function useIdempotencyKey(): string {
  return useMemo(() => generateIdempotencyKey(), [])
}

/**
 * 새로운 멱등성 키를 생성하는 함수
 * 매번 호출할 때마다 새로운 키를 생성합니다.
 */
export function useNewIdempotencyKey(): () => string {
  return useMemo(() => () => generateIdempotencyKey(), [])
}
