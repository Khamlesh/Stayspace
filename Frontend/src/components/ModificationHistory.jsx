import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowPath } from 'react-icons/hi2'

const MOD_STATUS = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400', Icon: HiOutlineClock },
  Approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', Icon: HiOutlineCheckCircle },
  Rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400', Icon: HiOutlineXCircle },
}

function ModStatusBadge({ status }) {
  const cfg = MOD_STATUS[status] || MOD_STATUS.Pending
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  )
}

export default function ModificationHistory({ modifications, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse bg-background rounded-xl p-3 space-y-2">
            <div className="h-3 w-40 bg-divider rounded" />
            <div className="h-2.5 w-24 bg-divider rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!modifications || modifications.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-background text-xs text-secondary-text">
        <HiOutlineArrowPath className="w-4 h-4" />
        No modification requests yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {modifications.map(mod => (
        <div key={mod.id} className="bg-background rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-main-text">Request #{mod.id}</span>
            <ModStatusBadge status={mod.status} />
          </div>
          <div className="space-y-1 text-[11px] text-secondary-text">
            <div className="flex justify-between">
              <span>Dates:</span>
              <span className="font-medium text-main-text">{mod.old_check_in} → {mod.old_check_out}</span>
            </div>
            <div className="flex justify-between">
              <span>New Dates:</span>
              <span className="font-medium text-primary">{mod.new_check_in} → {mod.new_check_out}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span className="font-medium text-main-text">{mod.old_guest_count} → {mod.new_guest_count}</span>
            </div>
            {mod.host_comments && (
              <p className="text-[10px] text-secondary-text italic mt-1">Host: "{mod.host_comments}"</p>
            )}
          </div>
          <p className="text-[10px] text-secondary-text">
            Requested {mod.requested_at ? new Date(mod.requested_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            {mod.reviewed_at && ` · Reviewed ${new Date(mod.reviewed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
      ))}
    </div>
  )
}
