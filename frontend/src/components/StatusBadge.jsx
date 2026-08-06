import { Icon } from './Icons'

const statusConfig = {
  pending: { icon: 'clock', label: 'Pending' },
  approved: { icon: 'check', label: 'Approved' },
  rejected: { icon: 'cross', label: 'Rejected' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending
  return (
    <span className={`status-badge ${status}`}>
      <Icon name={config.icon} size={11} />
      {config.label}
    </span>
  )
}
