-- Hiçbir Etkinliğe Katılmamış Kullanıcıları Getiren Fonksiyon (admin)
CREATE OR REPLACE FUNCTION get_inactive_users()
RETURNS TABLE (
    out_username VARCHAR,
    out_email VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT u.username, u.email
    FROM users u
    WHERE u.user_id IN (
        SELECT user_id FROM users
        EXCEPT
        SELECT user_id FROM attendances
    );
END;
$$;