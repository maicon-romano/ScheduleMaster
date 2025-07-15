# Schedule Management System

## Overview

This is a weekly technical support schedule management system built with React frontend and Express backend. The system manages employee schedules, handles weekend rotation, and accounts for holidays. It uses a file-based JSON storage system and is designed to be lightweight and functional.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Storage**: File-based JSON storage (no external database)
- **API**: RESTful API endpoints
- **Validation**: Zod schemas for request/response validation
- **Build Tool**: ESBuild for production bundling

## Key Components

### Data Models
- **Employee**: Name, work days, shift times, weekend rotation participation
- **Holiday**: Date (MM-DD format), name, type (national/recife), active status
- **Schedule Entry**: Daily schedule with morning/afternoon/oncall employee assignments
- **Weekend Rotation State**: Tracks last assigned employees for weekend shifts

### Storage Layer
- **FileStorage**: Implements IStorage interface for CRUD operations
- **JSON Files**: 
  - `funcionarios.json` - Employee data
  - `feriados.json` - Holiday definitions
  - `escalas.json` - Generated schedules
  - `revezamento.json` - Weekend rotation state

### API Endpoints
- **Employees**: GET, POST, PUT, DELETE `/api/employees`
- **Holidays**: GET, POST, PUT, DELETE `/api/holidays`
- **Schedules**: GET, POST, PUT, DELETE `/api/schedules`
- **Schedule Generation**: POST `/api/schedules/generate`
- **Weekend Rotation**: GET, PUT `/api/rotation-state`

### Frontend Pages
- **Schedule Page**: Main view showing weekly schedule with generation capabilities
- **Employees Page**: Employee management with CRUD operations
- **Holidays Page**: Holiday management with CRUD operations

## Data Flow

1. **Schedule Generation**: 
   - Fetches active employees and their work patterns
   - Considers weekend rotation state for fair distribution
   - Checks holidays and marks them appropriately
   - Generates 7-day schedule starting from Monday

2. **Employee Management**:
   - Supports fixed work days and shift times
   - Weekend rotation participation flag
   - Active/inactive status management

3. **Holiday Handling**:
   - Stores holidays without year (MM-DD format)
   - Supports national and Recife-specific holidays
   - Automatically detected during schedule generation

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router alternative)
- UI components from Radix UI
- Styling with Tailwind CSS
- State management with TanStack Query
- Form handling with React Hook Form
- Date utilities with date-fns
- Validation with Zod

### Backend Dependencies
- Express.js for server framework
- Zod for schema validation
- File system operations for JSON storage
- Development tools (tsx, esbuild, vite)

### Development Tools
- TypeScript for type safety
- Vite for frontend development
- ESBuild for backend bundling
- Replit integration for development environment

## Deployment Strategy

### Development
- Frontend: Vite dev server with HMR
- Backend: tsx with nodemon-like restart
- File storage: Local JSON files in `data/` directory

### Production
- Frontend: Static build output to `dist/public`
- Backend: ESBuild bundle to `dist/index.js`
- File storage: Persistent JSON files
- Single server deployment with static file serving

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript schemas
├── data/           # JSON storage files
└── dist/           # Production build output
```

The system is designed to be self-contained with no external database dependencies, making it suitable for simple deployment scenarios while providing a full-featured schedule management solution.