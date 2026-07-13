import { useState } from 'react'
import adminAPI from '../../api/adminApi'
import { HiOutlineKey, HiOutlineCheck } from 'react-icons/hi2'

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.old_password || !form.new_password) {
      setMessage('All fields are required')
      setIsSuccess(false)
      return
    }
    if (form.new_password.length < 8) {
      setMessage('New password must be at least 8 characters')
      setIsSuccess(false)
      return
    }
    if (form.new_password !== form.confirm_password) {
      setMessage('New passwords do not match')
      setIsSuccess(false)
      return
    }

    setSaving(true)
    try {
      await adminAPI.changePassword(form.old_password, form.new_password)
      setMessage('Password changed successfully')
      setIsSuccess(true)
      setForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to change password')
      setIsSuccess(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main-text">Settings</h1>
        <p className="text-sm text-secondary-text mt-1">Manage your account settings</p>
      </div>

      <div className="dashboard-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HiOutlineKey className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-main-text">Change Password</h2>
            <p className="text-xs text-secondary-text">Update your account password</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${isSuccess ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Current Password</label>
            <input
              name="old_password"
              type="password"
              value={form.old_password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">New Password</label>
            <input
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Confirm New Password</label>
            <input
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              className="input-field"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <HiOutlineCheck className="w-4 h-4" />
            {saving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
