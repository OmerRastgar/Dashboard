# React + FastAPI + SQL Server Dashboard

This project integrates a React frontend with a FastAPI Python backend connected to SQL Server for a complete dashboard solution.

## Prerequisites

### Required Software
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **SQL Server** (Express, Developer, or Standard edition)
- **ODBC Driver 17 for SQL Server**

### SQL Server Setup

1. **Install SQL Server** (if not already installed)
2. **Run the database setup script**:
   ```sql
   -- Connect to SQL Server as admin and run:
   -- backend/setup_database.sql
   ```
3. **Verify the login**:
   ```sql
   -- Test connection with:
   -- Server: localhost
   -- Database: master
   -- Username: dashboard_user
   -- Password: StrongPassword123!
   ```

## Quick Start

### 1. Setup SQL Server Database

**Option A: Using SQL Server Management Studio**
- Open SSMS and connect as administrator
- Open and execute `backend/setup_database.sql`

**Option B: Using sqlcmd**
```bash
sqlcmd -S localhost -E -i backend/setup_database.sql
```

### 2. Start the Backend (FastAPI)

**Option A: Using the batch file (Windows)**
```bash
start-backend.bat
```

**Option B: Manual setup**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the Frontend (React)

```bash
npm install  # if not already done
npm run dev
```

## Access Points

- **Frontend Dashboard**: http://localhost:8080
- **API Documentation**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

## Features

### Backend (FastAPI + SQL Server)
- ✅ SQL Server integration with SQLAlchemy
- ✅ User management (CRUD operations)
- ✅ Audit logging system
- ✅ Dashboard metrics and analytics
- ✅ Health monitoring with database status
- ✅ Sample data initialization
- ✅ RESTful API with proper error handling

### Frontend (React + TypeScript)
- ✅ Modern dashboard with shadcn/ui components
- ✅ Real-time data fetching with React Query
- ✅ User management interface
- ✅ Audit logs viewer
- ✅ Dashboard analytics and metrics
- ✅ Responsive design with Tailwind CSS
- ✅ Toast notifications and loading states

### Database Schema

**Users Table**
- User management with roles and status
- Tracks creation date and last login

**Audit Logs Table**
- Complete activity logging
- User actions, IP addresses, timestamps
- Success/failure status tracking

**Dashboard Metrics Table**
- System metrics and KPIs
- Categorized performance data
- Time-series data for analytics

## API Endpoints

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard overview stats |
| GET | `/api/dashboard/metrics` | System metrics |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | Get audit logs with filters |
| POST | `/api/audit-logs` | Create audit log entry |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + DB status |
| POST | `/api/init-sample-data` | Initialize sample data |

## Dashboard Pages

1. **Dashboard** - Overview with key metrics and charts
2. **Users** - User management with CRUD operations
3. **Roles** - Role-based access control
4. **Search** - Advanced search functionality
5. **Audit Logs** - Complete activity monitoring

## Configuration

### Environment Variables (backend/.env)
```env
SQL_SERVER=localhost
SQL_DATABASE=master
SQL_USERNAME=dashboard_user
SQL_PASSWORD=StrongPassword123!
SQL_DRIVER=ODBC Driver 17 for SQL Server
```

### Database Connection
The application automatically creates tables using SQLAlchemy migrations. The connection string format:
```
mssql+pyodbc://dashboard_user:StrongPassword123!@localhost/DashboardDB?driver=ODBC+Driver+17+for+SQL+Server
```

## Development Workflow

1. **Initialize Sample Data**:
   ```bash
   curl -X POST http://localhost:8000/api/init-sample-data
   ```

2. **Monitor Health**:
   - Frontend shows connection status
   - Backend `/api/health` endpoint provides detailed status

3. **View Logs**:
   - All user actions are automatically logged
   - Audit logs page shows real-time activity

## Troubleshooting

### SQL Server Connection Issues
- Verify SQL Server is running
- Check ODBC Driver 17 is installed
- Confirm login credentials: `dashboard_user` / `StrongPassword123!`
- Test connection string in backend logs

### Backend Issues
- Check Python dependencies: `pip install -r requirements.txt`
- Verify port 8000 is available
- Check backend logs for SQL errors

### Frontend Issues
- Ensure both servers are running
- Check browser console for API errors
- Verify proxy configuration in `vite.config.ts`

## Production Deployment

1. **Security**: Change default passwords and use environment variables
2. **Database**: Use proper SQL Server instance with backups
3. **SSL**: Enable HTTPS for both frontend and backend
4. **Monitoring**: Set up proper logging and monitoring
5. **Performance**: Configure connection pooling and caching