-- Belirtilen Mesafe Aralığında Olan Etkinlikleri Filtreleyen Fonksiyon
CREATE OR REPLACE FUNCTION filter_events_by_distance(p_min_dist INTEGER, p_max_dist INTEGER)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMPTZ,
    invitation_code VARCHAR,
    creator_full_name TEXT,
    creator_username VARCHAR,
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
        (u.first_name || ' ' || u.last_name)::TEXT AS creator_full_name,
        u.username AS creator_username,
        MAX(r.distance)::INTEGER AS route_distance_meters,
        (SELECT COUNT(*) FROM attendances a WHERE a.event_id = e.event_id) AS participant_count
    FROM events e
    JOIN users u ON e.creator_id = u.user_id
    JOIN routes r ON e.route_id = r.route_id
    GROUP BY e.event_id, e.title, e.description, e.start_date, e.invitation_code, u.first_name, u.last_name, u.username
    HAVING MAX(r.distance) BETWEEN p_min_dist AND p_max_dist
    ORDER BY e.start_date ASC;
END;
$$;