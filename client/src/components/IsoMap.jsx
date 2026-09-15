// Isometric park plate, adapted from mockup 3a. The ride volumes are static
// decoration (kept pixel-faithful to the source); the numbered pins are
// data-driven so they reflect each checkpoint's live status.

function StaticParkArt({ theme }) {
  return (
    <g style={{ filter: theme.isDark ? 'brightness(.55) saturate(1.2)' : 'none' }}>
      <g transform="translate(200,318) rotate(-40) scale(1,0.54)">
        <rect x="-200" y="-200" width="400" height="400" rx="46" fill="#D7EDDB" />
        <rect x="-200" y="-200" width="400" height="64" rx="40" fill="#C5E2CB" />
        <path
          d="M-130 140C-150 60-160-40-60-150-20-200 120-200 170-160 210-120 180-80 120-60 160-20 170 40 150 90 100 120 60 90 20 60-20 100-30 140-60 160Z"
          fill="none" stroke="#FFFFFF" strokeWidth="24" strokeLinejoin="round"
        />
        <path
          d="M-130 140C-150 60-160-40-60-150-20-200 120-200 170-160 210-120 180-80 120-60 160-20 170 40 150 90 100 120 60 90 20 60-20 100-30 140-60 160Z"
          fill="none" stroke="#E0B54A" strokeWidth="2.5" strokeDasharray="8 12"
        />
        <g fill="rgba(11,59,34,.10)">
          <ellipse cx="120" cy="-60" rx="30" ry="30" /><ellipse cx="-20" cy="-150" rx="34" ry="34" />
          <ellipse cx="150" cy="90" rx="30" ry="30" /><ellipse cx="20" cy="60" rx="28" ry="28" />
          <ellipse cx="-140" cy="-20" rx="30" ry="30" /><ellipse cx="-60" cy="160" rx="26" ry="26" />
          <ellipse cx="170" cy="-160" rx="24" ry="24" />
        </g>
        <g fill="#8FC79E">
          <circle cx="-90" cy="60" r="11" /><circle cx="-60" cy="30" r="8" />
          <circle cx="60" cy="-100" r="10" /><circle cx="100" cy="30" r="9" />
          <circle cx="-170" cy="-120" r="10" /><circle cx="30" cy="170" r="9" />
          <circle cx="190" cy="-40" r="8" /><circle cx="-110" cy="-90" r="8" />
        </g>
        <circle cx="65" cy="130" r="32" fill="#C5E2CB" stroke="#FFFFFF" strokeWidth="6" />
      </g>

      <g transform="translate(-54,28)">
        <path d="M258 169L258 141 266 141 266 169Z" fill="#9FD3AE" />
        <path d="M266 141L266 169 271 166 271 138Z" fill="#4E9E6B" />
        <path d="M248 150L277 150" stroke="#C8102E" strokeWidth="2.5" />
        <circle cx="262" cy="134" r="5" fill="#E0B54A" />
      </g>

      <g>
        <path d="M254 233L254 143 266 143 266 233Z" fill="#9FD3AE" />
        <path d="M266 143L266 233 272 228 272 138Z" fill="#4E9E6B" />
        <path d="M254 143L266 143 272 138 260 138Z" fill="#E8F6EC" />
        <rect x="246" y="196" width="26" height="11" rx="3.5" fill="#E0B54A" />
        <circle cx="261" cy="132" r="5" fill="#C8102E" />
      </g>

      <g>
        <path d="M118 283L118 266M134 286L134 252M152 288L152 262M170 285L170 258" stroke="#9FD3AE" strokeWidth="3" strokeLinecap="round" />
        <path d="M110 284C118 246 132 238 146 258 160 278 166 248 178 256" fill="none" stroke="#C8102E" strokeWidth="4" strokeLinecap="round" />
        <circle cx="146" cy="243" r="11" fill="none" stroke="#C8102E" strokeWidth="3.2" />
      </g>

      <g>
        <path d="M313 272L325 246 337 272" fill="none" stroke="#4E9E6B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="325" cy="242" r="27" fill="none" stroke="#0E7C3A" strokeWidth="3.5" />
        <path d="M325 215L325 269M298 242L352 242M306 223L344 261M344 223L306 261" stroke="#9FD3AE" strokeWidth="2" />
        <g fill="#E0B54A"><circle cx="325" cy="215" r="4" /><circle cx="352" cy="242" r="4" /><circle cx="325" cy="269" r="4" /><circle cx="298" cy="242" r="4" /></g>
        <circle cx="325" cy="242" r="4.5" fill="#C8102E" />
      </g>

      <g>
        <ellipse cx="231" cy="331" rx="27" ry="12" fill="#9FD3AE" />
        <path d="M231 303L207 322 255 322Z" fill="#C8102E" />
        <rect x="229" y="310" width="4" height="22" fill="#E8F6EC" />
        <path d="M213 322L213 330M249 322L249 330" stroke="#E8F6EC" strokeWidth="3" />
        <circle cx="231" cy="300" r="4" fill="#E0B54A" />
      </g>

      <g>
        <path d="M79 365L103 353 127 365 103 377Z" fill="#E8F6EC" />
        <path d="M79 365L103 377 103 401 79 389Z" fill="#9FD3AE" />
        <path d="M103 377L127 365 127 389 103 401Z" fill="#6FB884" />
        <rect x="86" y="380" width="9" height="13" rx="1.5" fill="#E0B54A" />
        <circle cx="103" cy="349" r="4" fill="#C8102E" />
      </g>

      <g>
        <path d="M190 404L209 396 228 404 209 412Z" fill="#E8F6EC" />
        <path d="M190 404L209 412 209 428 190 420Z" fill="#9FD3AE" />
        <path d="M209 412L228 404 228 420 209 428Z" fill="#6FB884" />
        <path d="M209 396L209 384 222 388 209 392" fill="#E0B54A" stroke="#E0B54A" strokeWidth="1.5" />
      </g>

      <g>
        <path d="M136 444L136 422 142 419 142 441Z" fill="#0E7C3A" />
        <path d="M176 444L176 422 182 419 182 441Z" fill="#0E7C3A" />
        <path d="M136 422L142 419 182 419 176 422Z" fill="#E0B54A" />
        <rect x="139" y="406" width="40" height="12" rx="3.5" fill="#C8102E" />
      </g>

      <g>
        <path d="M279 314L295 306 311 314 295 322Z" fill="#E8F6EC" />
        <path d="M279 314L295 322 295 338 279 330Z" fill="#9FD3AE" />
        <path d="M295 322L311 314 311 330 295 338Z" fill="#6FB884" />
        <rect x="284" y="322" width="7" height="10" rx="1.5" fill="#E0B54A" />
        <circle cx="295" cy="301" r="4" fill="#C8102E" />
      </g>
    </g>
  )
}

