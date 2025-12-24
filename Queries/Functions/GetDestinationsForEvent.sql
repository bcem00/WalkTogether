CREATE OR REPLACE FUNCTION get_all_destinations_for_event(p_event_id UUID)
RETURNS TABLE (
    destination_id UUID,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    order_in_route INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.destination_id,
        d.latitude,
        d.longitude,
        d.order_in_route
    FROM events e
    JOIN routes r ON e.route_id = r.route_id
    JOIN destinations d ON r.route_id = d.route_id
    WHERE e.event_id = p_event_id
    ORDER BY d.order_in_route ASC;
END;
$$;