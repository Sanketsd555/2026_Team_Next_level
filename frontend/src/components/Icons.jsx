/* Icon library — refactored from Illustrations.jsx with same SVG paths */

const P = {
  user: [
    <circle key="a" cx="12" cy="8" r="4" />,
    <path key="b" d="M4 21c1.2-3.6 4.2-5.5 8-5.5s6.8 1.9 8 5.5" />,
  ],
  users: [
    <path key="a" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />,
    <circle key="b" cx="9" cy="7" r="4" />,
    <path key="c" d="M23 21v-2a4 4 0 0 0-3-3.87" />,
    <path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ],
  bank: [
    <path key="a" d="M3 21h18" />,
    <path key="b" d="M5 21V8l7-4 7 4v13" />,
    <path key="c" d="M9 21v-6h6v6" />,
    <path key="d" d="M9 12h.01M15 12h.01" />,
  ],
  admin: [
    <path key="a" d="M12 3l9 5-9 5-9-5 9-5z" />,
    <path key="b" d="M3 13l9 5 9-5" />,
    <path key="c" d="M3 17l9 5 9-5" />,
  ],
  logout: [
    <path key="a" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />,
    <path key="b" d="M16 17l5-5-5-5" />,
    <path key="c" d="M21 12H9" />,
  ],
  send: [
    <path key="a" d="M22 2L11 13" />,
    <path key="b" d="M22 2l-7 20-4-9-9-4 20-7z" />,
  ],
  check: [
    <path key="a" d="M20 6L9 17l-5-5" />,
  ],
  cross: [
    <circle key="a" cx="12" cy="12" r="9" />,
    <path key="b" d="M9 9l6 6M15 9l-6 6" />,
  ],
  clock: [
    <circle key="a" cx="12" cy="12" r="9" />,
    <path key="b" d="M12 7v5l3 2" />,
  ],
  email: [
    <rect key="a" x="3" y="5" width="18" height="14" rx="3" />,
    <path key="b" d="M3 7l9 6 9-6" />,
  ],
  lock: [
    <rect key="a" x="4" y="10" width="16" height="11" rx="3" />,
    <path key="b" d="M8 10V7a4 4 0 0 1 8 0v3" />,
  ],
  doc: [
    <path key="a" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
    <path key="b" d="M14 2v6h6" />,
    <path key="c" d="M9 13l2 2 4-4" />,
  ],
  card: [
    <rect key="a" x="2" y="5" width="20" height="14" rx="3" />,
    <path key="b" d="M2 10h20" />,
  ],
  wallet: [
    <path key="a" d="M20 7H6a2 2 0 0 1-2-2 2 2 0 0 1 2-2h12v4" />,
    <rect key="b" x="4" y="5" width="18" height="15" rx="3" />,
    <circle key="c" cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" />,
  ],
  arrow: [
    <path key="a" d="M5 12h14" />,
    <path key="b" d="M13 6l6 6-6 6" />,
  ],
  key: [
    <circle key="a" cx="8" cy="15" r="4" />,
    <path key="b" d="M10.8 12.2L21 2" />,
    <path key="c" d="M17 6l2 2" />,
  ],
  landmark: [
    <path key="a" d="M4 9l8-5 8 5" />,
    <path key="b" d="M5 9h14l-1 10H6L5 9z" />,
    <path key="c" d="M3 21h18" />,
    <path key="d" d="M12 12v3" />,
  ],
  phone: [
    <path key="a" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9z" />,
  ],
  calendar: [
    <rect key="a" x="3" y="5" width="18" height="16" rx="3" />,
    <path key="b" d="M8 3v4M16 3v4M3 10h18" />,
  ],
  plus: [
    <path key="a" d="M12 5v14" />,
    <path key="b" d="M5 12h14" />,
  ],
  edit: [
    <path key="a" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
    <path key="b" d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
  ],
  trash: [
    <path key="a" d="M3 6h18" />,
    <path key="b" d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    <path key="c" d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />,
    <path key="d" d="M10 11v6M14 11v6" />,
  ],
  chart: [
    <path key="a" d="M3 3v18h18" />,
    <rect key="b" x="7" y="12" width="3" height="6" />,
    <rect key="c" x="12" y="8" width="3" height="10" />,
    <rect key="d" x="17" y="5" width="3" height="13" />,
  ],
  sun: [
    <circle key="a" cx="12" cy="12" r="5" />,
    <path key="b" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />,
  ],
  moon: [
    <path key="a" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  ],
  menu: [
    <path key="a" d="M3 12h18M3 6h18M3 18h18" />,
  ],
  close: [
    <path key="a" d="M18 6L6 18" />,
    <path key="b" d="M6 6l12 12" />,
  ],
  home: [
    <path key="a" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    <path key="b" d="M9 22V12h6v10" />,
  ],
  rupee: [],
  search: [
    <circle key="a" cx="11" cy="11" r="7" />,
    <path key="b" d="M21 21l-4.35-4.35" />,
  ],
  shield: [
    <path key="a" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    <path key="b" d="M9 12l2 2 4-4" />,
  ],
  sparkles: [
    <path key="a" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />,
    <path key="b" d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />,
  ],
  trending: [
    <path key="a" d="M3 17l6-6 4 4 8-8" />,
    <path key="b" d="M14 7h7v7" />,
  ],
}

const rupee = (
  <text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" stroke="none">₹</text>
)

export function Icon({ name, size = 18, className = '' }) {
  const paths = P[name]
  if (!paths) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
      {name === 'rupee' ? rupee : null}
    </svg>
  )
}

/* Ad illustration icons — kept from original */
const iconShell = (art) => (
  <svg role="img" aria-label="Loan icon" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="ad-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--accent)" stopOpacity="0.15" />
        <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="104" height="104" rx="20" fill="url(#ad-bg)" stroke="var(--border)" strokeWidth="1" />
    {art}
  </svg>
)

