CREATE OR REPLACE FUNCTION get_attended_events(p_user_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMPTZ,
    invitation_code VARCHAR,
    creator_username VARCHAR,
    creator_full_name TEXT,
    route_distance_meters INTEGER,
    participant_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.event_id,
        e.title,
        e.description,
        e.start_date,
        e.invitation_code,
        u.username AS creator_username,
        (u.first_name || ' ' || u.last_name) AS creator_full_name,
        r.distance AS route_distance_meters,
        (SELECT COUNT(*) FROM attendances att WHERE att.event_id = e.event_id) AS participant_count
    FROM attendances a
    JOIN events e ON a.event_id = e.event_id
    JOIN users u ON e.creator_id = u.user_id
    LEFT JOIN routes r ON e.route_id = r.route_id
    WHERE a.user_id = p_user_id
    ORDER BY e.start_date DESC;
END;
$$;
