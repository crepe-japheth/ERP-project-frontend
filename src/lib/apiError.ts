export function getApiDetail(error: unknown, fallback = 'Request failed.') {
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data
    if (!data) return fallback
    if (typeof data.detail === 'string' && data.detail) return data.detail
    const first = Object.values(data)[0]
    if (typeof first === 'string' && first) return first
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  }
  return fallback
}
