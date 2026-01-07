CREATE OR REPLACE FUNCTION auth_register(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_username VARCHAR,
    p_email VARCHAR,
    p_password_hash VARCHAR
)
RETURNS UUID -- Geriye yeni oluşan kullanıcının ID'sini döndürür
LANGUAGE plpgsql
AS $$
DECLARE
    v_role_id UUID;
    v_new_user_id UUID;
BEGIN
    -- 1. 'user' rolünün ID'sini dinamik olarak buluyoruz
    SELECT role_id INTO v_role_id FROM roles WHERE role_name = 'walktogether_user';
    
    -- Eğer rol tablosu boşsa veya 'user' yoksa hata fırlat
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Varsayılan kullanıcı rolü (user) bulunamadı.';
    END IF;

    -- 2. Kullanıcıyı ekle (Default değerler otomatik atanır)
    INSERT INTO users (
        role_id,
        first_name, 
        last_name, 
        username, 
        email, 
        password_hash
    )
    VALUES (
        v_role_id,
        p_first_name,
        p_last_name,
        p_username,
        p_email,
        p_password_hash
    )
    RETURNING user_id INTO v_new_user_id; -- Oluşan ID'yi değişkene al

    -- 3. Yeni ID'yi döndür
    RETURN v_new_user_id;
END;
$$;