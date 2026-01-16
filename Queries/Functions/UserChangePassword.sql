CREATE OR REPLACE FUNCTION user_change_password(
    p_user_id UUID,
    p_new_password_hash VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows_affected INT;
BEGIN
    UPDATE users 
    SET password_hash = p_new_password_hash
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    RETURN v_rows_affected > 0;
END;
$$;