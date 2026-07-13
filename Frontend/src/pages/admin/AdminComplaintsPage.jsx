import { useState, useEffect, useMemo } from 'react'
import adminAPI from '../../api/adminApi'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineCheckBadge,
  HiOutlineChartBarSquare,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'

const TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']

const STATUS_COLORS = {
  Open: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Progress': 'bg-sky-50 text-sky-700 ring-sky-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-gray-100 text-gray-700 ring-gray-200',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [respondingTo, setRespondingTo] = useState(null)
  const [responseStatus, setResponseStatus] = useState('')
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getComplaints()
      if (res.data.status === 'success') setComplaints(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async () => {
    if (!respondingTo || !responseStatus || !responseText.trim()) return
    setSubmitting(true)
    try {
      const res = await adminAPI.updateComplaint({
        complaint_id: respondingTo.id,
        status: responseStatus,
        admin_response: responseText.trim(),
      })
      if (res.data.status === 'success') {
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === respondingTo.id
              ? { ...c, status: responseStatus, admin_response: responseText.trim() }
              : c
          )
        )
        setRespondingTo(null)
        setResponseStatus('')
        setResponseText('')
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !search ||
        c.subject?.toLowerCase().includes(q) ||
        c.user_name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      const matchTab = activeTab === 'All' || c.status === activeTab
      return matchSearch && matchTab
    })
  }, [complaints, search, activeTab])

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      open: complaints.filter((c) => c.status === 'Open').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
      closed: complaints.filter((c) => c.status === 'Closed').length,
    }
  }, [complaints])

  const tabCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab] = tab === 'All' ? complaints.length : complaints.filter((c) => c.status === tab).length
      return acc
    }, {})
  }, [complaints])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Complaints Management</h1>
          <p className="text-sm text-secondary-text mt-1">
            View, manage, and respond to all user complaints
          </p>
        </div>
        <button
          onClick={loadComplaints}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} icon={HiOutlineChartBarSquare} tone="gray" />
        <StatCard label="Open" value={stats.open} icon={HiOutlineExclamationTriangle} tone="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={HiOutlineClock} tone="sky" />
        <StatCard label="Resolved" value={stats.resolved} icon={HiOutlineCheckBadge} tone="emerald" />
        <StatCard label="Closed" value={stats.closed} icon={HiOutlineXCircle} tone="gray" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by subject, user, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-divider text-secondary-text hover:bg-border'
                }`}
            >
              {tab} ({tabCounts[tab] || 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="dashboard-card p-5 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-divider rounded w-1/3" />
                <div className="h-6 bg-divider rounded-full w-20" />
              </div>
              <div className="h-4 bg-divider rounded w-1/4 mb-2" />
              <div className="h-4 bg-divider rounded w-3/4 mb-2" />
              <div className="h-4 bg-divider rounded w-2/3 mb-3" />
              <div className="flex gap-3">
                <div className="h-3 bg-divider rounded w-24" />
                <div className="h-3 bg-divider rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} onRespond={() => {
              setRespondingTo(complaint)
              setResponseStatus(complaint.status || 'Open')
              setResponseText(complaint.admin_response || '')
            }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-secondary-text font-medium">No complaints found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search ? 'Try a different search term' : 'No complaints have been filed yet'}
          </p>
        </div>
      )}

      {respondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRespondingTo(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-main-text">Respond to Complaint</h2>
                  <p className="text-sm text-secondary-text mt-1">Complaint #{respondingTo.id}</p>
                </div>
                <button
                  onClick={() => setRespondingTo(null)}
                  className="p-1 rounded-lg text-secondary-text hover:text-main-text hover:bg-divider transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-background rounded-lg p-4 mb-5">
                <p className="text-sm font-semibold text-main-text mb-1">{respondingTo.subject}</p>
                <p className="text-sm text-secondary-text">{respondingTo.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1.5">
                    Status
                  </label>
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1.5">
                    Admin Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response here..."
                    rows={5}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-divider">
                <button
                  onClick={() => setRespondingTo(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-divider text-secondary-text hover:bg-border transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting || !responseText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    gray: 'bg-gray-50 text-gray-600 ring-gray-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    sky: 'bg-sky-50 text-sky-600 ring-sky-200',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  }

  return (
    <div className="dashboard-card p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary-text">{label}</p>
        <p className="text-lg font-bold text-main-text">{value}</p>
      </div>
    </div>
  )
}

function ComplaintCard({ complaint: c, onRespond }) {
  return (
    <div className="dashboard-card p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineDocumentText className="w-4 h-4 text-secondary-text flex-shrink-0" />
            <h3 className="text-sm font-bold text-main-text truncate">{c.subject}</h3>
            <span className="font-mono text-xs text-primary">#{c.id}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <HiOutlineUserCircle className="w-4 h-4 text-secondary-text flex-shrink-0" />
            <p className="text-sm text-main-text">{c.user_name || 'Unknown User'}</p>
            {c.user_email && (
              <span className="text-xs text-secondary-text">({c.user_email})</span>
            )}
            {c.user_role && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {c.user_role}
              </span>
            )}
          </div>

          <p className="text-sm text-secondary-text line-clamp-2">{c.description}</p>
        </div>

        <span className={`inline-flex items-center self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_COLORS[c.status] || ''}`}>
          {c.status}
        </span>
      </div>

      {c.admin_response && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
          <p className="text-xs font-semibold text-primary mb-1">Admin Response</p>
          <p className="text-sm text-secondary-text">{c.admin_response}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-divider">
        <div className="flex items-center gap-4 text-xs text-secondary-text">
          <span className="flex items-center gap-1">
            <HiOutlineCalendarDays className="w-3.5 h-3.5" />
            Created: {formatDate(c.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <HiOutlineCalendarDays className="w-3.5 h-3.5" />
            Updated: {formatDate(c.updated_at)}
          </span>
        </div>

        <button
          onClick={onRespond}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
          Respond
        </button>
      </div>
    </div>
  )
}
