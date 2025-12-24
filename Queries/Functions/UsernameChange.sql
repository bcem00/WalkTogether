-- ================================================================
-- 4. CHANGE USERNAME (Kullanıcı Adı Değiştir)
-- Kullanıcı adını günceller. (Unique hatasını Backend yakalamalıdır)
-- ================================================================
CREATE OR REPLACE FUNCTION user_change_username(
    p_user_id UUID,
    p_new_username VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_rows_affected INT;
BEGIN
    UPDATE users 
    SET username = p_new_username
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    
    RETURN v_rows_affected > 0;
END;
$$;