export function IsoMap({ theme, checkpoints, progress, currentId, onSelect }) {
  const current = checkpoints.find((c) => c.id === currentId)
  const youPos = current ? { x: current.pin.x - 26, y: current.pin.y + 22 } : null

  return (
    <svg viewBox="0 0 402 620" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <rect width="402" height="620" fill={theme.mapBg} />
      <path
        d="M0 0h402v150c-70 34-150 24-250 62C86 240 30 232 0 250Z"
        fill={theme.isDark ? '#0A2417' : '#B7D6E2'}
        opacity={theme.isDark ? 0.6 : 1}
      />
      <g transform="translate(0,64) scale(1.04)">
        <StaticParkArt theme={theme} />

        {youPos && (
          <g>
            <circle cx={youPos.x} cy={youPos.y} r="21" fill={theme.youHalo} />
            <circle cx={youPos.x} cy={youPos.y} r="8" fill={theme.you} stroke="#fff" strokeWidth="3" />
          </g>
        )}

        {checkpoints.map((cp) => {
          const status = progress[cp.id]?.status
          const isCurrent = cp.id === currentId
          const r = isCurrent ? cp.pin.r + 3 : cp.pin.r
          let fill = theme.pinIdleBg
          let stroke = theme.pinIdleFg
          let labelFill = theme.pinIdleFg
          if (status === 'found') {
            fill = theme.pinFound
            stroke = theme.pinFound
            labelFill = theme.pinFoundFg
          } else if (status === 'missed') {
            fill = theme.pinIdleBg
            stroke = theme.pinMissed
            labelFill = theme.pinMissed
          } else if (isCurrent) {
            fill = theme.pinCurrent
            stroke = '#fff'
            labelFill = theme.pinCurrentFg
          }
          return (
            <g
              key={cp.id}
              transform={`translate(${cp.pin.x},${cp.pin.y})`}
              onClick={() => onSelect(cp.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={cp.name}
            >
              <circle r={r} fill={fill} stroke={stroke} strokeWidth={status || isCurrent ? 0 : 2.2} />
              <text
                y={5}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans',sans-serif"
                fontSize="13"
                fontWeight="800"
                fill={labelFill}
              >
                {cp.order}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
