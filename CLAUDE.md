# Team Management Application - Project Guidelines

## Critical: Docker Operations

### ⚠️ NEVER run `docker-compose down -v`

The `-v` flag **permanently deletes all database volumes and data with no recovery option**.

**Correct command to restart containers:**
```bash
docker-compose down && docker-compose up -d
```

**WRONG (DO NOT USE):**
```bash
docker-compose down -v  # ❌ This deletes all data permanently
```

### When you need to apply database schema changes:
1. **Do NOT use `-v` flag** - it destroys existing data
2. Use SQL migrations that preserve existing data (ALTER TABLE statements)
3. For major schema changes, create a migration script
4. Test migrations on a backup/copy first
5. Always notify user before any data-affecting operations

### Data Preservation
- The postgres volume (`team-mgmt_postgres_data`) contains all application data
- Keep backups of important data
- Never delete volumes without explicit user confirmation
- If database needs reinitializing, ask user for backup first

---

## Project Overview

**Team Management Application** - A comprehensive resource planning and management system with role-based access control. Organizations can manage employees, projects, and resource allocations with practice-based data isolation.

### Tech Stack
- **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, Axios
- **Backend:** Express.js, Node.js, PostgreSQL
- **Deployment:** Docker Compose (3 services: postgres, backend, frontend/nginx)
- **Authentication:** JWT with bcrypt password hashing

### Project Structure
```
team-mgmt/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin panel pages
│   │   │   └── master/      # Data management pages
│   │   ├── context/         # React Context (Auth)
│   │   ├── api/             # Axios instance & interceptors
│   │   └── App.jsx          # Main router
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── models/          # Data models with business logic
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, admin, error handling
│   │   ├── routes/          # API route definitions
│   │   ├── config/          # Database connection
│   │   └── index.js         # Express server setup
│   └── package.json
├── database/                 # Database scripts
│   ├── init.sql             # Schema & seed data
│   └── migration_*.sql      # Schema migrations
└── docker-compose.yml       # Container orchestration

```

### Key Features (Completed)
- **RBAC System:** Roles control access to specific practices
- **Practice-Based Filtering:** Server-side filtering of employees, projects, allocations
- **Admin Panel:** User, Role, and Practice management
- **Master Practices:** SSDD, VSDD, ESDD (predefined in database)
- **Employee Management:** Create, edit, delete employees with practice assignment
- **Project Management:** Create, edit, delete projects with practice assignment
- **Resource Planning:** Calendar-based allocation view with month-to-month visualization
- **Quick Allocation:** Click empty calendar cells to create allocations with pre-filled data
- **Utilization Warnings:** Alerts when allocations exceed 100% capacity
- **Authentication:** JWT-based login with secure password hashing
- **Dashboard & Reports:** Practice-filtered view of resource utilization

---

## Database

### Master Practices (Predefined)
The `practices` table contains three master practices:
- **SSDD** (Software Service Delivery)
- **VSDD** (Vertical Service Delivery)
- **ESDD** (Enterprise Service Delivery)

These are the only practices available in the system. All employees and projects must be assigned to one of these practices.

### Schema Changes
If schema changes are needed:
1. Create a migration script in `database/migration_*.sql`
2. Test on a copy first
3. Run manually with: `docker exec resource-analysis-db psql -U postgres -d resource_analysis_db < migration.sql`
4. Never use `-v` flag when restarting

---

## RBAC System

### User Roles
- **Admin:** Full access to all data and admin panel
  - Can create/edit/delete users, roles, practices
  - See all employees, projects, allocations across all practices
  
- **Non-Admin:** Restricted access based on assigned role
  - Can only see data belonging to their assigned practice(s)
  - Cannot access admin panel

### How It Works
1. Admin creates a Role (e.g., "SSDD Team")
2. Admin assigns Practice(s) to the Role (e.g., SSDD)
3. Admin creates Users and assigns them a Role
4. User logs in and can only see data for their assigned practice(s)
5. Data filtering happens server-side (cannot be bypassed)

### Default Admin Account
- Email: `admin@example.com`
- Password: `admin123`

---

## Important: Do Not Remove Data

### Before Any Docker Operations
1. Check if you need to restart containers
2. Use `docker-compose down && docker-compose up -d` (without `-v`)
3. If schema changes are needed, use migrations instead

### If Data Loss Occurs
Document what was lost and create recovery plan:
1. Restore from backup if available
2. Recreate data via CSV bulk import (fastest)
3. Recreate data manually via UI

---

## Development Workflow

### Running the Application
```bash
docker-compose up -d --build
```

### Viewing Logs
```bash
docker logs resource-analysis-backend
docker logs resource-analysis-frontend
docker logs resource-analysis-db
```

### Rebuilding Specific Service
```bash
docker-compose up -d --build frontend
docker-compose up -d --build backend
```

### Stopping Without Data Loss
```bash
docker-compose down
# (NOT: docker-compose down -v)
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/me/practices` - Get user's allowed practices

