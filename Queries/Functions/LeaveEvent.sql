CREATE OR REPLACE FUNCTION leave_event(
    p_user_id UUID,
    p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Belirtilen kullanıcı ve etkinlik eşleşmesini sil
    DELETE FROM attendances
    WHERE user_id = p_user_id AND event_id = p_event_id;

    -- FOUND: PostgreSQL'de son sorgunun bir satıra etki edip etmediğini tutan özel değişkendir.
    -- Eğer silme işlemi yapıldıysa TRUE, kayıt bulunamadıysa FALSE döner.
    RETURN FOUND;
END;
$$;