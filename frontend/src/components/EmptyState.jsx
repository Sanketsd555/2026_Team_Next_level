import { Icon } from './Icons'

export default function EmptyState({ icon = 'doc', title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={22} />
      </div>
      {title && <div className="empty-state-title">{title}</div>}
      {message && <div className="empty-state-text">{message}</div>}
    </div>
  )
}
