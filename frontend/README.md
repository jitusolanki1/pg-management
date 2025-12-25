# PG Management System - Frontend

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features Implemented

### 3D Floor Visualization
- Canvas-based 2D visualization of floors, rooms, and beds
- Visual distinction between AC and Non-AC rooms
- Color-coded bed status (Available: Green, Occupied: Red)
- Interactive floor selection
- Click detection on beds for future tenant assignment
- Grid-based room layout (no dragging required)
- Responsive canvas rendering

### Authentication
- Admin login and registration
- JWT token storage
- Protected routes
- Context-based auth state management

### Floor Management
- Create, view, and delete floors
- Create rooms with automatic bed generation
- Visual floor selector
- Room type selection (AC/Non-AC)
- Configurable bed count per room

## Tech Stack
- React 18 with JSX (No TypeScript)
- React Router for navigation
- Vite for build tooling
- Tailwind CSS for styling
- HTML Canvas for 3D visualization
- No external UI libraries

## Design System
- Primary: #0a0a0a (Dark background)
- Secondary: #1a1a1a (Cards/panels)
- Accent: #3b82f6 (Blue for CTAs)
- Success: #10b981 (Green for available)
- Danger: #ef4444 (Red for occupied/delete)
- Border: #2a2a2a (Subtle borders)

## Next Steps
- Implement tenant management
- Implement payment system
- Complete dashboard statistics
