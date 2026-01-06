DROP FUNCTION IF EXISTS get_events_by_user_id(UUID);

CREATE OR REPLACE FUNCTION get_events_by_user_id(p_user_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMP, -- or TIMESTAMP WITH TIME ZONE depending on your DB setup
    total_distance_meters INT,
    invitation_code VARCHAR,
    creator_username VARCHAR,
    is_creator BOOLEAN,
    route_polyline VARCHAR,  -- ✅ Added
    waypoints_json VARCHAR   -- ✅ Added
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        e.event_id,
        e.title,
        e.description,
        e.start_date,  -- ensure this matches the return type above
        e.total_distance_meters,
        e.invitation_code,
        u.username AS creator_username,
        (e.creator_id = p_user_id) AS is_creator,
        e.route_polyline,    -- ✅ Select the polyline
        e.waypoints_json     -- ✅ Select the waypoints
    FROM 
        events e
    JOIN 
        users u ON e.creator_id = u.user_id
    LEFT JOIN 
        event_participants ep ON e.event_id = ep.event_id
    WHERE 
        e.creator_id = p_user_id 
        OR 
        ep.user_id = p_user_id;
END;
$$;