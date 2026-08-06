

// Overwriting the flashy AdIcon with a minimalist, monochrome version
export function AdIcon({ title }) {
  const lower = title.toLowerCase()
  let name = 'card'
  
  if (lower.includes('home')) name = 'home'
  else if (lower.includes('wheeler') || lower.includes('vehicle')) name = 'trending'
  else if (lower.includes('business')) name = 'chart'
  else if (lower.includes('gold') || lower.includes('personal')) name = 'rupee'
  
  return (
    <div style={{
      width: 40,
      height: 40,
      display: 'grid',
      placeItems: 'center',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-medium)',
      background: 'var(--bg-secondary)',
      color: 'var(--text-secondary)'
    }}>
      <Icon name={name} size={18} />
    </div>
  )
}

// HeroArt is removed via CSS, but we return null here just to be safe if it's imported
export function HeroArt() {
  return null
}

// Re-export original icons map
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

export function Icon({ name, size = 16, className = '' }) {
  const paths = P[name]
  if (!paths) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
