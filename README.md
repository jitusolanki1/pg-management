# PG Management System - Complete Production-Ready Application

## Overview
A comprehensive PG (Paying Guest) Management System built with React, Node.js, Express, MongoDB, and Tailwind CSS. Designed for lightweight performance with no external UI libraries and Base64 image storage.

## Tech Stack

### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Image Storage**: Base64 (in MongoDB)
- **Validation**: Custom middleware validators
- **Error Handling**: Centralized error handler

### Frontend
- **Framework**: React 18 with JSX (no TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (no external UI libraries)
- **Routing**: React Router v6
- **State Management**: React Context API
- **API Client**: Native Fetch API
- **Visualization**: HTML Canvas for 3D floor plans

## Key Features

### 1. Authentication System
- Admin-only JWT-based authentication
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Token storage in localStorage

### 2. 3D Floor Visualization
- Canvas-based 2D/3D visualization of building structure
- Interactive floor selection
- Visual distinction between AC and Non-AC rooms
- Color-coded bed status (Available: Green, Occupied: Red)
- Grid-based room and bed layout
- Click detection for future bed assignments

### 3. Tenant Management
- Complete tenant onboarding with Base64 image uploads
  - Profile photo
  - Aadhaar card front and back
- Plan selection (Fully Plan ₹7500, Half Plan ₹3500)
- Optional cloth washing service (+₹500)
- Automatic bed assignment
- Deposit calculation: Plan Price × Number of Months
- Monthly rent calculation: Base Plan + Optional Services
- Comprehensive tenant details view
- Search and filter capabilities

### 4. Payment System
- Full payment support
- Partial payment with:
  - Remaining due tracking
  - Next due date management
  - Notes field for additional context
- Automatic overdue detection
- Payment history per tenant
- Paid list with payment summaries
- Unpaid list with:
  - Overdue highlighting
  - Call buttons (tel: links)
  - Quick action buttons

### 5. Dashboard
- Real-time statistics:
  - Total tenants
  - Occupancy rate
  - Monthly revenue
  - Pending dues
- Infrastructure overview:
  - Total floors, rooms, and beds
  - Bed availability visualization
- Revenue breakdown
- Recent payments table
- Quick action links

## Database Schema

### Admin
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  name: String
}
```

### Floor
```javascript
{
  floorNumber: Number (unique),
  name: String,
  totalRooms: Number
}
```

### Room
```javascript
{
  roomNumber: String (unique),
  floor: ObjectId (ref: Floor),
  roomType: Enum ['AC', 'NON_AC'],
  totalBeds: Number,
  occupiedBeds: Number,
  gridPosition: { x: Number, y: Number }
}
```

### Bed
```javascript
{
  bedNumber: String (unique),
  room: ObjectId (ref: Room),
  floor: ObjectId (ref: Floor),
  status: Enum ['AVAILABLE', 'OCCUPIED'],
  tenant: ObjectId (ref: Tenant),
  gridPosition: { x: Number, y: Number }
}
```

### Plan
```javascript
{
  name: Enum ['FULLY_PLAN', 'HALF_PLAN'],
  price: Number,
  description: String
}
```

### Tenant
```javascript
{
  name: String,
  age: Number (min: 18),
  profilePhoto: String (Base64),
  aadhaarFront: String (Base64),
  aadhaarBack: String (Base64),
  plan: ObjectId (ref: Plan),
  bed: ObjectId (ref: Bed),
  clothWashing: Boolean,
  monthlyRent: Number,
  deposit: {
    amount: Number,
    months: Number,
    paidDate: Date
  },
  phone: String,
  joinDate: Date,
  status: Enum ['ACTIVE', 'INACTIVE']
}
```

### Payment
```javascript
{
  tenant: ObjectId (ref: Tenant),
  amount: Number,
  paymentType: Enum ['FULL', 'PARTIAL'],
  paymentFor: String,
  paymentDate: Date,
  remainingDue: Number,
  nextDueDate: Date,
  notes: String,
  status: Enum ['PAID', 'PENDING', 'OVERDUE']
}
```

## Business Logic

### Deposit Calculation
- Deposit = Plan Price × Number of Months
- Stored separately in tenant.deposit object
- Example: Fully Plan (₹7500) for 2 months = ₹15,000 deposit

### Monthly Rent Calculation
- Base Rent = Selected Plan Price
- Cloth Washing = ₹500 (if selected)
- Total Monthly Rent = Base Rent + Cloth Washing Fee

### Payment Status Logic
- **PAID**: Full payment completed, no remaining due
- **PENDING**: Partial payment with remaining due, before next due date
- **OVERDUE**: Partial payment with remaining due, past next due date

### Bed Assignment Flow
1. When tenant is created:
   - Selected bed status changes to OCCUPIED
   - Bed.tenant reference is set
   - Room.occupiedBeds count increments
2. When tenant is deleted:
   - Bed status changes to AVAILABLE
   - Bed.tenant reference is cleared
   - Room.occupiedBeds count decrements

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register admin (first time)
- POST `/api/auth/login` - Login admin

### Floors
- GET `/api/floors` - Get all floors
- POST `/api/floors` - Create floor
- PUT `/api/floors/:id` - Update floor
- DELETE `/api/floors/:id` - Delete floor

### Rooms
- GET `/api/rooms` - Get all rooms (optional: ?floorId=xxx)
- POST `/api/rooms` - Create room with beds
- PUT `/api/rooms/:id` - Update room
- DELETE `/api/rooms/:id` - Delete room

### Beds
- GET `/api/beds` - Get all beds (filters: floorId, roomId, status)
- GET `/api/beds/:id` - Get single bed

### Plans
- GET `/api/plans` - Get all plans
- POST `/api/plans` - Create plan
- POST `/api/plans/init` - Initialize default plans

### Tenants
- GET `/api/tenants` - Get all tenants
- GET `/api/tenants/:id` - Get single tenant
- POST `/api/tenants` - Create tenant
- PUT `/api/tenants/:id` - Update tenant
- DELETE `/api/tenants/:id` - Delete tenant

### Payments
- GET `/api/payments` - Get all payments
- GET `/api/payments/paid` - Get paid list
- GET `/api/payments/unpaid` - Get unpaid list
- GET `/api/payments/tenant/:tenantId` - Get payment history
- POST `/api/payments` - Create payment
- PUT `/api/payments/:id` - Update payment

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Default Ports
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## Design System

### Colors
- **Primary**: #0a0a0a (Dark background)
- **Secondary**: #1a1a1a (Cards/panels)
- **Accent**: #3b82f6 (Blue for CTAs and highlights)
- **Success**: #10b981 (Green for available/paid)
- **Warning**: #f59e0b (Orange for partial payments)
- **Danger**: #ef4444 (Red for occupied/overdue)
- **Muted**: #6b7280 (Gray for secondary text)
- **Border**: #2a2a2a (Subtle borders)

### Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headings**: Bold weights (font-bold)
- **Body**: Regular weight with good line-height (leading-relaxed)

## Performance Optimizations

1. **Lightweight Dependencies**: Minimal npm packages
2. **Base64 Images**: No external storage service required
3. **Canvas Rendering**: Efficient 2D visualization with DPR scaling
4. **Centralized API**: Single API client with token management
5. **Lazy Loading**: Components loaded on demand with React Router
6. **Optimized Queries**: MongoDB indexes on frequently queried fields

## Security Features

1. **Password Hashing**: bcryptjs with 12 salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Protected Routes**: Both frontend and backend route protection
4. **Input Validation**: Custom validators for all user inputs
5. **Error Handling**: Sanitized error messages (no stack traces in production)
6. **CORS Configuration**: Properly configured CORS headers


## Future Enhancements

1. **Email Notifications**: Automated payment reminders
2. **SMS Integration**: Direct SMS for overdue payments
3. **Report Generation**: PDF exports for payments and tenant data
4. **Advanced Analytics**: Revenue trends, occupancy patterns
5. **Maintenance Tracking**: Room maintenance and repair logs
6. **Visitor Management**: Guest tracking system
7. **Mobile App**: React Native mobile application
8. **Multi-tenancy**: Support for multiple PG properties
9. **Booking System**: Online bed reservation with advance payment
10. **Staff Management**: Multiple admin roles with permissions

## License
Proprietary - All rights reserved

## Support
For issues or questions, contact the development team.
