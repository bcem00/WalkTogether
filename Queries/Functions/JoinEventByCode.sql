CREATE OR REPLACE FUNCTION join_event_by_code(p_user_id UUID, p_invite_code VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- 1. Find Event
    SELECT event_id INTO v_event_id FROM events WHERE invitation_code = p_invite_code;
    
    IF v_event_id IS NULL THEN
        RETURN 0; -- Error: Invalid Code
    END IF;

    -- 2. Insert safely (Atomic Operation)
    INSERT INTO attendances (user_id, event_id) 
    VALUES (p_user_id, v_event_id)
    ON CONFLICT (user_id, event_id) DO NOTHING; -- Assuming you have a composite PK or Unique index

    IF FOUND THEN
        RETURN 1; -- Success: Joined
    ELSE
        RETURN 2; -- Info: Already Joined
    END IF;
END;
$$;