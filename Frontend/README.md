# StaySpace Frontend

A modern React-based web interface for the StaySpace property rental platform, built with Vite, Tailwind CSS, and React Router.

## Features

- 🏠 **Property Browsing**: Search and filter properties with advanced filters
- 🔐 **Authentication**: Secure user registration and login
- 💼 **User Dashboard**: Manage bookings, wishlist, and notifications
- 🏢 **Host Dashboard**: Property management, booking management, and earnings tracking
- 👨‍💼 **Admin Dashboard**: User management, host approvals, and platform analytics
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Tailwind CSS with custom theme and components

## Tech Stack

- **React 18.2.0** - UI library
- **Vite 5.0.8** - Build tool and dev server
- **React Router DOM 6.20.0** - Client-side routing
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Axios 1.6.2** - HTTP client

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Navigate to the Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Layout.jsx      # Master layout with header and footer
│   ├── PropertyCard.jsx # Property listing card
│   └── ProtectedRoute.jsx # Route protection wrapper
├── pages/              # Page components
│   ├── Landing.jsx     # Home page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── Search.jsx      # Property search page
│   ├── PropertyDetails.jsx # Property details page
│   ├── Booking.jsx     # Booking page
│   ├── Payment.jsx     # Payment page
│   ├── PaymentSuccess.jsx # Payment confirmation
│   ├── Dashboard.jsx   # User dashboard
│   ├── HostDashboard.jsx # Host management dashboard
│   └── AdminDashboard.jsx # Admin control panel
├── context/            # React context for state management
│   └── AuthContext.jsx # Authentication context
├── api/                # API client
│   └── client.js       # Axios configuration and API methods
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Auth context consumer hook
├── App.jsx             # Main app component with routing
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## API Integration

The frontend communicates with the Flask REST API backend:

- **API Base URL**: `http://127.0.0.1:5000/api`
- **Auth Endpoints**: Register, Login, Logout, Validate, Change Password
- **Property Endpoints**: Search, List, Get Details, Get Host Properties
- **Booking Endpoints**: Create booking, Get bookings
- **Payment Endpoints**: Process payment

## Authentication

- User credentials are stored in localStorage
- JWT tokens are automatically included in API requests
- Token is validated on app load via AuthContext
- Unauthenticated users are redirected to login for protected routes

## Demo Credentials

For testing purposes, use these credentials:

**Guest Account:**
- Email: guest@stayspace.com
- Password: Guest@123

**Host Account:**
- Email: host@stayspace.com
- Password: Host@123

**Admin Account:**
- Email: admin@stayspace.com
- Password: Admin@123

## Color Theme

- **Primary**: #FF385C (Red)
- **Secondary**: #00A699 (Teal)
- **Background**: #F5F5F5 (Light Gray)
- **Text**: #1F2937 (Dark Gray)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Proprietary - StaySpace 2024
