DROP FUNCTION IF EXISTS get_events_by_user_id(UUID);

CREATE OR REPLACE FUNCTION get_events_by_user_id(p_user_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMPTZ, -- or TIMESTAMP WITH TIME ZONE depending on your DB setup
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
    SELECT
        e.event_id,
        e.title,
        e.description,
        e.start_date,  
        e.total_distance_meters,
        e.invitation_code,
        u.username AS creator_username,
        (e.creator_id = p_user_id) AS is_creator,
        e.route_polyline,    
        e.waypoints_json     
    FROM events e
    JOIN users u ON u.user_id = e.creator_id
    JOIN attendances a ON a.event_id = e.event_id AND a.user_id = p_user_id;
END;
$$;