### Admin (protected by admin middleware)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/roles` - List roles
- `POST /api/admin/roles` - Create role
- `PUT /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/practices` - List practices
- `POST /api/admin/practices` - Create practice
- `DELETE /api/admin/practices/:id` - Delete practice

### Data (filtered by user's practices)
- `/api/employees` - Employee management
- `/api/projects` - Project management
- `/api/allocations` - Resource allocations

---

## Notes for Future Development

- All data endpoints are protected by `authMiddleware`
- Data filtering happens server-side in model layer (cannot be bypassed)
- Practice field is VARCHAR in employees and projects tables
- Foreign keys use CASCADE delete where appropriate
- Database uses parameterized queries (safe from SQL injection)

---

## Previous Work (2026-04-24)

### Quick Allocation Feature
- Empty calendar cells in Resource Planner display `+ Add` button
- Clicking any empty cell opens allocation form with pre-filled data:
  - Employee pre-selected
  - Start/End dates pre-filled for the selected month
  - Allocation % defaulted to 100%
- Much faster than using the top-level "+ Add Allocation" button

---

## Today's Work (2026-04-27)

### Features Implemented

#### 1. **Bench Report - FTE Bandwidth Optimization**
Changed bench availability calculation from employee count to actual FTE capacity:

**Old Behavior:** Counted employees with zero allocations
- "50% bench availability" = half the employees are unallocated

**New Behavior:** Calculates actual available FTE capacity
- Each employee = 1.0 FTE
- Available FTE% = 100% - Utilization%
- Sums all partial allocations to show true available capacity
- Example: 10 employees with 50% avg allocation = 5.0 FTE available (50% bench)

**Enhanced Drill-Down Table** — When clicking a month's bar:
- Shows **Utilization %** with visual progress bar
- Shows **Available FTE %** with color-coded chips (Green >50%, Yellow 25-50%, Gray <25%)
- Shows **Available Capacity** in FTE format (e.g., 0.5 FTE, 1.0 FTE)
- Displays **Total Available FTE** for the month
- More accurate resource planning view

### Code Changes
- **`frontend/src/pages/DashboardAndReports.jsx`**
  - Updated `getBenchData()` function to calculate FTE-based availability
  - Changed from: `benchEmployees.length / total_employees * 100`
  - To: `total_available_FTE / total_FTE_capacity * 100`
  - Updated drill-down table headers: Utilization, Available FTE %, Available Capacity
  - Added color-coded availability chips and FTE display

#### 2. **Project Search Feature**
Added real-time search in Project Management module:

**Features:**
- Search input at top of project list (left panel)
- Real-time filtering by project name
- Case-insensitive partial matching
- Shows "No projects match your search" when no results
- Same UX pattern as Employee Search module

**Code Changes:**
- **`frontend/src/pages/master/AddProject.jsx`**
  - Added `searchQuery` and `selectedProject` state variables
  - Added `getFilteredProjects()` function for real-time filtering
  - Added TextField component for search input
  - Updated project list rendering to use filtered results
  - Added "no results" message handling

### Testing
- Rebuilt frontend with `docker-compose up -d --build frontend`
- All containers running healthy (Backend, Frontend, PostgreSQL)
- FTE calculations verified with multiple allocation scenarios
- Search filtering tested with partial and case-insensitive queries

### System Status
- ✅ All containers running and healthy
- ✅ Database: PostgreSQL with all migrations applied
- ✅ Frontend: React 18 with Material UI (MUI v5)
- ✅ Backend: Express.js with all RBAC and filtering working

### Known Issues / Notes
- None at this time

---

## Today's Work (2026-04-28)

### Bug Fix: Session Management Authentication Bypass

#### Issue
When app loaded, it would trust tokens from `localStorage` without validating them with the backend. This meant:
- Stale/invalid tokens from previous sessions granted access
- Users could bypass login by having a cached token
- Session wasn't cleared when browser closed

#### Solution
1. **Token Validation on App Load** - AuthContext now validates tokens by calling `/api/auth/profile` 
2. **Switched to sessionStorage** - Replaced `localStorage` with `sessionStorage` for auth tokens
   - sessionStorage is automatically cleared when browser/tab closes
   - Prevents stale tokens from previous sessions
   - User must re-login after closing browser

#### Code Changes
- **`frontend/src/context/AuthContext.jsx`**
  - Validate token against backend on app initialization
  - Clear invalid tokens from storage
  - Changed all `localStorage` to `sessionStorage` for token/user data
  
- **`frontend/src/api/axiosInstance.js`**
  - Changed `localStorage` to `sessionStorage` in request interceptor
  - Changed `localStorage` to `sessionStorage` in error handler (401 response)

#### Testing
- ✅ App redirects to login if sessionStorage is empty
- ✅ Token validated against `/api/auth/profile` on load
- ✅ Invalid tokens are cleared automatically
- ✅ Session cleared when browser closes (not on tab close)

### System Status
- ✅ All containers running and healthy
- ✅ Frontend rebuilt and deployed
- ✅ Authentication flow secured
- ✅ Session management working as expected

---

**Last Updated:** 2026-04-28 (Session Management Auth Fix)
