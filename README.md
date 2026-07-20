<div align="center">

# StaySpace

### A Complete Vacation Rental Booking Platform

**Book stays. Manage properties. Grow your business.**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask)](https://flask.palletsprojects.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)

</div>

---

## Table of Contents

- [What is StaySpace?](#what-is-stayspace)
- [Who is it for?](#who-is-it-for)
- [Key Features at a Glance](#key-features-at-a-glance)
- [How it Works](#how-it-works)
  - [For Guests](#for-guests)
  - [For Hosts](#for-hosts)
  - [For Admins](#for-admins)
- [Technology Behind StaySpace](#technology-behind-stayspace)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Set Up the Database](#step-2-set-up-the-database)
  - [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
  - [Step 4: Start the Backend](#step-4-start-the-backend)
  - [Step 5: Start the Frontend](#step-5-start-the-frontend)
- [Demo Accounts](#demo-accounts)
- [Features In-Depth](#features-in-depth)
  - [Authentication & Security](#authentication--security)
  - [Property Search & Listings](#property-search--listings)
  - [Booking System](#booking-system)
  - [Payment & Receipts](#payment--receipts)
  - [Chat & Messaging](#chat--messaging)
  - [Reviews & Ratings](#reviews--ratings)
  - [Notifications](#notifications)
  - [Reports & Analytics](#reports--analytics)
  - [Complaints System](#complaints-system)
  - [Booking Modifications](#booking-modifications)
- [API Overview](#api-overview)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [License](#license)

---

## What is StaySpace?

StaySpace is a **full-stack web application** that works like Airbnb. It allows people to list their properties for rent, lets guests search and book those properties, and gives administrators full control over the platform.

Think of it as a **complete online marketplace for short-term stays** -- from browsing properties to making payments, chatting with hosts, leaving reviews, and generating reports -- all in one place.

The platform has **three types of users** (called "roles"), each with their own dashboard, features, and capabilities:

| Role | What They Do |
|------|-------------|
| **Guest** | Browses properties, makes bookings, pays, chats with host, leaves reviews |
| **Host** | Lists properties, manages bookings, earns money, responds to reviews |
| **Admin** | Monitors the entire platform, manages users, approves hosts, generates reports |

---

## Who is it for?

- **Property Owners / Hosts** who want to list their apartments, houses, or villas for short-term rental
- **Travelers / Guests** who want to discover and book unique stays
- **Platform Administrators** who need complete oversight and management tools

---

## Key Features at a Glance

| Feature | Description |
|---------|-------------|
| 43 Pages | Comprehensive UI across Guest, Host, and Admin dashboards |
| 103 API Endpoints | Full backend covering every business operation |
| 23 Database Tables | Well-structured data model with relationships |
| Real-Time Chat | Per-booking messaging between Guest and Host |
| Smart Booking System | Automated status transitions, overlap detection, modifications |
| 5-Category Reviews | Detailed ratings for Cleanliness, Location, Communication, Amenities, Value |
| PDF Receipts | Branded, downloadable payment receipts |
| Analytics Dashboards | Charts, trends, KPIs for all three roles |
| Notification System | Real-time in-app notifications with filtering |
| Host Approval Workflow | Admin-gated host onboarding |
| Responsive Design | Works on Desktop, Tablet, and Mobile |
| Indian Rupee Support | All pricing in INR with proper formatting |

---

## How it Works

### For Guests

```
Browse & Search Properties
        |
   View Property Details (photos, reviews, amenities, availability calendar)
        |
   Select Dates & Guests
        |
   Make Payment (Credit Card / Debit Card / UPI / Net Banking)
        |
   Receive Booking Confirmation
        |
   Chat with Host (ask questions, share arrival details)
        |
   Check-in & Enjoy Your Stay
        |
   Check-out
        |
   Leave a Review (overall + 5 detailed categories)
        |
   Download PDF Receipt
```

**Guest Features:**
- **Dashboard** -- Overview of total bookings, spending, upcoming stays, wishlist count
- **Explore Stays** -- Search and filter properties by price, guest count, and type
- **Wishlist** -- Save favorite properties for later
- **My Bookings** -- View all bookings with status, timeline history, and modification options
- **Payments** -- Payment history with downloadable PDF receipts
- **My Reviews** -- Reviews written, host replies, edit within 30 days
- **Notifications** -- All alerts about bookings, payments, messages
- **Complaints** -- Submit and track support tickets
- **Profile & Settings** -- Manage personal info and password

### For Hosts

```
Register (requires admin approval)
        |
   Add Properties (title, type, amenities, pricing, photos)
        |
   Receive Booking Requests
        |
   Confirm / Reject Bookings
        |
   Chat with Guests
        |
   Check-in / Check-out Guests
        |
   Receive Earnings
        |
   Respond to Reviews
        |
   View Reports & Analytics
```

**Host Features:**
- **Dashboard** -- Properties count, total bookings, monthly/annual earnings, rating growth, upcoming check-ins, booking status distribution, property performance
- **My Properties** -- Manage listings with per-property earnings, review stats, and occupancy rates
- **Add Property** -- Full listing creation with 3 property types (Apartment, House, Villa), amenities, pricing
- **Bookings** -- Confirm, check-in, complete, or cancel bookings
- **Messages** -- Chat with guests, search conversations, unread badge
- **Earnings** -- Total, monthly, yearly breakdowns with recent payment list
- **Reports** -- Revenue charts and property performance with PDF export
- **Reviews** -- View reviews, reply to guests, rating trends and analytics
- **Block Dates** -- Mark dates as unavailable on the calendar

### For Admins

```
Monitor Platform
        |
   Approve / Reject Host Registrations
        |
   Manage Users & Properties
        |
   Oversee All Bookings & Payments
        |
   Read Chat Conversations (monitoring)
        |
   Moderate Reviews (hide, restore, delete)
        |
   Handle Complaints
        |
   Generate Reports & Analytics
        |
   Export PDFs
```

**Admin Features:**
- **Dashboard** -- Platform-wide stats: users, hosts, bookings, revenue, growth charts, property distribution, occupancy
- **User Management** -- List and delete users
- **Host Management** -- Approve or reject host registrations
- **Property Management** -- View and remove any property
- **Booking Management** -- Oversee all bookings with action controls
- **Conversations** -- Read-only access to all Guest-Host chats
- **Payments** -- Complete payment records
- **Analytics** -- Monthly trends, top hosts, top properties, daily bookings, property type distribution
- **Reports** -- Revenue reports with PDF and CSV export
- **Reviews** -- Search, filter, hide, restore, soft-delete, analytics
- **Complaints** -- Update status, add admin responses
- **Notifications** -- Full notification management

---

## Technology Behind StaySpace

### Frontend (What the user sees)

| Technology | What it does |
|-----------|-------------|
| **React 18** | Builds the user interface -- every button, form, and page is a React component |
| **Vite 5** | Dev server and build tool -- makes development fast and production builds optimized |
| **Tailwind CSS 3** | Styling -- every color, spacing, and layout is built with utility classes |
| **React Router 6** | Navigation -- handles switching between pages without full reloads |
| **Axios** | HTTP client -- sends requests to the backend API |
| **Recharts** | Charts and graphs on dashboards |
| **jsPDF** | Generates PDF receipts and reports in the browser |
| **React Hot Toast** | Popup notifications (success, error messages) |
| **React Icons** | Professional icon set used throughout the UI |

### Backend (The brain behind the scenes)

| Technology | What it does |
|-----------|-------------|
| **Python 3** | Server-side programming language |
| **Flask** | Web framework that handles API requests and routing |
| **MySQL** | Database that stores all data (users, bookings, messages, etc.) |
| **Token-based Auth** | Secure login system with SHA-256 password hashing + salt |

### Database

| Aspect | Detail |
|--------|--------|
| **Engine** | MySQL (InnoDB) |
| **Tables** | 23 well-structured tables |
| **Indexes** | 19 performance indexes for fast queries |
| **Relationships** | Foreign keys linking users, properties, bookings, reviews, messages |

---

## Project Structure

```
Stayspace/
|
|-- Backend/
|   |-- app.py                    # Complete API server (103 endpoints)
|   |-- seed_data.py              # Sample data seeder
|   |-- seed_bookings.py          # Booking data seeder
|
|-- Database/
|   |-- schema.sql                # Full database schema (23 tables)
|   |-- optimize_indexes.sql      # Performance indexes
|
|-- Frontend/
|   |-- package.json              # Dependencies and scripts
|   |-- vercel.json               # Vercel deployment config
|   |-- src/
|       |-- App.jsx               # Route definitions for all pages
|       |-- context/              # Authentication state management
|       |-- api/                  # API client modules (5 files)
|       |-- utils/                # Helpers (receipts, reports, timestamps, currency)
|       |-- hooks/                # Custom React hooks
|       |-- components/           # Reusable UI components
|       |   |-- BookingDetailsModal.jsx
|       |   |-- NotificationCenter.jsx
|       |   |-- NotificationPage.jsx
|       |   |-- ModificationHistory.jsx
|       |   |-- CancellationModal.jsx
|       |   |-- BookingModificationModal.jsx
|       |   |-- ExportButton.jsx
|       |   |-- Logo.jsx
|       |   |-- user/             # Guest-specific components
|       |   |-- host/             # Host-specific components
|       |   |-- admin/            # Admin-specific components
|       |-- pages/
|           |-- user/             # 10 Guest pages
|           |-- host/             # 12 Host pages
|           |-- admin/            # 14 Admin pages
|
|-- Uploads/                     # Property images & profile pictures
|-- Receipts/                    # Generated PDF receipts
|-- logo-concepts/               # Branding design files
|-- CPP/                         # C++ core engine (academic/historical)
|-- stayspace_core.exe           # Compiled C++ binary
|-- compile.bat                  # C++ compilation script
|-- seed_demo_users.py           # Demo account seeder
|-- test_auth.py                 # Authentication tests
|-- test_backend.py              # Backend tests
|-- .env                         # Environment configuration
|-- implementation_plan.md       # Architecture document
```

---

## Getting Started

### Prerequisites

Before you begin, make sure you have these installed on your computer:

1. **Node.js** (version 18 or higher) -- [Download here](https://nodejs.org/)
2. **Python** (version 3.8 or higher) -- [Download here](https://python.org/)
3. **MySQL** (version 8.0 or higher) -- [Download here](https://dev.mysql.com/downloads/mysql/)
4. **Git** -- [Download here](https://git-scm.com/)

### Step 1: Clone the Repository

Open your terminal (Command Prompt on Windows) and run:

```bash
git clone https://github.com/Khamlesh/Stayspace.git
cd Stayspace
```

### Step 2: Set Up the Database

1. Open MySQL Workbench or your MySQL client
2. Create a new database:
```sql
CREATE DATABASE stayspace;
```
3. Import the schema:
```bash
mysql -u root -p stayspace < Database/schema.sql
```
4. (Optional) Add performance indexes:
```bash
mysql -u root -p stayspace < Database/optimize_indexes.sql
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stayspace
```

### Step 4: Start the Backend

Open a terminal and run:

```bash
cd Backend
pip install flask flask-cors mysql-connector-python
python app.py
```

The backend server will start at `http://localhost:5000`

### Step 5: Start the Frontend

Open a **new** terminal and run:

```bash
cd Frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

### Step 6: Set Up Demo Data (Optional)

To populate the platform with sample data:

```bash
python seed_demo_users.py
```

This creates demo accounts you can log in with immediately.

---

## Demo Accounts

After running the seed script, you can log in with these accounts:

| Role | Email | Password | What You Can Do |
|------|-------|----------|-----------------|
| **Admin** | `admin@stayspace.com` | `Admin@123` | Full platform management |
| **Host** | `host@stayspace.com` | `Host@123` | Manage properties and bookings |
| **Guest** | `user@stayspace.com` | `User@123` | Browse, book, and review |

---

## Features In-Depth

### Authentication & Security

StaySpace uses a secure, custom-built authentication system:

- **Registration** -- New users sign up as Guest, Host, or Admin
- **Password Security** -- Passwords are encrypted using SHA-256 with a unique random salt. Raw passwords are never stored
- **Session Tokens** -- After login, a secure token is generated for API access (expires after 7 days)
- **Role-Based Access** -- Each role can only access their own pages and features. A Guest cannot access Host pages, and a Host cannot access Admin pages
- **Forgot Password** -- Email-based password reset with time-limited tokens (15 minutes)
- **Host Approval** -- New hosts must be approved by an admin before they can access the host dashboard
- **Route Protection** -- Frontend routes are protected. If someone tries to access a page they shouldn't, they are redirected to the home page

### Property Search & Listings

Properties can be listed in three types:

| Type | Description |
|------|-------------|
| **Apartment** | Urban living spaces |
| **House** | Independent houses |
| **Villa** | Luxury villas |

**Search Features:**
- Text search across property titles, addresses, and descriptions
- Price range filter (minimum and maximum per night)
- Guest count filter
- Property type filter
- Paginated results (multiple pages of listings)

**Property Details Include:**
- Title, description, and property type
- Image display
- Price per night (in Indian Rupees)
- Maximum guest capacity
- Bedrooms, bathrooms, beds, and property size (sq ft)
- Nearby locations and address
- Amenities list (WiFi, AC, Parking, Pool, Kitchen, etc.)
- Availability calendar (shows booked and blocked dates)
- Guest reviews with detailed category ratings
- Average rating and total review count
- Host information (visible after booking)

### Booking System

The booking process follows a clear, automated flow:

```
Pending --> Confirmed --> Checked-In --> Completed
   |              |
   v              v
Cancelled      Cancelled
```

**How it works:**
1. Guest selects check-in and check-out dates on the availability calendar
2. Guest chooses the number of guests (validated against property's max capacity)
3. System calculates pricing: (Price per Night x Number of Nights) + 10% Service Fee
4. Guest selects a payment method and completes payment
5. Booking status becomes "Confirmed"
6. A chat conversation is automatically created between Guest and Host
7. On the check-in date, status transitions to "Checked-In"
8. After check-out, status transitions to "Completed"
9. Guest can then leave a review

**Safety Features:**
- **Overlap Detection** -- Prevents two guests from booking the same dates
- **Blocked Dates** -- Hosts can block specific dates on their calendar
- **Capacity Validation** -- Guest count cannot exceed the property's maximum
- **Smart Cancellation** -- Guest, Host, or Admin can cancel, with proper status tracking
- **Booking Timeline** -- Complete audit trail of every action taken on a booking

### Payment & Receipts

StaySpace supports four payment methods:

| Method | Details |
|--------|---------|
| **Credit Card** | Card number, expiry date, CVV, cardholder name |
| **Debit Card** | Card number, expiry date, CVV, cardholder name |
| **UPI** | Mobile number and UPI ID |
| **Net Banking** | Account number |

**PDF Receipts:**
- Generated instantly after successful payment
- Branded with the StaySpace logo
- Contains: Booking ID, transaction ID, dates, pricing breakdown, payment method
- Downloadable from the payment success page and payment history
- Built entirely in the browser using jsPDF (no server-side PDF generation needed)

### Chat & Messaging

StaySpace includes a full real-time messaging system:

- **Per-Booking Conversations** -- Each booking gets its own private chat thread
- **Auto-Created** -- Chat is automatically available once a booking is confirmed
- **Guest-Host Communication** -- Guests and Hosts can send messages to each other
- **Admin Monitoring** -- Admins can read all conversations (read-only, cannot send)
- **Message Features:**
  - Real-time polling (refreshes every 5 seconds)
  - Unread message count badges
  - Read receipts (double-check mark when message is read)
  - Character limit (1,000 characters per message)
  - Duplicate send prevention (2-second cooldown)
  - Empty message blocking
  - Auto-scroll to newest message
- **Conversation List** -- Shows latest message preview, timestamp, and unread count
- **Search** -- Hosts can search through their conversations
- **IST Timestamps** -- All timestamps displayed in Indian Standard Time (Asia/Kolkata)

### Reviews & Ratings

StaySpace uses a comprehensive 5-category review system:

| Category | What It Rates |
|----------|--------------|
| **Overall Rating** | General experience (1-5 stars) |
| **Cleanliness** | How clean was the property |
| **Location** | Quality of the location |
| **Communication** | How responsive was the host |
| **Amenities** | Quality of amenities provided |
| **Value** | Value for money |

**Review Rules:**
- Only guests with a **completed** stay can leave a review (verified stays only)
- One review per guest per property
- Reviews can be **edited within 30 days** of posting
- Reviews can be **soft-deleted** (hidden but not permanently removed)
- **Hosts can reply** to each review (one reply per review)
- **Review reporting** -- Users can flag inappropriate reviews for admin review
- **Admin moderation** -- Admins can hide, restore, or soft-delete reviews
- **Sorting** -- Reviews can be sorted by newest, highest rating, or lowest rating
- **Rating Breakdown** -- Property pages show a visual breakdown of star distribution

### Notifications

StaySpace has a comprehensive in-app notification system:

**Notification Types:**
| Type | Examples |
|------|----------|
| **Booking** | New booking, confirmation, cancellation, check-in, check-out |
| **Payment** | Payment received, payment failed |
| **Review** | New review, host reply |
| **Complaint** | New complaint, status update, admin response |
| **Property** | Property listed, property removed |
| **Admin** | Host registration pending, system alerts |
| **System** | Account updates, security alerts |

**Features:**
- Real-time notification bell in the top navigation bar
- Unread count badge on the bell icon and sidebar
- **Filter by type** -- View only booking, payment, review, or complaint notifications
- **Search** -- Search through notification text
- **Sort** -- Newest first or oldest first
- **Read/Unread filter** -- Show only unread notifications
- **Mark as read** -- Mark individual or all notifications as read
- **Delete** -- Remove individual notifications
- **Deep linking** -- Clicking a notification takes you to the relevant page

### Reports & Analytics

StaySpace provides powerful analytics for Hosts and Admins:

**Host Analytics:**
- Total properties, bookings, and earnings
- Monthly and yearly earnings breakdown
- Per-property earnings, review stats, and occupancy rate
- Revenue charts (6-month trend)
- Upcoming check-ins list
- Recent bookings and reviews
- PDF report export

**Admin Analytics:**
- Platform-wide statistics (users, hosts, properties, bookings, revenue)
- User growth trends (monthly new users)
- Host growth trends (monthly new hosts)
- Booking trends (monthly bookings)
- Revenue analytics (monthly revenue)
- Property type distribution (pie chart)
- Booking status distribution (pie chart)
- Occupancy data
- Top hosts and top properties
- Daily bookings (30-day view)
- Review analytics (platform average, positive/negative counts)
- PDF and CSV export

**All analytics support date range filtering:**
- All time
- Last 7 days
- Last 30 days
- Last 6 months
- Last 1 year
- Custom date range

### Complaints System

Both Guests and Hosts can submit complaints:

1. User writes a subject and description
2. Complaint is created with "Open" status
3. Admin is notified immediately
4. Admin reviews the complaint
5. Admin updates status and adds a response
6. User is notified of the update
7. Complaint progresses through: Open --> In Progress --> Resolved --> Closed

### Booking Modifications

Guests can request changes to confirmed bookings:

**Modifiable Fields:**
- Check-in date
- Check-out date
- Number of guests
- Special requests

**Process:**
1. Guest submits a modification request
2. System validates the new dates (overlap check, capacity check)
3. Host receives the request
4. Host approves or rejects (with optional comments)
5. If approved, booking details are updated
6. Full modification history is tracked and visible to both parties
7. Timeline events are recorded for every change

---

## API Overview

StaySpace has **103 RESTful API endpoints** organized by feature:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| System | 2 | Health check, API index |
| Database | 1 | Schema initialization |
| Authentication | 10 | Register, login, logout, password reset, host status |
| Properties (Public) | 5 | Search, list, detail, availability |
| Host Management | 24 | Dashboard, properties, bookings, reviews, earnings, reports, profile, notifications, complaints |
| Guest Management | 20 | Dashboard, bookings, wishlist, reviews, payments, profile, notifications, complaints |
| Booking System | 7 | Create, timeline, modify, cancel |
| Chat & Messaging | 5 | Send, list, messages, mark-read, admin chat |
| Admin Management | 25 | Dashboard, users, hosts, properties, bookings, payments, reviews, complaints, analytics, reports, notifications, profile |
| **Total** | **103** | |

All endpoints use **POST** method (except system and a few GET-only endpoints) and return consistent JSON responses with `status`, `data`, and `message` fields.

---

## Database Schema

StaySpace uses **23 MySQL tables** with proper relationships:

```
users
  |-- guests (1:1)
  |-- hosts (1:1)
  |-- admins (1:1)
  |-- sessions (1:N)
  |-- password_reset_tokens (1:N)
  |-- notifications (1:N)
  |-- complaints (1:N)

properties
  |-- amenities (1:N)
  |-- blocked_dates (1:N)
  |-- bookings (1:N)
  |-- reviews (1:N)
  |-- wishlist (M:N with guests)

bookings
  |-- payments (1:N)
  |-- booking_timeline (1:N)
  |-- booking_modifications (1:N)
  |-- conversations (1:1)

conversations
  |-- messages (1:N)

payments
  |-- receipts (1:1)

reviews
  |-- review_replies (1:1)
  |-- review_reports (1:N)
```

---

## Screenshots

> Screenshots can be added here. The application includes:
> - Landing page with property listings
> - Guest dashboard with charts and stats
> - Host dashboard with earnings and property performance
> - Admin dashboard with platform-wide analytics
> - Property detail page with booking calendar
> - Chat interface with real-time messaging
> - Booking timeline with full history
> - PDF receipt generation
> - Notification center with filtering

---

## License

This project was developed as an academic project. All rights reserved.

---

<div align="center">

**Built with care by Khamlesh**

StaySpace -- Where Every Stay Matters

</div>
