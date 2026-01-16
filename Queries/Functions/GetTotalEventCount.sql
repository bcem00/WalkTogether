CREATE OR REPLACE FUNCTION get_total_event_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_value INTEGER;
    v_is_called BOOLEAN;
BEGIN
    SELECT last_value, is_called INTO v_current_value, v_is_called FROM event_number_seq;
    IF v_is_called THEN
        RETURN v_current_value - 999;
    ELSE
        RETURN 0;
    END IF;
END;
$$;
