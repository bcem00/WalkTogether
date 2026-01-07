-- ================================================================
-- DELETE EVENT (Etkinlik Sil)
-- Etkinliği, rotasını ve rotanın destinasyonlarını siler.
-- Sadece etkinliğin yaratıcısı silebilir.
-- ================================================================
CREATE OR REPLACE FUNCTION delete_event(
    p_user_id UUID,
    p_event_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_route_id UUID;
    v_creator_id UUID;
BEGIN
    -- 1. Etkinliğin yaratıcısını ve route_id'sini al
    SELECT creator_id, route_id INTO v_creator_id, v_route_id
    FROM events
    WHERE event_id = p_event_id;

    -- Etkinlik bulunamadıysa false döndür
    IF v_creator_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Kullanıcı yaratıcı değilse false döndür
    IF v_creator_id != p_user_id THEN
        RAISE EXCEPTION 'Bu etkinliği silme yetkiniz yok.';
    END IF;

    -- 3. Etkinliği sil (attendances CASCADE ile otomatik silinir)
    DELETE FROM events WHERE event_id = p_event_id;

    -- 4. Eğer route varsa, route'u sil (destinations CASCADE ile otomatik silinir)
    IF v_route_id IS NOT NULL THEN
        DELETE FROM destinations WHERE route_id = v_route_id;
        DELETE FROM routes WHERE route_id = v_route_id;
    END IF;

    RETURN TRUE;
END;
$$;
