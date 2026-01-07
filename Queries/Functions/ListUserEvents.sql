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
BEGIN
    RETURN QUERY
    WITH cu AS (
        SELECT user_id FROM users WHERE username = p_username
    )
    SELECT 
        e.event_id AS "EventId",
        e.title::text AS "Title",
        e.description::text AS "Description",
        e.start_date AS "StartDate",
        e.total_distance_meters AS "TotalDistanceMeters",
        e.invitation_code::text AS "InvitationCode",
        u.username::text AS "CreatorUsername",
        (u.username = p_username) AS "IsCreator",
        e.route_polyline::text AS "RoutePolyline",
        e.waypoints_json::text AS "WaypointsJson"
    FROM events e
    JOIN users u ON u.user_id = e.creator_id
    JOIN cu ON TRUE
    WHERE e.creator_id = cu.user_id
       OR EXISTS (
            SELECT 1
             FROM attendances a
            WHERE a.event_id = e.event_id
              AND a.user_id = cu.user_id
       );
END;
$$;