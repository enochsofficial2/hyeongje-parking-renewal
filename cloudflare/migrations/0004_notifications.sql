CREATE TABLE reservation_notifications (
 id TEXT PRIMARY KEY,
 reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
 recipient_role TEXT NOT NULL CHECK(recipient_role IN ('customer','operator')),
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 group_id TEXT,
 message_id TEXT,
 error_code TEXT,
 UNIQUE(reservation_id,recipient_role)
);
CREATE INDEX notifications_pending ON reservation_notifications(status,created_at);
CREATE TRIGGER enqueue_reservation_notifications AFTER INSERT ON reservations
BEGIN
 INSERT INTO reservation_notifications(id,reservation_id,recipient_role,created_at,updated_at)
 VALUES(NEW.id||':customer',NEW.id,'customer',NEW.created_at,NEW.created_at);
 INSERT INTO reservation_notifications(id,reservation_id,recipient_role,created_at,updated_at)
 VALUES(NEW.id||':operator',NEW.id,'operator',NEW.created_at,NEW.created_at);
END;
