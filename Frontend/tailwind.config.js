/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F43F5E",
        "primary-hover": "#E11D48",
        "primary-light": "#FFF1F2",
        background: "#F8FAFC",
        "sidebar-bg": "#FFFFFF",
        "card-bg": "#FFFFFF",
        "main-text": "#111827",
        "secondary-text": "#6B7280",
        border: "#E5E7EB",
        divider: "#F1F5F9",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
        rating: "#FBBF24",
        "chart-pink": "#F43F5E",
        "chart-blue": "#3B82F6",
        "chart-green": "#22C55E",
        "chart-orange": "#F59E0B"
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 8px 24px rgba(15,23,42,0.08)",
        "card-hover": "0 16px 40px rgba(15,23,42,0.12)",
        "card-lg": "0 20px 60px rgba(15,23,42,0.15)",
        "hero": "0 25px 50px rgba(15,23,42,0.2)",
        "btn": "0 4px 14px rgba(244,63,94,0.4)",
        "glow": "0 0 40px rgba(244,63,94,0.2)",
        "soft": "0 2px 15px rgba(15,23,42,0.05)"
      },
      borderRadius: {
        card: "18px",
        btn: "12px",
        input: "12px",
        "2xl": "20px",
        "3xl": "24px"
      },
      spacing: {
        'sidebar': '250px',
        'navbar': '80px'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'fade-in-up': 'fadeInUp 0.6s ease forwards',
        'fade-in-left': 'fadeInLeft 0.6s ease forwards',
        'fade-in-right': 'fadeInRight 0.6s ease forwards',
        'scale-in': 'scaleIn 0.5s ease forwards',
        'slide-down': 'slideDown 0.4s ease forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        fadeInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(3deg)' },
          '66%': { transform: 'translateY(6px) rotate(-2deg)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: []
}
