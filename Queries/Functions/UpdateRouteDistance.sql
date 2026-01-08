CREATE OR REPLACE FUNCTION update_route_distance(p_route_id UUID, p_distance INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE routes
    SET distance = p_distance
    WHERE route_id = p_route_id;
END;
$$;
