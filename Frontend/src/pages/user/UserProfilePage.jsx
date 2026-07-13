import { useState, useEffect } from 'react'
import userAPI from '../../api/userApi'
import { HiOutlineUserCircle, HiOutlineCheck } from 'react-icons/hi2'

export default function UserProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', bio: '' })

  useEffect(() => {
    userAPI.getProfile()
      .then(res => {
        if (res.data.status === 'success') {
          const p = res.data.data
          setProfile(p)
          setForm({ name: p.name || '', bio: p.bio || '' })
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await userAPI.updateProfile(form)
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        <div className="h-64 bg-divider rounded-card animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main-text">My Profile</h1>
        <p className="text-sm text-secondary-text mt-1">Manage your guest profile</p>
      </div>

      <div className="dashboard-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-2xl">{(form.name || 'G').charAt(0)}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-main-text">{profile?.name}</p>
            <p className="text-sm text-secondary-text">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Guest</span>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Email</label>
            <input
              value={profile?.email || ''}
              disabled
              className="input-field bg-divider cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-main-text mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              placeholder="Tell hosts about yourself..."
              className="input-field resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <HiOutlineCheck className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
