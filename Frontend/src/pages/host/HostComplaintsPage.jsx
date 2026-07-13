import { useState, useEffect, useMemo } from 'react'
import hostAPI from '../../api/hostApi'
import {
  HiOutlineMagnifyingGlass,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
} from 'react-icons/hi2'

const TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']

const CATEGORIES = ['Customer', 'Booking', 'Payment', 'Property', 'Admin Support', 'Technical Issues', 'Other']

const STATUS_COLORS = {
  Open: 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-700',
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function HostComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ category: '', subject: '', description: '' })

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const res = await hostAPI.getComplaints()
      if (res.data.status === 'success') setComplaints(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.category || !form.subject.trim() || !form.description.trim()) return
    setSubmitting(true)
    try {
      const res = await hostAPI.createComplaint({
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
      })
      if (res.data.status === 'success') {
        setShowModal(false)
        setForm({ category: '', subject: '', description: '' })
        loadComplaints()
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit complaint')
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
        c.description?.toLowerCase().includes(q)
      const matchTab = activeTab === 'All' || c.status === activeTab
      return matchSearch && matchTab
    })
  }, [complaints, search, activeTab])

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
          <h1 className="text-2xl font-bold text-main-text">My Complaints</h1>
          <p className="text-sm text-secondary-text mt-1">
            Submit and track your complaints
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadComplaints}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-divider text-secondary-text hover:bg-border disabled:opacity-50 transition-colors"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <HiOutlineExclamationTriangle className="w-4 h-4" />
            Submit Complaint
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by subject or description..."
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
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 dashboard-card">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-secondary-text font-medium">No complaints found</p>
          <p className="text-sm text-secondary-text mt-1">
            {search ? 'Try a different search term' : 'You haven\'t filed any complaints yet'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-main-text">Submit Complaint</h2>
                  <p className="text-sm text-secondary-text mt-1">Describe your issue and we'll get back to you</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-secondary-text hover:text-main-text hover:bg-divider transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief summary of your complaint"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-text mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide details about your complaint..."
                    rows={5}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-divider">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-divider text-secondary-text hover:bg-border transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.category || !form.subject.trim() || !form.description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComplaintCard({ complaint: c }) {
  return (
    <div className="dashboard-card p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineDocumentText className="w-4 h-4 text-secondary-text flex-shrink-0" />
            <h3 className="text-sm font-bold text-main-text truncate">{c.subject}</h3>
            <span className="font-mono text-xs text-primary">#{c.id}</span>
          </div>

          {c.category && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary mb-2">
              {c.category}
            </span>
          )}

          <p className="text-sm text-secondary-text line-clamp-2">{c.description}</p>
        </div>

        <span className={`inline-flex items-center self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status] || ''}`}>
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
      </div>
    </div>
  )
}