export function AdIcon({ title }) {
  const lower = title.toLowerCase()
  let art
  if (lower.includes('home')) {
    art = (
      <g key="home">
        <rect x="28" y="48" width="64" height="44" rx="4" fill="var(--surface-inset)" />
        <path d="M18 54l42-30 42 30" fill="none" stroke="var(--success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="48" y="66" width="24" height="26" rx="3" fill="var(--accent)" />
        <circle cx="60" cy="79" r="3" fill="var(--warning)" />
        <path d="M70 48h16v14h-16z" fill="var(--warning)" />
      </g>
    )
  } else if (lower.includes('wheeler') || lower.includes('vehicle')) {
    art = (
      <g key="vehicle">
        <path d="M20 78c0-9 7-16 16-16h42l10 16" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M70 62l-8-22H42l-6 22" fill="none" stroke="var(--text-secondary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="38" cy="84" r="10" fill="none" stroke="var(--success)" strokeWidth="5" />
        <circle cx="82" cy="84" r="10" fill="none" stroke="var(--success)" strokeWidth="5" />
        <circle cx="38" cy="84" r="3" fill="var(--success)" />
        <circle cx="82" cy="84" r="3" fill="var(--success)" />
      </g>
    )
  } else if (lower.includes('business')) {
    art = (
      <g key="business">
        <rect x="28" y="44" width="64" height="46" rx="6" fill="var(--surface-inset)" />
        <path d="M42 44v-8a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v8" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="68" r="9" fill="none" stroke="var(--success)" strokeWidth="5" />
        <path d="M55 68l4 4 6-7" fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    )
  } else if (lower.includes('gold')) {
    art = (
      <g key="gold">
        <circle cx="60" cy="62" r="30" fill="var(--warning)" />
        <circle cx="60" cy="62" r="22" fill="none" stroke="#b45309" strokeWidth="4" />
        <text x="60" y="70" textAnchor="middle" fontSize="24" fontWeight="700" fill="#78350f">₹</text>
        <circle cx="60" cy="62" r="8" fill="#fde68a" opacity="0.8" />
      </g>
    )
  } else if (lower.includes('personal') || lower.includes('quick')) {
    art = (
      <g key="banknote">
        <rect x="24" y="40" width="72" height="44" rx="8" fill="var(--accent)" />
        <rect x="30" y="46" width="60" height="32" rx="5" fill="var(--surface-inset)" />
        <circle cx="60" cy="62" r="9" fill="none" stroke="var(--warning)" strokeWidth="4" />
        <text x="60" y="66" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--warning)">₹</text>
      </g>
    )
  } else {
    art = (
      <g key="coin">
        <ellipse cx="60" cy="44" rx="34" ry="12" fill="var(--surface-inset)" />
        <ellipse cx="60" cy="56" rx="34" ry="12" fill="var(--warning)" />
        <ellipse cx="60" cy="68" rx="34" ry="12" fill="var(--warning)" />
        <ellipse cx="60" cy="80" rx="34" ry="12" fill="var(--surface-inset)" />
        <text x="60" y="72" textAnchor="middle" fontSize="16" fontWeight="700" fill="#78350f">₹</text>
      </g>
    )
  }
  return iconShell(<g>{art}</g>)
}

export function HeroArt() {
  return (
    <svg viewBox="0 0 360 240" width="360" height="240" role="img" aria-label="Loan illustration" className="hero-art">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.15" />
          <stop offset="1" stopColor="var(--success)" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="240" rx="24" fill="url(#sky)" />
      <circle cx="300" cy="40" r="60" fill="var(--accent)" opacity="0.08" />
      <circle cx="40" cy="210" r="70" fill="var(--success)" opacity="0.06" />
      <g transform="translate(40 60)">
        <path d="M4 96h112M16 96V68h88v28" fill="none" stroke="var(--text-muted)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 68l52-34 52 34" fill="none" stroke="var(--success)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <g stroke="var(--text-muted)" strokeWidth="5" strokeLinecap="round">
          <line x1="36" y1="68" x2="36" y2="96" />
          <line x1="60" y1="68" x2="60" y2="96" />
          <line x1="84" y1="68" x2="84" y2="96" />
        </g>
      </g>
      <g transform="translate(206 96)">
        <rect x="0" y="28" width="44" height="34" rx="5" fill="url(#gold)" />
        <rect x="14" y="8" width="44" height="34" rx="5" fill="url(#gold)" opacity="0.85" />
        <text x="36" y="31" textAnchor="middle" fontSize="17" fontWeight="800" fill="#78350f">₹</text>
      </g>
      <g transform="translate(150 130)">
        <rect x="0" y="42" width="52" height="36" rx="5" fill="url(#gold)" opacity="0.6" />
        <rect x="16" y="22" width="52" height="36" rx="5" fill="url(#gold)" opacity="0.85" />
        <text x="42" y="46" textAnchor="middle" fontSize="17" fontWeight="800" fill="#78350f">₹</text>
      </g>
      <path d="M64 196h70" stroke="var(--border-strong)" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 196l40-44 22 14 30-40" fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="156" cy="126" r="6" fill="var(--success)" />
      <path d="M152 112l-3 9 9 3" fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="rotate(-8 292 170)">
        <rect x="248" y="150" width="88" height="56" rx="9" fill="url(#cardGrad)" />
        <rect x="258" y="162" width="26" height="18" rx="3" fill="#fbbf24" />
        <rect x="258" y="188" width="40" height="7" rx="3.5" fill="white" opacity="0.5" />
        <path d="M314 160h10M314 168h10" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  )
}
