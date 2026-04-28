# Setup & Deployment Guide

## Prerequisites

- Docker & Docker Compose (latest version)
- Git (for version control)
- Optional: Node.js 18+ (for local development)

## Quick Start (Docker)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd team-mgmt
```

### 2. Configure Environment (Optional)
Edit `.env` if you want custom credentials or database name:
```bash
# Default values are fine for development
# Only change if you need different ports or credentials
```

### 3. Build and Run
```bash
docker-compose up --build
```

This will:
- Build the frontend React app (Vite)
- Build the backend Express server
- Start PostgreSQL database
- Start Nginx reverse proxy
- Seed the database with admin user

### 4. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### 5. Login
Use default credentials:
```
Email: admin@example.com
Password: admin123
```

## Common Docker Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop services
```bash
docker-compose down
```

### Restart services
```bash
docker-compose restart
```

### Clean up everything
```bash
docker-compose down -v  # Also removes volumes
```

### View running containers
```bash
docker-compose ps
```

## Local Development (Without Docker)

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Setup PostgreSQL locally and create database:
```bash
psql -U postgres
CREATE DATABASE resource_analysis_db;
\c resource_analysis_db
\i ../database/init.sql
```

3. Update `.env` with local database credentials:
```bash
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=<your-password>
```

4. Start the backend:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Update `.env` if backend is on different URL:
```bash
VITE_API_URL=http://localhost:5000/api
```

3. Start the dev server:
```bash
npm run dev
```

## Database Schema

The database is automatically initialized with three tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Employees Table
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Customization

### Changing Default Credentials

Edit `database/init.sql` before first run:
```sql
INSERT INTO users (email, password, full_name)
VALUES ('your-email@example.com', 'bcrypt-hashed-password', 'Your Name');
```

Use an online bcrypt generator to hash passwords: https://bcrypt-generator.com/

### Changing Ports

Edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Access on http://localhost:8080

backend:
  ports:
    - "5001:5000"  # Backend on 5001

postgres:
  ports:
    - "5433:5432"  # Database on 5433
```

### Adding More Master Modules

1. Create database table in `database/init.sql`
2. Create Model class in `backend/src/models/`
3. Create Controller in `backend/src/controllers/`
4. Create Routes in `backend/src/routes/`
5. Mount routes in `backend/src/index.js`
6. Create React page in `frontend/src/pages/master/`
7. Add navigation to `frontend/src/components/Sidebar.jsx`

## Deployment Considerations

### Security

1. **Change JWT Secret**
   ```bash
   # Generate a strong secret
   openssl rand -base64 32
   ```

2. **Update Database Credentials**
   - Don't use defaults in production
   - Use strong passwords

3. **Use HTTPS**
   - Configure SSL/TLS in Nginx
   - Update frontend API URL to HTTPS

### Performance

1. **Enable Database Connection Pooling**
   - Already configured in backend

2. **Use Production Node.js Build**
   - Set `NODE_ENV=production`

3. **Compress Assets**
   - Nginx gzip is configured

4. **CDN for Static Assets**
   - Serve frontend from CDN in production

### Monitoring

1. **Logging**
   - Docker logs are available via `docker-compose logs`
   - Configure ELK stack for production

2. **Database Backups**
   ```bash
   docker-compose exec postgres pg_dump -U postgres resource_analysis_db > backup.sql
   ```

3. **Health Checks**
   - Frontend: Check if Nginx is responding
   - Backend: `GET /api/health`
   - Database: Connection pool health

## Troubleshooting

### Issue: "Address already in use"
**Solution**: Change ports in docker-compose.yml

### Issue: "Database connection refused"
**Solution**: 
```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres
```

### Issue: "401 Unauthorized" after login
**Solution**:
- Check JWT_SECRET is same in backend and frontend
- Clear browser localStorage
- Check token expiry time

### Issue: Frontend can't reach backend
**Solution**:
- Check `VITE_API_URL` in frontend/.env
- Verify backend is running: `docker-compose logs backend`
- Check Nginx configuration in nginx.conf

### Issue: CORS errors
**Solution**:
- Update CORS configuration in `backend/src/index.js`
- Check frontend and backend URLs match

## Backing Up Data

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres resource_analysis_db > backup.sql

# Backup volumes
docker run --rm -v team-mgmt_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Restoring Data

```bash
# Restore database
docker-compose exec -T postgres psql -U postgres < backup.sql

# Or copy backup file into container
docker cp backup.sql team-mgmt-postgres-1:/
docker-compose exec postgres psql -U postgres < /backup.sql
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review README.md
3. Check database state: `docker-compose exec postgres psql -U postgres -d resource_analysis_db`
