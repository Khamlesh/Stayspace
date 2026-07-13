import { useState, useEffect, useCallback } from 'react';
import adminAPI from '../../api/adminApi';
import { formatRupees } from '../../utils/currency';
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineXCircle,
} from 'react-icons/hi2';

const statusConfig = {
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Approval' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

function StatCard({ icon: Icon, iconBg, label, value }) {
  return (
    <div className="dashboard-card flex items-center gap-4 p-4">
      <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 6 }) {
  return (
    <tbody className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full" /></td>
          <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
          <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
          <td className="px-6 py-4"><div className="h-8 w-20 bg-gray-200 rounded" /></td>
        </tr>
      ))}
    </tbody>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <HiOutlineUserGroup className="w-16 h-16 mb-4 text-gray-300" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function HostDetailModal({ host, onClose }) {
  if (!host) return null;
  const status = statusConfig[host.status] || statusConfig.pending;
  const initial = host.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Host Details</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <HiOutlineXCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {initial}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{host.name}</h4>
              <p className="text-sm text-gray-500">{host.email}</p>
              <span className={`inline-block mt-1 px-3 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={HiOutlineEnvelope} label="Email" value={host.email} />
            <InfoRow icon={HiOutlinePhone} label="Phone" value={host.phone || 'N/A'} />
            <InfoRow icon={HiOutlineMapPin} label="City" value={host.city || 'N/A'} />
            <InfoRow icon={HiOutlineUser} label="Gender" value={host.gender || 'N/A'} />
            <InfoRow icon={HiOutlineCalendar} label="Joined" value={host.createdAt ? new Date(host.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{host.propertiesCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{host.bookingsCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{formatRupees(host.revenue ?? 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Revenue</p>
            </div>
          </div>

          {host.description && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-1">About</p>
              <p className="text-sm text-gray-500">{host.description}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700">{value}</p>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'all', label: 'All Hosts' },
  { id: 'pending', label: 'Pending Approval' },
  { id: 'approved', label: 'Approved' },
];

export default function AdminHostsPage() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailHost, setDetailHost] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, host: null });

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getHosts();
      setHosts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch hosts:', err);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  const filteredHosts = hosts.filter((host) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'pending' && host.status === 'pending') ||
      (activeTab === 'approved' && host.status === 'approved');
    const matchesSearch =
      !searchQuery ||
      host.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      host.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = {
    total: hosts.length,
    approved: hosts.filter((h) => h.status === 'approved').length,
    pending: hosts.filter((h) => h.status === 'pending').length,
    revenue: hosts.reduce((sum, h) => sum + (h.revenue || 0), 0),
  };

  const handleApprove = (host) => {
    setConfirmDialog({
      open: true,
      type: 'approve',
      host,
    });
  };

  const handleReject = (host) => {
    setConfirmDialog({
      open: true,
      type: 'reject',
      host,
    });
  };

  const executeAction = async () => {
    const { type, host } = confirmDialog;
    if (!host) return;

    try {
      if (type === 'approve') {
        await adminAPI.approveHost(host._id || host.id);
      } else {
        await adminAPI.rejectHost(host._id || host.id);
      }
      setConfirmDialog({ open: false, type: null, host: null });
      fetchHosts();
    } catch (err) {
      console.error(`Failed to ${type} host:`, err);
      setConfirmDialog({ open: false, type: null, host: null });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Host Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage host approvals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineUserGroup}
          iconBg="bg-gradient-to-br from-indigo-500 to-indigo-600"
          label="Total Hosts"
          value={stats.total}
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
          label="Approved"
          value={stats.approved}
        />
        <StatCard
          icon={HiOutlineClock}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-600"
          label="Pending Approval"
          value={stats.pending}
        />
        <StatCard
          icon={HiOutlineCurrencyRupee}
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          label="Total Revenue"
          value={formatRupees(stats.revenue)}
        />
      </div>

      <div className="dashboard-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.id === 'pending' && stats.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-72 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Host</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">City</th>
                <th className="px-6 py-3">Properties</th>
                <th className="px-6 py-3">Revenue</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton />
            ) : filteredHosts.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      message={
                        searchQuery
                          ? 'No hosts match your search'
                          : activeTab === 'pending'
                          ? 'No pending hosts'
                          : activeTab === 'approved'
                          ? 'No approved hosts'
                          : 'No hosts found'
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {filteredHosts.map((host) => {
                  const status = statusConfig[host.status] || statusConfig.pending;
                  const initial = host.name?.charAt(0)?.toUpperCase() || '?';
                  const isPending = host.status === 'pending';

                  return (
                    <tr
                      key={host._id || host.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => setDetailHost(host)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{host.name}</p>
                            <p className="text-xs text-gray-500 truncate">{host.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {host.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {host.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <HiOutlineBuildingOffice2 className="w-4 h-4 text-gray-400" />
                          {host.propertiesCount ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatRupees(host.revenue ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(host)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              >
                                <HiOutlineCheck className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(host)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              >
                                <HiOutlineXMark className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDetailHost(host)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <HiOutlineEye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {!loading && filteredHosts.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
            Showing {filteredHosts.length} of {hosts.length} hosts
          </div>
        )}
      </div>

      <HostDetailModal host={detailHost} onClose={() => setDetailHost(null)} />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.type === 'approve' ? 'Approve Host' : 'Reject Host'}
        message={
          confirmDialog.type === 'approve'
            ? `Are you sure you want to approve "${confirmDialog.host?.name}"? They will gain access to host features including listing properties and managing bookings.`
            : `Are you sure you want to reject "${confirmDialog.host?.name}"? Their account will be downgraded to Guest role and they will lose all host privileges.`
        }
        confirmLabel={confirmDialog.type === 'approve' ? 'Approve Host' : 'Reject Host'}
        confirmColor={confirmDialog.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
        onConfirm={executeAction}
        onCancel={() => setConfirmDialog({ open: false, type: null, host: null })}
      />
    </div>
  );
}
