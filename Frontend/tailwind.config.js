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
        card: "0 8px 24px rgba(15,23,42,0.08)"
      },
      borderRadius: {
        card: "18px",
        btn: "12px",
        input: "12px"
      },
      spacing: {
        'sidebar': '250px',
        'navbar': '80px'
      }
    }
  },
  plugins: []
}
