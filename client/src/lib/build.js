// Build stamp injected by vite.config.js (define), shown in the menu footer so
// anyone can tell which version a phone is running.
/* global __APP_BUILD__ */
export const BUILD = typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : { time: 'dev', commit: 'dev' }

export function buildLabel() {
  if (BUILD.time === 'dev') return 'dev'
  const d = new Date(BUILD.time)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} · ${BUILD.commit}`
}
