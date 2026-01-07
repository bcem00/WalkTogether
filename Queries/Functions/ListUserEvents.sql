-- 1. First, we need to drop the old function to update the return signature
DROP FUNCTION IF EXISTS get_events_by_username(text);

-- 2. Re-create the function with the missing "CreatorUsername" column
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
    JOIN users u ON e.creator_id = u.user_id
    WHERE u.username = p_username;
END;
$$;