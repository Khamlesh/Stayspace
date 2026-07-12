import { useEffect, useMemo, useState } from 'react'
import { adminAPI } from '../api/client'
import { formatRupees } from '../utils/currency'

const emptyStats = {
  total_users: 0,
  total_guests: 0,
  total_hosts: 0,
  active_hosts: 0,
  pending_hosts: 0,
  total_properties: 0,
  total_bookings: 0,
  active_bookings: 0,
  total_revenue: 0,
  total_reviews: 0
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'U'

const StatusPill = ({ children, tone = 'gray' }) => {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    gray: 'bg-gray-50 text-gray-700 ring-gray-200'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  )
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(emptyStats)
  const [guests, setGuests] = useState([])
  const [hosts, setHosts] = useState([])
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'guests', label: 'Users' },
    { id: 'hosts', label: 'Hosts' },
    { id: 'properties', label: 'Properties' },
    { id: 'bookings', label: 'Bookings' }
  ]

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    setError('')

    try {
      const [statsRes, guestsRes, hostsRes, propertiesRes, bookingsRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.guests(),
        adminAPI.hosts(),
        adminAPI.properties(),
        adminAPI.bookings()
      ])

      setStats(statsRes.data.data || emptyStats)
      setGuests(guestsRes.data.data || [])
      setHosts(hostsRes.data.data || [])
      setProperties(propertiesRes.data.data || [])
      setBookings(bookingsRes.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings])
  const activeHosts = useMemo(() => hosts.filter(host => host.is_approved), [hosts])
  const pendingHosts = useMemo(() => hosts.filter(host => !host.is_approved), [hosts])

  const kpis = [
    { label: 'Total Users', value: stats.total_users, detail: `${stats.total_guests} users, ${stats.total_hosts} hosts` },
    { label: 'Active Hosts', value: stats.active_hosts, detail: `${stats.pending_hosts} pending approvals` },
    { label: 'Properties', value: stats.total_properties, detail: `${stats.total_reviews} reviews collected` },
    { label: 'Revenue', value: formatRupees(stats.total_revenue), detail: `${stats.total_bookings} total bookings` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-primary">Live Admin Console</p>
            <h1 className="text-4xl font-bold text-gray-950">StaySpace Operations</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Real users, hosts, properties, and booking metrics from the current database.
            </p>
          </div>
          <button onClick={loadAdminData} className="btn-outline w-fit">
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-500">{kpi.label}</p>
              <p className="mt-3 text-3xl font-bold text-gray-950">{loading ? '...' : kpi.value}</p>
              <p className="mt-2 text-sm text-gray-600">{kpi.detail}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
            Loading admin data...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-950">Recent Bookings</h2>
                    <StatusPill tone="blue">{stats.active_bookings} active</StatusPill>
                  </div>
                  {recentBookings.length ? (
                    <div className="space-y-3">
                      {recentBookings.map(booking => (
                        <div key={booking.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-950">Booking #{booking.id}</p>
                              <StatusPill tone={
                                booking.status === 'Confirmed' ? 'green' :
                                booking.status === 'Pending' ? 'yellow' :
                                booking.status === 'Completed' ? 'blue' :
                                booking.status === 'Checked-In' ? 'blue' : 'red'
                              }>
                                {booking.status}
                              </StatusPill>
                              {booking.property_type && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium">{booking.property_type}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{booking.guest_name} → {booking.host_name} · {booking.property_title}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(booking.check_in)} to {formatDate(booking.check_out)}</p>
                            {booking.payment_method && (
                              <p className="text-xs text-gray-400 mt-0.5">Paid via {booking.payment_method} · Txn: {booking.transaction_id || 'N/A'}</p>
                            )}
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-bold text-primary">{formatRupees(booking.total_price)}</p>
                            <p className="text-xs text-gray-500">{booking.guests_count || 1} guest{(booking.guests_count || 1) > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-gray-50 p-6 text-gray-600">No bookings have been created yet.</p>
                  )}
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-xl font-bold text-gray-950">Host Snapshot</h2>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">Approved Hosts</p>
                      <p className="mt-2 text-3xl font-bold text-emerald-900">{activeHosts.length}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-700">Pending Hosts</p>
                      <p className="mt-2 text-3xl font-bold text-amber-900">{pendingHosts.length}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-700">Average Properties Per Host</p>
                      <p className="mt-2 text-3xl font-bold text-gray-950">
                        {hosts.length ? (properties.length / hosts.length).toFixed(1) : '0.0'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'guests' && (
              <DataTable
                title="Users"
                description="User accounts from the database. Hosts are listed in their own section."
                columns={['User', 'Email', 'Bookings', 'Booking Value', 'Joined']}
                rows={guests.map(guest => [
                  <PersonCell key="person" name={guest.name} subtitle={`User ID ${guest.id}`} />,
                  guest.email,
                  guest.bookings,
                  formatRupees(guest.booking_value),
                  formatDate(guest.created_at)
                ])}
                emptyText="No user accounts found."
              />
            )}

            {activeTab === 'hosts' && (
              <DataTable
                title="Hosts"
                description="Approved and pending hosts, separated from user accounts."
                columns={['Host', 'Email', 'Status', 'Properties', 'Revenue', 'Joined']}
                rows={hosts.map(host => [
                  <PersonCell key="person" name={host.name} subtitle={`Host ID ${host.host_id}`} />,
                  host.email,
                  <StatusPill key="status" tone={host.is_approved ? 'green' : 'yellow'}>
                    {host.is_approved ? 'Approved' : 'Pending'}
                  </StatusPill>,
                  host.properties,
                  formatRupees(host.revenue),
                  formatDate(host.created_at)
                ])}
                emptyText="No host accounts found."
              />
            )}

            {activeTab === 'properties' && (
              <DataTable
                title="Properties"
                description="Current listings and host ownership from the database."
                columns={['Property', 'Host', 'Price', 'Bookings', 'Rating']}
                rows={properties.map(property => [
                  <div key="property">
                    <p className="font-semibold text-gray-950">{property.title}</p>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </div>,
                  property.host_name,
                  `${formatRupees(property.price_per_night)}/night`,
                  property.bookings,
                  property.average_rating ? property.average_rating.toFixed(1) : 'N/A'
                ])}
                emptyText="No properties found."
              />
            )}

            {activeTab === 'bookings' && (
              <DataTable
                title="Bookings"
                description="All platform bookings with guest, host, property, dates, payment, and status."
                columns={['Booking', 'Guest', 'Host', 'Property', 'Dates', 'Amount', 'Payment', 'Status']}
                rows={bookings.map(booking => [
                  <span key="id" className="font-mono text-xs">#{booking.id}</span>,
                  <div key="guest">
                    <p className="font-medium text-gray-950">{booking.guest_name}</p>
                    <p className="text-xs text-gray-500">{booking.guest_email}</p>
                  </div>,
                  <div key="host">
                    <p className="font-medium text-gray-950">{booking.host_name}</p>
                    <p className="text-xs text-gray-500">{booking.host_email}</p>
                  </div>,
                  <div key="prop">
                    <p className="font-medium text-gray-950">{booking.property_title}</p>
                    {booking.property_type && <span className="text-xs text-sky-600">{booking.property_type}</span>}
                  </div>,
                  <div key="dates">
                    <p className="text-xs">{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p>
                    <p className="text-xs text-gray-500">{booking.nights || Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000*60*60*24)))} nights · {booking.guests_count || 1} guest(s)</p>
                  </div>,
                  formatRupees(booking.total_price),
                  <div key="pay">
                    <p className="text-xs font-medium">{booking.payment_method || 'N/A'}</p>
                    {booking.transaction_id && <p className="text-xs text-gray-400 font-mono">{booking.transaction_id}</p>}
                  </div>,
                  <StatusPill key="status" tone={
                    booking.status === 'Confirmed' ? 'green' :
                    booking.status === 'Pending' ? 'yellow' :
                    booking.status === 'Completed' ? 'blue' :
                    booking.status === 'Checked-In' ? 'blue' : 'red'
                  }>
                    {booking.status}
                  </StatusPill>
                ])}
                emptyText="No bookings found."
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

const PersonCell = ({ name, subtitle }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
      {initials(name)}
    </div>
    <div>
      <p className="font-semibold text-gray-950">{name}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
)

const DataTable = ({ title, description, columns, rows, emptyText }) => (
  <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-950">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
    <div className="overflow-x-auto">
      {rows.length ? (
        <table className="w-full min-w-[1100px]">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th key={column} className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-500">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-100">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 text-sm text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-8 text-gray-600">{emptyText}</p>
      )}
    </div>
  </section>
)

export default AdminDashboard
