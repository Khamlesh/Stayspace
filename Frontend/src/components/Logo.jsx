import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const sizes = {
  sm: { icon: 28, gap: 'gap-2', brandSize: 'text-sm', tagSize: 'text-[7px]', rx: 5, pad: 2 },
  md: { icon: 34, gap: 'gap-2.5', brandSize: 'text-base', tagSize: 'text-[8px]', rx: 6, pad: 2.5 },
  lg: { icon: 42, gap: 'gap-3', brandSize: 'text-xl', tagSize: 'text-[9px]', rx: 7, pad: 3 },
  xl: { icon: 52, gap: 'gap-3.5', brandSize: 'text-2xl', tagSize: 'text-[10px]', rx: 8, pad: 3.5 },
}

function GridIcon({ size = 34, rx = 6, pad = 2.5 }) {
  const half = size / 2
  const gap = pad
  const cell = (size - gap) / 2

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect x={pad} y={pad} width={cell} height={cell} rx={rx * 0.65} fill="#F43F5E" />
      <rect x={cell + gap + pad} y={pad} width={cell} height={cell} rx={rx * 0.65} fill="#F43F5E" opacity="0.65" />
      <rect x={pad} y={cell + gap + pad} width={cell} height={cell} rx={rx * 0.65} fill="#F43F5E" opacity="0.4" />
      <rect x={cell + gap + pad} y={cell + gap + pad} width={cell} height={cell} rx={rx * 0.65} fill="#F43F5E" opacity="0.2" />
    </svg>
  )
}

export default function Logo({ size = 'md', showText = true, linkTo, vertical = false, light = false }) {
  const { user } = useAuth()

  const getLink = () => {
    if (linkTo) return linkTo
    if (!user) return '/'
    if (user.role === 'Host') return '/host'
    if (user.role === 'Admin') return '/admin'
    return '/user'
  }

  const s = sizes[size] || sizes.md

  const textColor = light ? 'text-white' : 'text-main-text'
  const stayColor = light ? 'text-white' : 'text-[#111827]'
  const spaceColor = 'text-primary'
  const tagColor = light ? 'text-white/50' : 'text-secondary-text'

  if (vertical) {
    return (
      <Link to={getLink()} className="flex flex-col items-center gap-1.5 flex-shrink-0 select-none">
        <GridIcon size={s.icon} rx={s.rx} pad={s.pad} />
        <div className="flex flex-col items-center leading-none">
          <span className={`${s.brandSize} font-bold tracking-tight`}>
            <span className={stayColor}>Stay</span>
            <span className={spaceColor}>Space</span>
          </span>
          <span className={`${s.tagSize} font-medium ${tagColor} tracking-widest uppercase mt-0.5`}>
            Find Your Perfect Stay
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link to={getLink()} className={`flex items-center ${s.gap} flex-shrink-0 select-none`}>
      <GridIcon size={s.icon} rx={s.rx} pad={s.pad} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${s.brandSize} font-bold tracking-tight`}>
            <span className={stayColor}>Stay</span>
            <span className={spaceColor}>Space</span>
          </span>
          <span className={`${s.tagSize} font-medium ${tagColor} tracking-widest uppercase mt-0.5`}>
            Find Your Perfect Stay
          </span>
        </div>
      )}
    </Link>
  )
}
