# Resource Analysis Web Application

A full-stack MVC boilerplate web application for resource analysis and management using React, Node.js, and PostgreSQL, fully containerized with Docker.

## Features

- **User Authentication**: JWT-based login system with secure password hashing
- **Dashboard**: Real-time statistics on employees and projects
- **Master Records Management**:
  - Add/Edit/Delete Employees (with name, email, position, department)
  - Add/Edit/Delete Projects (with name, description, dates, budget)
- **Responsive UI**: Modern design using Tailwind CSS
- **Mobile-Friendly**: Hamburger navigation menu for mobile devices
- **MVC Architecture**: Clean separation of concerns
- **Containerized**: Full Docker deployment with PostgreSQL, Express, and React

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with JWT interceptor

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file server

## Default Credentials

```
Email: admin@example.com
Password: admin123
```

## Quick Start

### Prerequisites
- Docker & Docker Compose installed

### Running with Docker Compose

1. **Clone and navigate to the project:**
   ```bash
   cd team-mgmt
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000/api
   - API Health Check: http://localhost:5000/api/health

4. **Login with default credentials:**
   - Email: `admin@example.com`
   - Password: `admin123`

5. **Stop services:**
   ```bash
   docker-compose down
   ```

## Project Structure

```
team-mgmt/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Database connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js    # Login & profile endpoints
│   │   │   ├── employeeController.js # Employee CRUD
│   │   │   └── projectController.js  # Project CRUD
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # JWT verification
│   │   ├── models/
│   │   │   ├── User.js              # User queries
│   │   │   ├── Employee.js          # Employee queries
│   │   │   └── Project.js           # Project queries
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # Auth endpoints
│   │   │   ├── employeeRoutes.js    # Employee endpoints
│   │   │   └── projectRoutes.js     # Project endpoints
│   │   └── index.js                 # Express app entry
│   ├── .env                          # Environment variables
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js     # Axios with JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── Sidebar.jsx          # Hamburger menu
│   │   │   └── PrivateRoute.jsx     # Protected routes
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Home.jsx             # Main layout
│   │   │   ├── Dashboard.jsx        # Dashboard with stats
│   │   │   └── master/
│   │   │       ├── AddEmployee.jsx  # Employee form
│   │   │       └── AddProject.jsx   # Project form
│   │   ├── App.jsx                  # Route definitions
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Tailwind imports
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf                   # Nginx configuration
│   ├── .env                         # Frontend env vars
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── init.sql                     # Database schema & seed data
│
├── docker-compose.yml               # Multi-container orchestration
└── .env                             # Root environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Environment Variables

### Backend (.env in backend/)
```
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=resource_analysis_db
DB_USER=postgres
DB_PASSWORD=postgres123
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY=7d
```

### Frontend (.env in frontend/)
```
VITE_API_URL=http://localhost:5000/api
```

## Development Setup (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 15

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Database

The PostgreSQL database is automatically initialized with:
- **users** table - Stores user accounts with hashed passwords
- **employees** table - Employee records
- **projects** table - Project records

Default admin user is seeded automatically with credentials:
- Email: `admin@example.com`
- Password: `admin123` (bcrypt hashed)

## Security Notes

⚠️ **Important for Production:**

1. Change the default admin password immediately
2. Update `JWT_SECRET` in `.env` to a strong random string
3. Use HTTPS in production
4. Implement CORS properly for production domains
5. Add rate limiting to login endpoint
6. Consider using environment-specific configs

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Database connection errors
- Ensure postgres service is healthy: `docker-compose ps`
- Check DB credentials in `.env` match docker-compose.yml

### Port already in use
```bash
# Change ports in docker-compose.yml or .env
# Default ports: 80 (frontend), 5000 (backend), 5432 (postgres)
```

### Login fails
- Check backend logs: `docker-compose logs backend`
- Verify database is initialized: `docker-compose exec postgres psql -U postgres -d resource_analysis_db -c "\dt"`

## Deployment

For production deployment:

1. Update environment variables in `.env` and `docker-compose.yml`
2. Build and push images to container registry
3. Use orchestration platform (Kubernetes, Docker Swarm, etc.)
4. Configure proper logging and monitoring
5. Set up backup strategies for database

## Contributing

This is a boilerplate project. Feel free to extend with:
- Additional master modules
- Advanced reporting and analytics
- Real-time notifications
- File upload capabilities
- API documentation (Swagger/OpenAPI)
- Unit and integration tests

## License

MIT
