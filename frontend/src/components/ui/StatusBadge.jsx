import { ORDER_STATUS_COLORS } from '../../constants'

export default function StatusBadge({ status }) {
  const config = ORDER_STATUS_COLORS[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: status,
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
