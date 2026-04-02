import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Clock } from 'lucide-react'
import { markAsRead, markAllAsRead } from '../slices/notificationsSlice'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { formatRelativeTime } from '../lib/utils'

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const { notifications, unreadCount } = useSelector((state) => state.notifications)

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead())
  }

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id))
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-charcoal-900 font-heading flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-2">{unreadCount} mới</Badge>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              icon={CheckCheck}
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Không có thông báo nào"
            description="Các thông báo về đơn hàng, khuyến mãi sẽ hiển thị ở đây"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <motion.div
                key={notif._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => !notif.isRead && handleMarkRead(notif._id || index)}
                className={`bg-white rounded-2xl p-4 shadow-card cursor-pointer transition-shadow hover:shadow-card-hover ${
                  !notif.isRead ? 'border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notif.isRead ? 'bg-primary/10' : 'bg-charcoal-100'
                  }`}>
                    <Bell className={`w-5 h-5 ${!notif.isRead ? 'text-primary' : 'text-charcoal-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${!notif.isRead ? 'text-charcoal-900' : 'text-charcoal-600'}`}>
                        {notif.title || 'Thông báo'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-charcoal-400" />
                        <span className="text-xs text-charcoal-400">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-charcoal-500 mt-1">{notif.message || notif.body}</p>
                    {notif.actionUrl && (
                      <a
                        href={notif.actionUrl}
                        className="text-xs text-primary font-medium mt-2 inline-block hover:underline"
                      >
                        Xem chi tiết
                      </a>
                    )}
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
