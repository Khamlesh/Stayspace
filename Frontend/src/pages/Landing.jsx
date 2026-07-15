import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { propertiesAPI } from '../api/client'
import PropertyCard from '../components/PropertyCard'
import { useAuth } from '../hooks/useAuth'
import { formatRupees } from '../utils/currency'
import Logo from '../components/Logo'
import {
  HiOutlineMagnifyingGlass, HiOutlineCalendarDays, HiOutlineUserGroup,
  HiOutlineMapPin, HiOutlineStar, HiOutlineShieldCheck,
  HiOutlineBolt, HiOutlineClock, HiOutlineCurrencyRupee,
  HiOutlineArrowRight, HiOutlineCheckBadge, HiOutlineGlobeAlt,
  HiOutlineBuildingOffice2, HiOutlineHomeModern, HiOutlineSparkles,
  HiOutlineXMark
} from 'react-icons/hi2'

const heroSlides = [
  { url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1920&q=80', alt: 'Luxury Villa' },
  { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80', alt: 'Beach Resort' },
  { url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1920&q=80', alt: 'Mountain Retreat' },
  { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80', alt: 'Premium Apartment' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', alt: 'Nature Escape' },
  { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80', alt: 'Heritage Home' },
]

const destinations = [
  { name: 'Mumbai', attractions: 'Gateway of India, Marine Drive', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80', properties: 340, avgPrice: 2800 },
  { name: 'Delhi', attractions: 'India Gate, Red Fort', img: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800&q=80', properties: 520, avgPrice: 2200 },
  { name: 'Jaipur', attractions: 'Hawa Mahal, Amer Fort', img: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80', properties: 280, avgPrice: 1800 },
  { name: 'Manali', attractions: 'Solang Valley, Hidimba Temple', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', properties: 190, avgPrice: 2000 },
  { name: 'Shimla', attractions: 'Mall Road, Jakhoo Temple', img: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800&q=80', properties: 150, avgPrice: 1600 },
  { name: 'Goa', attractions: 'Baga Beach, Calangute Beach', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80', properties: 610, avgPrice: 2500 },
  { name: 'Kochi', attractions: 'Chinese Fishing Nets, Fort Kochi', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80', properties: 170, avgPrice: 1900 },
  { name: 'Bengaluru', attractions: 'Cubbon Park, Lalbagh Garden', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80', properties: 430, avgPrice: 2100 },
  { name: 'Darjeeling', attractions: 'Tiger Hill, Tea Gardens', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80', properties: 120, avgPrice: 1700 },
  { name: 'Ooty', attractions: 'Ooty Lake, Botanical Garden', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', properties: 160, avgPrice: 1500 },
]

const categories = [
  { name: 'Luxury Villas', img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80', count: 240 },
  { name: 'Beach Stays', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', count: 380 },
  { name: 'Mountain Retreats', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', count: 210 },
  { name: 'Heritage Homes', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', count: 150 },
  { name: 'Family Friendly', img: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80', count: 420 },
  { name: 'Budget Stays', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', count: 560 },
  { name: 'Apartments', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', count: 390 },
  { name: 'Houses', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', count: 280 },
]

const testimonials = [
  { name: 'Ananya Rao', location: 'Mumbai', text: 'Absolutely loved our stay! The property was pristine, the host incredibly welcoming, and StaySpace made the entire booking process seamless.', rating: 5, property: 'Ocean View Villa, Goa', date: 'Dec 2025', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { name: 'Kabir Mehta', location: 'Delhi', text: 'The mountain retreat was breathtaking. Woke up to stunning views every morning. The booking was instant and the host was very responsive.', rating: 5, property: 'Himalayan Cottage, Manali', date: 'Nov 2025', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { name: 'Meera Iyer', location: 'Bengaluru', text: 'StaySpace has completely changed how I travel. The verified properties give me confidence, and the best price guarantee means I never overpay.', rating: 5, property: 'Heritage Haveli, Jaipur', date: 'Jan 2026', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
  { name: 'Arjun Nair', location: 'Kochi', text: 'From booking to checkout, everything was perfect. The luxury villa exceeded our expectations. The 24/7 support team was incredibly helpful.', rating: 5, property: 'Backwater Villa, Kochi', date: 'Oct 2025', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80' },
  { name: 'Priya Sharma', location: 'Jaipur', text: 'We booked a family-friendly property for our reunion and it was perfect for all ages. The kids loved the pool. Five stars!', rating: 5, property: 'Royal Palace Suite, Udaipur', date: 'Feb 2026', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80' },
  { name: 'Vikram Patel', location: 'Pune', text: 'The instant booking feature saved us when our plans changed last minute. Found a beautiful apartment in Shimla within minutes.', rating: 5, property: 'Mountain View Flat, Shimla', date: 'Mar 2026', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80' },
]

const benefits = [
  { icon: HiOutlineShieldCheck, title: 'Verified Hosts', desc: 'Every host is thoroughly verified for your safety and peace of mind.' },
  { icon: HiOutlineCurrencyRupee, title: 'Secure Payments', desc: 'Bank-grade encryption keeps your payment details safe and secure.' },
  { icon: HiOutlineBolt, title: 'Instant Booking', desc: 'Book your dream stay in seconds with our instant confirmation.' },
  { icon: HiOutlineClock, title: '24/7 Support', desc: 'Our dedicated support team is always available to help you.' },
  { icon: HiOutlineCheckBadge, title: 'Best Price Guarantee', desc: 'Find a lower price elsewhere and we will match it, guaranteed.' },
  { icon: HiOutlineStar, title: 'Trusted Reviews', desc: 'Read authentic reviews from real guests who have stayed at each property.' },
]

function useInView(options = {}) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.unobserve(el) }
    }, { threshold: 0.1, ...options })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, isInView]
}

function useCountUp(end, duration = 2000, start = 0, inView = false) {
  const [value, setValue] = useState(start)
  const hasRun = useRef(false)
  useEffect(() => {
    if (!inView || hasRun.current) return
    hasRun.current = true
    const startTime = performance.now()
    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration, start])
  return value
}

function LazyImage({ src, alt, className = '', ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && <div className="absolute inset-0 skeleton" />}
      {error ? (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary/20">{alt?.charAt(0) || 'S'}</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} {...props} />
      )}
    </div>
  )
}

function SectionTitle({ title, subtitle, light = false }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref} className={`text-center mb-12 ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>
      <h2 className={`text-3xl md:text-4xl font-bold mb-3 ${light ? 'text-white' : 'text-main-text'}`}>{title}</h2>
      <p className={`text-lg max-w-2xl mx-auto ${light ? 'text-white/70' : 'text-secondary-text'}`}>{subtitle}</p>
      <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full" />
    </div>
  )
}

const Landing = () => {
  const { isAuthenticated } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const [searchDestination, setSearchDestination] = useState('')
  const [searchCheckin, setSearchCheckin] = useState('')
  const [searchCheckout, setSearchCheckout] = useState('')
  const [searchGuests, setSearchGuests] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const navigate = useNavigate()

  const [statsRef, statsInView] = useInView()
  const [destRef, destInView] = useInView()
  const [catRef, catInView] = useInView()
  const [benefitsRef, benefitsInView] = useInView()
  const [newsletterRef, newsletterInView] = useInView()

  const propCount = useCountUp(2500, 2000, 0, statsInView)
  const cityCount = useCountUp(50, 2000, 0, statsInView)
  const hostCount = useCountUp(800, 2000, 0, statsInView)
  const guestCount = useCountUp(15000, 2500, 0, statsInView)
  const bookingCount = useCountUp(12000, 2500, 0, statsInView)

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await propertiesAPI.list('', 0, 0, 0, '')
        if (response.data.status === 'success') { setProperties(response.data.data.slice(0, 8)) }
      } catch (error) { console.error('Error loading properties:', error) }
      finally { setLoading(false) }
    }
    loadProperties()
  }, [])

  useEffect(() => {
    if (!isAuthenticated && !sessionStorage.getItem('stayspace_welcome_dismissed')) {
      const timer = setTimeout(() => setShowWelcome(true), 2500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timer = setInterval(() => { setHeroIndex(prev => (prev + 1) % heroSlides.length) }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => { setCurrentTestimonial(prev => (prev + 1) % testimonials.length) }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchDestination) params.set('q', searchDestination)
    if (searchCheckin) params.set('checkin', searchCheckin)
    if (searchCheckout) params.set('checkout', searchCheckout)
    if (searchGuests) params.set('guests', searchGuests)
    navigate(`/search?${params.toString()}`)
  }, [searchDestination, searchCheckin, searchCheckout, searchGuests, navigate])

  const handleDestinationClick = (dest) => { navigate(`/search?q=${encodeURIComponent(dest.name)}`) }
  const handleCategoryClick = (cat) => { navigate(`/search?q=${encodeURIComponent(cat.name)}`) }

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (newsletterEmail) { setSubscribed(true); setNewsletterEmail('') }
  }

  const dismissWelcome = () => {
    setShowWelcome(false)
    sessionStorage.setItem('stayspace_welcome_dismissed', '1')
  }

  return (
    <div className="overflow-hidden">

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={dismissWelcome}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={dismissWelcome}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-divider transition-colors">
              <HiOutlineXMark className="w-5 h-5 text-secondary-text" />
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Logo size="lg" linkTo="/" showText={true} />
              </div>
              <h2 className="text-2xl font-bold text-main-text mb-3">Welcome to StaySpace!</h2>
              <p className="text-secondary-text leading-relaxed mb-6">
                Please sign in to book your favorite stays. New here? Create an account and start exploring luxury stays across India.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login" onClick={dismissWelcome}
                  className="flex-1 text-center px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all duration-300 hover:shadow-btn">
                  Sign In
                </Link>
                <Link to="/register" onClick={dismissWelcome}
                  className="flex-1 text-center px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative h-[600px] md:h-[700px] lg:h-[750px] overflow-hidden">
        {heroSlides.map((slide, idx) => (
          <div key={idx} className="absolute inset-0 transition-opacity duration-1000 ease-in-out" style={{ opacity: idx === heroIndex ? 1 : 0 }}>
            <img src={slide.url} alt={slide.alt} className="w-full h-full object-cover" style={{ transform: idx === heroIndex ? 'scale(1)' : 'scale(1.05)' }} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <div className="max-w-4xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-5 leading-tight animate-fade-in-up">
              Explore India{'\u2019'}s Finest<br /><span className="text-primary">Luxury Stays</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Discover luxury stays across India{'\u2019'}s iconic destinations.
            </p>
          </div>
          <form onSubmit={handleSearch} className="w-full max-w-5xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass rounded-2xl p-2 md:p-3">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3">
                  <HiOutlineMapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Destination</label>
                    <input type="text" value={searchDestination} onChange={(e) => setSearchDestination(e.target.value)} placeholder="Where are you going?"
                      className="w-full bg-transparent text-sm text-main-text placeholder:text-secondary-text/60 focus:outline-none font-medium" />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 md:border-l border-divider">
                  <HiOutlineCalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Check-in</label>
                    <input type="date" value={searchCheckin} onChange={(e) => setSearchCheckin(e.target.value)}
                      className="w-full bg-transparent text-sm text-main-text focus:outline-none font-medium" />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 md:border-l border-divider">
                  <HiOutlineCalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Check-out</label>
                    <input type="date" value={searchCheckout} onChange={(e) => setSearchCheckout(e.target.value)}
                      className="w-full bg-transparent text-sm text-main-text focus:outline-none font-medium" />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 md:border-l border-divider">
                  <HiOutlineUserGroup className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Guests</label>
                    <select value={searchGuests} onChange={(e) => setSearchGuests(e.target.value)}
                      className="w-full bg-transparent text-sm text-main-text focus:outline-none font-medium appearance-none">
                      <option value="">Any</option>
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5">5+ Guests</option>
                    </select>
                  </div>
                </div>
                <button type="submit"
                  className="bg-primary hover:bg-primary-hover text-white rounded-xl px-8 py-3 font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-btn md:whitespace-nowrap">
                  <HiOutlineMagnifyingGlass className="w-5 h-5" />
                  Explore Stays
                </button>
              </div>
            </div>
          </form>
          <div className="flex gap-2 mt-6">
            {heroSlides.map((_, idx) => (
              <button key={idx} onClick={() => setHeroIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === heroIndex ? 'w-8 bg-primary' : 'w-4 bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V20C360 60 720 0 1080 20C1260 30 1380 40 1440 45V60H0Z" fill="#F8FAFC" />
          </svg>
        </div>
      </section>

      {/* 2. FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <SectionTitle title="Featured Properties" subtitle="Handpicked stays loved by thousands of travelers across India" />
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton w-1/3" />
                  <div className="h-5 skeleton w-3/4" />
                  <div className="h-3 skeleton w-full" />
                  <div className="h-4 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link to="/search"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-btn group">
            View All Properties
            <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 3. POPULAR DESTINATIONS */}
      <section className="bg-gradient-to-b from-background to-white py-20" ref={destRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Popular Destinations" subtitle="Explore India\u2019s most loved travel destinations with premium stays" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {destinations.map((dest, idx) => (
              <div key={dest.name} onClick={() => handleDestinationClick(dest)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg ${idx === 0 ? 'sm:col-span-2 sm:row-span-2' : ''} ${destInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 0.07}s` }}>
                <div className={`overflow-hidden ${idx === 0 ? 'h-64 sm:h-full' : 'h-52 sm:h-56'}`}>
                  <LazyImage src={dest.img} alt={dest.name} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 text-center">
                  <HiOutlineMapPin className="w-6 h-6 text-white mb-2" />
                  <p className="text-white/80 text-xs mb-1">{dest.attractions}</p>
                  <p className="text-white font-semibold text-sm mb-1">{dest.properties} Properties</p>
                  <p className="text-white/70 text-xs mb-3">Avg. {formatRupees(dest.avgPrice)}/night</p>
                  <span className="inline-flex items-center gap-1 bg-white text-primary text-xs font-semibold px-4 py-2 rounded-full">
                    Explore Properties <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 group-hover:opacity-0 transition-opacity duration-300">
                  <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                  <p className="text-white/70 text-xs">{dest.properties} Properties</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TRENDING CATEGORIES */}
      <section className="py-20 bg-white" ref={catRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Trending Categories" subtitle="Find the perfect stay type that matches your travel style" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map((cat, idx) => (
              <div key={cat.name} onClick={() => handleCategoryClick(cat)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer h-56 transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg ${catInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 0.07}s` }}>
                <LazyImage src={cat.img} alt={cat.name} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-primary/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 text-center">
                  <HiOutlineSparkles className="w-6 h-6 text-white mb-2" />
                  <p className="text-white font-bold text-lg mb-1">{cat.name}</p>
                  <p className="text-white/80 text-sm mb-3">{cat.count} Properties</p>
                  <span className="inline-flex items-center gap-1 bg-white text-primary text-xs font-semibold px-4 py-2 rounded-full">
                    Explore <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10 group-hover:opacity-0 transition-opacity duration-300">
                  <h3 className="text-white font-bold text-lg">{cat.name}</h3>
                  <p className="text-white/70 text-sm">{cat.count} Properties</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE STAYSPACE */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50" ref={benefitsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="Why Choose StaySpace" subtitle="We make your travel experience safe, seamless, and unforgettable" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title}
                  className={`group bg-white rounded-2xl p-8 border border-divider hover:border-primary/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-card-lg ${benefitsInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-bold text-main-text mb-2">{benefit.title}</h3>
                  <p className="text-secondary-text leading-relaxed">{benefit.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 bg-white" ref={useRef()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle title="What Our Guests Say" subtitle="Real stories from travelers who found their perfect stay" />
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-3xl">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
                {testimonials.map((t, idx) => (
                  <div key={idx} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-primary/5 via-white to-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10">
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <HiOutlineStar key={i} className="w-5 h-5 text-rating fill-rating" />
                        ))}
                      </div>
                      <p className="text-lg md:text-xl text-main-text leading-relaxed mb-8 italic">"{t.text}"</p>
                      <div className="flex items-center gap-4">
                        <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-main-text">{t.name}</h4>
                            <HiOutlineCheckBadge className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-sm text-secondary-text">{t.location} &middot; {t.property}</p>
                          <p className="text-xs text-secondary-text/60">{t.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-divider">
              <HiOutlineStar className="w-5 h-5 rotate-180" />
            </button>
            <button onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 border border-divider">
              <HiOutlineStar className="w-5 h-5" />
            </button>
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentTestimonial(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentTestimonial ? 'w-8 bg-primary' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. STATISTICS */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-hover to-primary" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">StaySpace by the Numbers</h2>
            <p className="text-lg text-white/70">Join thousands of happy travelers and hosts across India</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: 'Properties', value: propCount, suffix: '+' },
              { label: 'Cities', value: cityCount, suffix: '+' },
              { label: 'Hosts', value: hostCount, suffix: '+' },
              { label: 'Happy Guests', value: guestCount, suffix: '+' },
              { label: 'Bookings', value: bookingCount, suffix: '+' },
            ].map((stat, idx) => (
              <div key={stat.label} className={`text-center ${statsInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  {stat.value.toLocaleString('en-IN')}{stat.suffix}
                </div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="py-20 relative overflow-hidden" ref={newsletterRef}>
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80" alt="Travel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className={`relative max-w-3xl mx-auto px-4 text-center ${newsletterInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get Travel Inspiration</h2>
          <p className="text-lg text-white/70 mb-8">Subscribe for exclusive deals, destination guides, and travel tips delivered to your inbox.</p>
          {subscribed ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <HiOutlineCheckBadge className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-white font-semibold text-lg">Thank you for subscribing!</p>
              <p className="text-white/60 text-sm mt-1">Check your inbox for a welcome gift.</p>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email" required
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/95 text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary font-medium" />
              <button type="submit"
                className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-btn whitespace-nowrap">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  )
}

export default Landing
