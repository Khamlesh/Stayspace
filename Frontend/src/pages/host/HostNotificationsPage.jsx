import hostAPI from '../../api/hostApi'
import NotificationPage from '../../components/NotificationPage'

export default function HostNotificationsPage() {
  return <NotificationPage apiClient={hostAPI} />
}
