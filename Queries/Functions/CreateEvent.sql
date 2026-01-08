-- Event ve Route'u aynı anda oluşturan fonksiyon
CREATE OR REPLACE FUNCTION create_event(
    p_creator_id UUID,
    p_title VARCHAR(150),
    p_description TEXT,
    p_start_date TIMESTAMPTZ,
    p_route_polyline TEXT DEFAULT NULL,
    p_waypoints_json TEXT DEFAULT NULL,
    p_total_distance_meters INTEGER DEFAULT NULL,
    p_estimated_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_event_id UUID;
    v_new_route_id UUID;
    v_invitation_code VARCHAR(20);
BEGIN
    -- 8 Karakterli Rastgele Oluşturulmuş Davet Kodu
    v_invitation_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Route'u Oluştur
    INSERT INTO routes (distance)
    VALUES (COALESCE(p_total_distance_meters, 0))
    RETURNING route_id INTO v_new_route_id;
    
    -- Event Insert edilir
    INSERT INTO events (
        creator_id,
        route_id,
        title,
        description,
        start_date,
        invitation_code,
        route_polyline,
        waypoints_json,
        total_distance_meters,
        estimated_duration_seconds
    )
    VALUES (
        p_creator_id,
        v_new_route_id,
        p_title,
        p_description,
        p_start_date,
        v_invitation_code,
        p_route_polyline,
        p_waypoints_json,
        p_total_distance_meters,
        p_estimated_duration_seconds
    )
    RETURNING event_id INTO v_new_event_id;
    
    -- Oluşturan Kullanıcıyı Katılımcı Olarak Ekle
    INSERT INTO attendances (user_id, event_id, has_completed)
    VALUES (p_creator_id, v_new_event_id, FALSE);
    
    RETURN v_new_event_id;
END;
$$;
