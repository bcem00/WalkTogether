CREATE OR REPLACE FUNCTION filter_events_by_distance(p_min_dist INTEGER, p_max_dist INTEGER)
RETURNS TABLE (
    event_title VARCHAR,
    event_start_date TIMESTAMPTZ,
    route_distance INTEGER,
    participant_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.title, 
        e.start_date,
        MAX(r.distance)::INTEGER,
        COUNT(a.attendance_id)
    FROM events e
    JOIN routes r ON e.route_id = r.route_id
    LEFT JOIN attendances a ON e.event_id = a.event_id
    GROUP BY e.event_id, e.title, e.start_date

    HAVING MAX(r.distance) BETWEEN p_min_dist AND p_max_dist;
END;
$$;