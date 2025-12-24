CREATE OR REPLACE VIEW view_upcoming_events_detailed AS
SELECT 
    e.event_id,
    e.title,
    e.description,
    e.start_date,
    e.invitation_code,
    (u.first_name || ' ' || u.last_name) AS creator_full_name,
    u.username AS creator_username,
    r.distance AS route_distance_meters,
    (SELECT COUNT(*) FROM attendances a WHERE a.event_id = e.event_id) AS participant_count
FROM events e
JOIN users u ON e.creator_id = u.user_id
JOIN routes r ON e.route_id = r.route_id
WHERE e.start_date > CURRENT_TIMESTAMP
ORDER BY e.start_date ASC;