CREATE OR REPLACE FUNCTION get_inactive_users()
RETURNS TABLE (
    out_username VARCHAR, -- Çıktı sütun isimleri
    out_email VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- RETURN QUERY: Bir sorgunun sonucunu direkt fonksiyon çıktısı olarak basar
    RETURN QUERY
    SELECT u.username, u.email
    FROM users u
    WHERE u.user_id IN (
        -- EXCEPT KULLANIMI BURADA
        -- Tüm kullanıcılardan, katılım gösterenleri çıkar
        SELECT user_id FROM users
        EXCEPT
        SELECT user_id FROM attendances
    );
END;
$$;