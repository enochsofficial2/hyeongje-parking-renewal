ALTER TABLE events ADD COLUMN engagement_ms INTEGER NOT NULL DEFAULT 0;
CREATE INDEX events_session ON events(session_id);
