import userAPI from '../../api/userApi'
import NotificationPage from '../../components/NotificationPage'

export default function UserNotificationsPage() {
  return <NotificationPage apiClient={userAPI} />
}
