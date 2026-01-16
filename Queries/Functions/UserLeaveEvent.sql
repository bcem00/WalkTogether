CREATE OR REPLACE FUNCTION leave_event(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM attendances WHERE user_id = p_user_id AND event_id = p_event_id;
    RETURN FOUND;
END;
$$;