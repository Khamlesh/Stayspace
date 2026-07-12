import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const sizeMap = {
  sm: { box: 'w-7 h-7', text: 'text-xs', brand: 'text-sm' },
  md: { box: 'w-8 h-8', text: 'text-sm', brand: 'text-lg' },
  lg: { box: 'w-10 h-10', text: 'text-base', brand: 'text-xl' },
}

export default function Logo({ size = 'md', showText = true, linkTo }) {
  const { user } = useAuth()

  const getLink = () => {
    if (linkTo) return linkTo
    if (!user) return '/'
    if (user.role === 'Host') return '/host'
    if (user.role === 'Admin') return '/admin-dashboard'
    return '/dashboard'
  }

  const s = sizeMap[size] || sizeMap.md

  return (
    <Link to={getLink()} className="flex items-center gap-2.5 flex-shrink-0 select-none">
      <div className={`${s.box} rounded-xl bg-primary flex items-center justify-center shadow-md`}>
        <span className={`text-white font-bold ${s.text}`}>S</span>
      </div>
      {showText && (
        <span className={`font-bold ${s.brand} text-main-text tracking-tight`}>StaySpace</span>
      )}
    </Link>
  )
}
