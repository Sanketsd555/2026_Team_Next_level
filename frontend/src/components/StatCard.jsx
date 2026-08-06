import { Icon } from './Icons'

export default function StatCard({ icon, iconColor = 'accent', value, label, colorClass = '' }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className={`stat-icon ${iconColor}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
