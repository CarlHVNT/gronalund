export function formatElapsed(startMs) {
  if (!startMs) return '0m'
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}`
  return `${m}m`
}
