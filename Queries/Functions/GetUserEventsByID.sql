-- Drop the function if it already exists to ensure a clean update
DROP FUNCTION IF EXISTS get_events_by_user_id(UUID);

-- Create the function
CREATE OR REPLACE FUNCTION get_events_by_user_id(p_user_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMP,
    total_distance_meters INT,
    invitation_code VARCHAR,
    creator_username VARCHAR,
    is_creator BOOLEAN  
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        e.event_id,
        e.title,
        e.description,
        e.start_date,
        e.total_distance_meters,
        e.invitation_code,
        u.username AS creator_username,
        (e.creator_id = p_user_id) AS is_creator
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