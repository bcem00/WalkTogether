CREATE OR REPLACE FUNCTION join_event_by_code(p_user_id UUID, p_invite_code VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    SELECT event_id INTO v_event_id FROM events WHERE invitation_code = p_invite_code;
    
    IF v_event_id IS NULL THEN
        RETURN 0;
    END IF;

    INSERT INTO attendances (user_id, event_id) 
    VALUES (p_user_id, v_event_id)
    ON CONFLICT (user_id, event_id) DO NOTHING;

    IF FOUND THEN
        RETURN 1;
    ELSE
        RETURN 2;
    END IF;
END;
$$;