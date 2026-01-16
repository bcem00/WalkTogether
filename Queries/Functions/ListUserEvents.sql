CREATE OR REPLACE FUNCTION get_events_by_username(p_username text)
RETURNS TABLE (
    "EventId" uuid,
    "Title" text,
    "Description" text,
    "StartDate" timestamptz,
    "TotalDistanceMeters" integer,
    "InvitationCode" text,
    "CreatorUsername" text,
    "IsCreator" boolean,
    "RoutePolyline" text,
    "WaypointsJson" text
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT user_id INTO v_user_id FROM users WHERE username = LOWER(p_username);
    
    RETURN QUERY
    SELECT 
        e.event_id AS "EventId",
        e.title::text AS "Title",
        e.description::text AS "Description",
        e.start_date AS "StartDate",
        e.total_distance_meters AS "TotalDistanceMeters",
        e.invitation_code::text AS "InvitationCode",
        u.username::text AS "CreatorUsername",
        (e.creator_id = v_user_id) AS "IsCreator",
        e.route_polyline::text AS "RoutePolyline",
        e.waypoints_json::text AS "WaypointsJson"
    FROM events e
    JOIN users u ON u.user_id = e.creator_id
    JOIN attendances a ON a.event_id = e.event_id AND a.user_id = v_user_id AND a.has_completed = false;
END;
$$;