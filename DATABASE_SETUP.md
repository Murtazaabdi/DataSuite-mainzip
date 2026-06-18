# Database Setup Guide

## Current Configuration

✅ **Database Connected Successfully**

- **Type**: SQLite (Development) / MySQL (Production)
- **Status**: Running on http://localhost:5001
- **Database File**: `datasuite.db` (SQLite)

## Environment Variables

The `.env` file is configured with:

```
NODE_ENV=development
USE_SQLITE=true
DATABASE_URL=
```

**Key Settings:**
- `USE_SQLITE=true` - Uses SQLite for development (no server required)
- `DATABASE_URL` - Automatically uses `file:datasuite.db` in development
- `APP_ID` & `APP_SECRET` - Authentication keys (set for testing)

## Database Schema

The following tables are created:

1. **users** - User accounts and profiles
2. **dashboards** - Dashboard configurations
3. **sql_queries** - Saved SQL queries
4. **workspaces** - User workspaces/notebooks
5. **ai_conversations** - AI chat history
6. **ai_messages** - Individual AI messages
7. **ai_usage** - AI usage tracking
8. **audit_logs** - System audit logs

## Using SQL in the App

### 1. SQL Workbench (IDE → SQL Tab)

The SQL editor at `/dashboard/sql` allows you to:
- Write and execute SQL queries
- View query results in real-time
- Save queries for later use

### 2. Available SQL Features

- ✅ Query execution against datasuite database
- ✅ Schema introspection (view tables and columns)
- ✅ Result pagination
- ✅ Query history
- ✅ Saved queries management

### 3. Example Query

```sql
-- View all users
SELECT * FROM users LIMIT 10;

-- Create a dashboard
INSERT INTO dashboards (userId, title, description) 
VALUES (1, 'My Dashboard', 'First dashboard');

-- Query data
SELECT COUNT(*) as total FROM users;
```

## Switching Between SQLite and MySQL

### Development (SQLite)

No changes needed - already configured. Database persists in `datasuite.db`.

### Production (MySQL)

Update `.env`:

```
NODE_ENV=production
DATABASE_URL=mysql://username:password@host:port/datasuite
```

Then run migrations:

```bash
npm run db:push
```

## Database Commands

```bash
# Initialize schema
npm run db:push

# Generate migrations (after schema changes)
npm run db:generate

# Run pending migrations
npm run db:migrate
```

## Troubleshooting

### ❌ Database lock error

SQLite locks if multiple processes access it. Ensure only one dev server is running:

```bash
npm run dev
```

### ❌ "Table not found" error

Run migrations again:

```bash
npm run db:push
```

### ❌ Port conflict (5000 already in use)

Vite automatically finds the next available port. Current: **5001**

To specify a port:

```bash
npm run dev -- --port 3000
```

## Next Steps

1. Open http://localhost:5001 in your browser
2. Login or use the test account
3. Navigate to **Dashboard → SQL** to write queries
4. Try the example queries above

Enjoy! 🚀
