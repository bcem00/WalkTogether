CREATE OR REPLACE FUNCTION get_total_event_count()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_value INTEGER;
    v_is_called BOOLEAN;
BEGIN
    -- Get the current value and is_called status from the sequence
    SELECT last_value, is_called INTO v_current_value, v_is_called FROM event_number_seq;
    
    -- If sequence has never been used (is_called = false), no events exist
    -- Otherwise, calculate: current_value - starting_value + 1
    -- Sequence starts at 1000, so total = current_value - 999
    IF v_is_called THEN
        RETURN v_current_value - 999;
    ELSE
        RETURN 0;
    END IF;
END;
$$;
