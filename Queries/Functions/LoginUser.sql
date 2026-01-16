CREATE OR REPLACE FUNCTION auth_get_user_for_login(
    p_identifier VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    email VARCHAR,
    password_hash VARCHAR,
    role_name VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.password_hash,
        r.role_name,
        u.first_name,
        u.last_name
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.email = LOWER(p_identifier) OR u.username = LOWER(p_identifier);
END;
$$;