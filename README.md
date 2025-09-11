# Vantex Affiliate Management System

A production-ready affiliate management system built with React (Vite) frontend and Node.js backend with SQL Server database.

## Features

- **Affiliate Registration**: Self-registration with admin approval workflow
- **Two-Level Hierarchy**: Track Sub1 (direct referrer) and Sub2 (upline) relationships
- **Admin Dashboard**: Comprehensive management interface for affiliates and downlines
- **Status Management**: Track affiliate statuses (Pending, Approved, Rejected, Suspended, Banned)
- **Downline Management**: Add and manage downlines with automatic hierarchy mapping
- **Secure Authentication**: JWT-based admin authentication
- **Production Ready**: Built with security best practices and error handling

## System Requirements

- Node.js 18+ 
- SQL Server 2019+
- Modern web browser

## Installation & Setup

### 1. Database Setup

1. Install SQL Server and create a new database
2. Run the schema script:
   ```sql
   -- Execute the contents of backend/database/schema.sql
   ```

### 2. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   DB_SERVER=localhost
   DB_DATABASE=VantexAffiliate
   DB_USER=sa
   DB_PASSWORD=your_password
   DB_PORT=1433
   NODE_ENV=development
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd vantex-affliate
   npm install tailwindcss postcss autoprefixer
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Public Access
- Visit `http://localhost:5173` for affiliate registration
- New affiliates can register and await admin approval

### Admin Access
- Visit `http://localhost:5173/admin/login`
- Default credentials: `admin` / `admin123`
- Manage pending approvals, view all affiliates and downlines

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Affiliates
- `POST /api/affiliates/register` - Register new affiliate
- `POST /api/affiliates/downlines` - Add downline
- `GET /api/affiliates/:code/downlines` - Get affiliate's downlines

### Admin (Protected)
- `GET /api/admin/affiliates/pending` - Get pending affiliates
- `GET /api/admin/affiliates` - Get all affiliates
- `PUT /api/admin/affiliates/:id/approve` - Approve affiliate
- `PUT /api/admin/affiliates/:id/reject` - Reject affiliate
- `GET /api/admin/downlines` - Get all downlines
- `POST /api/admin/downlines` - Manually add downline

## Database Schema

### Tables
- **Affiliates**: Main affiliate records with status tracking
- **Downlines**: Two-level hierarchy tracking (Sub1/Sub2)
- **AdminUsers**: Admin authentication
- **AuditLog**: System activity logging (optional)

### Key Fields
- `affiliate_code`: Auto-generated unique identifier (VTX00001 format)
- `mt5_rebate_account`: Unique MT5 account number
- `status`: Workflow status tracking
- `sub1_affiliate_id`: Direct referrer
- `sub2_affiliate_id`: Upline above Sub1

## Security Features

- JWT authentication for admin access
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet security headers

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update CORS origin in `server.js`
3. Build frontend: `npm run build`
4. Deploy backend to your server
5. Serve frontend build files
6. Configure SSL/HTTPS
7. Set up database backups

## System Workflow

1. **Registration**: User registers → Status: Pending
2. **Approval**: Admin reviews → Status: Approved/Rejected  
3. **Downlines**: Approved affiliates can add downlines
4. **Hierarchy**: System automatically maps Sub1/Sub2 relationships
5. **Management**: Admins can manually add/edit downlines and update statuses

## Support

For technical support or questions about the Vantex Affiliate System, please contact the development team.