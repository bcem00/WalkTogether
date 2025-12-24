CREATE OR REPLACE FUNCTION join_event_by_code(p_user_id UUID, p_invite_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- 1. Koda sahip etkinliği bul
    SELECT event_id INTO v_event_id FROM events WHERE invitation_code = p_invite_code;
    
    IF v_event_id IS NULL THEN
        RETURN FALSE; -- Kod geçersiz
    END IF;

    -- 2. Zaten katılmış mı kontrol et (Unique kısıtlaması hata vermesin diye)
    IF EXISTS (SELECT 1 FROM attendances WHERE user_id = p_user_id AND event_id = v_event_id) THEN
        RETURN TRUE; 
    END IF;

    -- 3. Kaydı ekle
    INSERT INTO attendances (user_id, event_id) VALUES (p_user_id, v_event_id);
    RETURN TRUE;
END;
$$;