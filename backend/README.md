# PG Management System - Backend

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and JWT secret

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register admin (first time)
- POST /api/auth/login - Login admin

### Floors
- GET /api/floors - Get all floors
- POST /api/floors - Create floor
- PUT /api/floors/:id - Update floor
- DELETE /api/floors/:id - Delete floor

### Rooms
- GET /api/rooms - Get all rooms (optional: ?floorId=xxx)
- POST /api/rooms - Create room with beds
- PUT /api/rooms/:id - Update room
- DELETE /api/rooms/:id - Delete room

### Beds
- GET /api/beds - Get all beds (optional: ?floorId=xxx&roomId=xxx&status=AVAILABLE)
- GET /api/beds/:id - Get single bed

### Plans
- GET /api/plans - Get all plans
- POST /api/plans - Create plan
- POST /api/plans/init - Initialize default plans

### Tenants
- GET /api/tenants - Get all tenants
- GET /api/tenants/:id - Get single tenant
- POST /api/tenants - Create tenant
- PUT /api/tenants/:id - Update tenant
- DELETE /api/tenants/:id - Delete tenant

### Payments
- GET /api/payments - Get all payments
- GET /api/payments/paid - Get paid list
- GET /api/payments/unpaid - Get unpaid list
- GET /api/payments/tenant/:tenantId - Get payment history
- POST /api/payments - Create payment
- PUT /api/payments/:id - Update payment

### Dashboard
- GET /api/dashboard/stats - Get dashboard statistics

## Database Schema

### Admin
- username, email, password, name

### Floor
- floorNumber, name, totalRooms

### Room
- roomNumber, floor (ref), roomType (AC/NON_AC), totalBeds, occupiedBeds, gridPosition

### Bed
- bedNumber, room (ref), floor (ref), status (AVAILABLE/OCCUPIED), tenant (ref), gridPosition

### Plan
- name (FULLY_PLAN/HALF_PLAN), price, description

### Tenant
- name, age, profilePhoto (Base64), aadhaarFront (Base64), aadhaarBack (Base64)
- plan (ref), bed (ref), clothWashing, monthlyRent, deposit {amount, months, paidDate}
- phone, joinDate, status (ACTIVE/INACTIVE)

### Payment
- tenant (ref), amount, paymentType (FULL/PARTIAL), paymentFor, paymentDate
- remainingDue, nextDueDate, notes, status (PAID/PENDING/OVERDUE)

## Business Logic

### Deposit Calculation
- Deposit = Plan Price × Number of Months
- Stored separately in tenant.deposit object

### Monthly Rent Calculation
- Base Rent = Plan Price
- Cloth Washing = ₹500 (if selected)
- Total Monthly Rent = Base Rent + Cloth Washing Fee

### Payment Status
- PAID: Full payment completed
- PENDING: Partial payment with remaining due
- OVERDUE: Payment past next due date

### Bed Assignment
- When tenant is created, bed status changes to OCCUPIED
- Room's occupiedBeds count increments
- When tenant is deleted, bed becomes AVAILABLE and occupiedBeds decrements
