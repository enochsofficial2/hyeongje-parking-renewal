PRAGMA foreign_keys = ON;
CREATE TABLE admins (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE admin_sessions (token_hash TEXT PRIMARY KEY,admin_id TEXT NOT NULL REFERENCES admins(id),expires_at INTEGER NOT NULL);
CREATE TABLE reservations (
 id TEXT PRIMARY KEY,created_at TEXT NOT NULL,name TEXT NOT NULL,phone TEXT NOT NULL,
 route TEXT,dest TEXT,plate TEXT,car TEXT,people INTEGER,golf INTEGER,note TEXT,
 in_date TEXT,in_time TEXT,out_date TEXT,out_time TEXT,status TEXT NOT NULL DEFAULT '접수대기',
 visitor_id TEXT,session_id TEXT,journey TEXT,idempotency_key TEXT UNIQUE
);
CREATE INDEX reservations_created ON reservations(created_at DESC);
CREATE INDEX reservations_entry ON reservations(in_date,status);
CREATE TABLE visits (id TEXT PRIMARY KEY,visitor_id TEXT NOT NULL,session_id TEXT NOT NULL,created_at TEXT NOT NULL,source TEXT,medium TEXT,campaign TEXT,path TEXT,referrer TEXT,device TEXT,journey TEXT);
CREATE INDEX visits_created ON visits(created_at DESC);
CREATE INDEX visits_session ON visits(session_id);
CREATE TABLE events (id TEXT PRIMARY KEY,visitor_id TEXT,session_id TEXT,created_at TEXT NOT NULL,name TEXT NOT NULL,path TEXT,source TEXT,medium TEXT,section TEXT);
CREATE INDEX events_created ON events(created_at DESC);
CREATE TABLE media (key TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE legacy_stats (table_name TEXT NOT NULL,row_json TEXT NOT NULL);
