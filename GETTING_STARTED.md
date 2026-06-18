# 🚀 DataSuite Database Connection - Complete Setup

## ✅ Status: READY TO USE

Your DataSuite application is now **fully connected with a working database** and SQL execution is enabled!

---

## What's Working

| Feature | Status | Details |
|---------|--------|---------|
| 🗄️ **Database** | ✅ SQLite (Development) | `datasuite.db` file-based |
| 📊 **SQL Execution** | ✅ Real Queries | No more mock data |
| 🔍 **Query Editor** | ✅ IDE Available | `/dashboard/sql` |
| 📈 **Dashboards** | ✅ Ready | Build from query results |
| 🤖 **AI Analyst** | ✅ Running | `/dashboard/ai` |
| ⚙️ **Schema Support** | ✅ Auto-detection | View all tables and columns |

---

## Quick Start

### 1. **Open the App** 
```
http://localhost:5001
```

### 2. **Navigate to SQL Workbench**
- Click "Get started" → Dashboard
- Select "SQL" tab from left sidebar
- Or go directly to `/dashboard/sql`

### 3. **Try a Query**
```sql
-- View all users
SELECT * FROM users LIMIT 5;
```

### 4. **Results Display**
- Query results shown in table format
- Columns auto-detected from result set
- Execution time displayed

---

## Key Configuration Files

### `.env` (Environment Variables)
```
NODE_ENV=development           # Development mode
USE_SQLITE=true               # Use SQLite
DATABASE_URL=                 # Empty = auto-uses datasuite.db
APP_ID=test-app-id-12345
APP_SECRET=test-app-secret-...
```

### `drizzle.config.ts` (Database Config)
- Auto-selects SQLite for development
- Auto-selects MySQL for production
- No changes needed

### `api/sql-router.ts` (SQL Engine)
- Real query execution (recently updated)
- Error handling and timing
- Schema introspection support

---

## Available SQL Commands

### SELECT Queries
```sql
SELECT * FROM users;
SELECT COUNT(*) FROM dashboards;
SELECT id, name, email FROM users WHERE tier = 'enterprise';
```

### INSERT Queries
```sql
INSERT INTO dashboards (userId, title, description) 
VALUES (1, 'My Dashboard', 'Description');
```

### UPDATE Queries
```sql
UPDATE users SET tier = 'analyst' WHERE id = 1;
```

### DELETE Queries
```sql
DELETE FROM dashboards WHERE id = 123;
```

### CREATE Queries
```sql
CREATE TABLE my_table (
  id INTEGER PRIMARY KEY,
  name TEXT,
  value REAL
);
```

---

## Database Tables Reference

### 🧑 `users`
```
Columns: id, unionId, name, email, avatar, role, tier, 
         status, totpSecret, createdAt, updatedAt
```

### 📊 `dashboards`
```
Columns: id, userId, title, description, layoutJson, 
         widgetsJson, isPublic, createdAt, updatedAt
```

### 💾 `sql_queries`
```
Columns: id, userId, name, queryText, description, 
         resultSchema, createdAt, updatedAt
```

### 📓 `workspaces`
```
Columns: id, userId, title, contentJson, 
         createdAt, updatedAt
```

### 💬 `ai_conversations`
```
Columns: id, userId, title, createdAt, updatedAt
```

### 📝 `ai_messages`
```
Columns: id, conversationId, role, content, createdAt
```

---

## API Usage Examples

### Execute SQL via API
```javascript
// Frontend (using tRPC)
const result = await trpcClient.sql.execute.mutate({
  query: "SELECT * FROM users LIMIT 10"
});

console.log(result);
// {
//   success: true,
//   rows: [...],
//   columns: ["id", "unionId", "name", ...],
//   rowCount: 10,
//   executionTime: 25
// }
```

### Get Schema Info
```javascript
const schema = await trpcClient.sql.schema.query();
console.log(schema.tables);
// [
//   { name: "users", columns: [...] },
//   { name: "dashboards", columns: [...] },
//   ...
// ]
```

---

## Development Workflow

### Terminal 1: Dev Server (Already Running)
```bash
npm run dev
# Server running at http://localhost:5001
```

