CREATE OR REPLACE FUNCTION add_event_distance_to_attendees(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_distance INTEGER;
    v_updated_count INTEGER;
BEGIN
    SELECT r.distance INTO v_distance
    FROM events e
    JOIN routes r ON e.route_id = r.route_id
    WHERE e.event_id = p_event_id;

    IF v_distance IS NULL THEN
        RETURN 0;
    END IF;

    UPDATE users u
    SET motivation_point = motivation_point + v_distance
    WHERE u.user_id IN (
        SELECT a.user_id
        FROM attendances a
        WHERE a.event_id = p_event_id
    );

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN v_updated_count;
END;
$$;
