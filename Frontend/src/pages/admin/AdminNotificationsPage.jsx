import adminAPI from '../../api/adminApi'
import NotificationPage from '../../components/NotificationPage'

export default function AdminNotificationsPage() {
  return <NotificationPage apiClient={adminAPI} />
}
