CREATE OR REPLACE FUNCTION create_destination(
    p_route_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_order_in_route INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_destination_id UUID;
BEGIN
    INSERT INTO destinations (destination_id, route_id, latitude, longitude, order_in_route)
    VALUES (gen_random_uuid(), p_route_id, p_latitude, p_longitude, p_order_in_route)
    RETURNING destination_id INTO v_destination_id;

    RETURN v_destination_id;
END;
$$;