### Terminal 2: Check Logs
```bash
# Watch for database errors or query issues
# Logs appear in Terminal 1
```

### Database Maintenance
```bash
# Push schema changes
npm run db:push

# Generate migrations (after schema changes)
npm run db:generate

# Run migrations
npm run db:migrate
```

---

## Deployment to Production

When ready to deploy with MySQL:

### Step 1: Update Environment
```bash
# .env or deployment config
NODE_ENV=production
DATABASE_URL=mysql://username:password@db-host:3306/datasuite
```

### Step 2: Build & Deploy
```bash
npm run build          # Build for production
npm run start          # Start server
```

### Step 3: Run Migrations
```bash
npm run db:push       # Apply schema to MySQL
```

---

## Troubleshooting

### ❓ "Query returned no results"
- Verify data exists: `SELECT COUNT(*) FROM table_name;`
- Check table exists: `SELECT name FROM sqlite_master WHERE type='table';`
- Review WHERE clause conditions

### ❓ "Syntax Error"
- SQL is case-sensitive (keywords: SELECT, FROM, WHERE)
- String values must be quoted: `'value'`
- Table/column names: use backticks if needed

### ❓ "Database is locked"
- Only one dev server can access SQLite at a time
- Kill other processes: `Ctrl+C` in other terminals
- Restart: `npm run dev`

### ❓ Port 5001 not responding
- Check if terminal shows errors
- Kill the process: `Ctrl+C`
- Restart dev server: `npm run dev`
- Try different port: `npm run dev -- --port 3000`

### ❓ Changes not reflecting
- Refresh browser: `F5` or `Ctrl+R`
- Check console for errors: `F12` → Console
- Review terminal output for API errors

---

## Example: Building a Report

### Step 1: Create Table
```sql
CREATE TABLE sales_2024 (
  id INTEGER PRIMARY KEY,
  month TEXT,
  region TEXT,
  revenue REAL,
  quantity INTEGER
);
```

### Step 2: Insert Data
```sql
INSERT INTO sales_2024 (month, region, revenue, quantity) VALUES
('Jan', 'North', 45000, 120),
('Jan', 'South', 32000, 85),
('Feb', 'North', 52000, 140),
('Feb', 'South', 38000, 95);
```

### Step 3: Query Report
```sql
SELECT 
  month,
  region,
  revenue,
  quantity,
  ROUND(revenue / quantity, 2) as avg_per_unit
FROM sales_2024
ORDER BY month, region;
```

### Step 4: Build Dashboard
- Save query
- Add to dashboard as table widget
- Connect to KPI cards for visualizations

---

## Security Notes

### Development ✅
- SQLite file-based (no network)
- Test credentials used
- Safe for local development

### Production ⚠️
- Change `APP_SECRET` to strong random value
- Use environment-specific MySQL credentials
- Enable HTTPS/TLS for database connection
- Implement query rate limiting
- Add SQL injection prevention (already handled by Drizzle ORM)

---

## Performance Tips

- Index frequently queried columns
- Use LIMIT for large result sets
- Avoid SELECT * - specify needed columns
- Use aggregate functions (COUNT, SUM, AVG) instead of processing in app
- For large reports, consider creating materialized views

---

## Next Steps

1. ✅ **Database Connected** - Complete
2. ✅ **SQL Execution Ready** - Complete
3. ⏳ **Build Queries** - Start creating
4. ⏳ **Create Dashboards** - Visualize data
5. ⏳ **Share Insights** - Present results

---

## Resources

- 📄 [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed setup
- 📄 [SQL_SETUP_COMPLETE.md](./SQL_SETUP_COMPLETE.md) - Feature overview
- 🔗 [Drizzle ORM Docs](https://orm.drizzle.team)
- 🔗 [SQLite Docs](https://www.sqlite.org/docs.html)

---

## Support

**Having issues?** Check:
1. Terminal logs for errors
2. Browser console (`F12`)
3. Database file exists: `datasuite.db`
4. Port is accessible: `http://localhost:5001`

**Everything should be working now!** 🎉

Start writing queries and building your data insights with DataSuite!
