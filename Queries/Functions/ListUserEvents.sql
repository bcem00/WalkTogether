CREATE OR REPLACE FUNCTION get_events_by_username(p_username VARCHAR)
RETURNS TABLE (
    title VARCHAR,
    description TEXT,
    start_date TIMESTAMPTZ,
    invitation_code VARCHAR,
    creator_id UUID
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.title, 
        e.description, 
        e.start_date, 
        e.invitation_code, 
        e.creator_id
    FROM events e
    JOIN users u ON u.user_id = e.creator_id
    WHERE u.username = p_username;
END;
$$;