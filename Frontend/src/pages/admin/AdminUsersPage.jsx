import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import { formatRupees } from '../../utils/currency'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineHomeModern,
  HiOutlineShieldCheck,
} from 'react-icons/hi2'

const ROLE_TABS = ['All', 'Guests', 'Hosts', 'Admins']

const ROLE_BADGE = {
  Guest: 'bg-blue-100 text-blue-700',
  Host: 'bg-green-100 text-green-700',
  Admin: 'bg-purple-100 text-purple-700',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'U'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.getUsers()
      setUsers(res.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId) => {
    setDeletingId(userId)
    try {
      await adminAPI.deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      const matchTab =
        activeTab === 'All' ||
        u.role?.toLowerCase() === activeTab.toLowerCase().replace(/s$/, '')
      return matchSearch && matchTab
    })
  }, [users, search, activeTab])

  const stats = useMemo(() => {
    const total = users.length
    const guests = users.filter((u) => u.role?.toLowerCase() === 'guest').length
    const hosts = users.filter((u) => u.role?.toLowerCase() === 'host').length
    const admins = users.filter((u) => u.role?.toLowerCase() === 'admin').length
    return { total, guests, hosts, admins }
  }, [users])

  const summaryCards = [
    { label: 'Total Users', value: stats.total, icon: HiOutlineUsers, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Guests', value: stats.guests, icon: HiOutlineUserGroup, color: 'text-sky-600 bg-sky-50' },
    { label: 'Total Hosts', value: stats.hosts, icon: HiOutlineHomeModern, color: 'text-green-600 bg-green-50' },
    { label: 'Total Admins', value: stats.admins, icon: HiOutlineShieldCheck, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Users Management</h1>
        <p className="text-sm text-secondary-text mt-1">View, search and manage all registered users</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="dashboard-card flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-secondary-text">{card.label}</p>
              <p className="text-2xl font-bold text-main-text">{loading ? '...' : card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-divider text-secondary-text hover:bg-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-divider bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Bookings
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Booking Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-divider">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-divider animate-pulse" />
                          <div className="h-4 w-28 rounded bg-divider animate-pulse" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 rounded bg-divider animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-16 rounded-full bg-divider animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-10 rounded bg-divider animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 rounded bg-divider animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-divider animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 rounded bg-divider animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                : filtered.length > 0
                ? filtered.map((user) => (
                    <tr key={user.id} className="border-b border-divider last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary flex-shrink-0">
                            {initials(user.name)}
                          </div>
                          <span className="font-medium text-main-text">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-text">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-main-text font-medium">{user.bookings ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-main-text font-medium">{formatRupees(user.booking_value)}</td>
                      <td className="px-6 py-4 text-sm text-secondary-text">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirmDelete(user)}
                          disabled={deletingId === user.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-4xl mb-3">👤</div>
                        <p className="text-secondary-text">No users found</p>
                        <p className="text-xs text-secondary-text mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <HiOutlineTrash className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-main-text text-center">Delete User</h2>
            <p className="text-sm text-secondary-text text-center mt-2">
              Are you sure you want to delete <span className="font-semibold text-main-text">{confirmDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-divider px-4 py-2.5 text-sm font-medium text-secondary-text hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
