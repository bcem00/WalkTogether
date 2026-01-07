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
    "CreatorUsername" text,       -- <--- THIS IS THE MISSING COLUMN
    "IsCreator" boolean,
    "RoutePolyline" text,
    "WaypointsJson" text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e."Id" AS "EventId",
        e."Title",
        e."Description",
        e."StartDate",
        e."TotalDistanceMeters",
        e."InvitationCode",
        u."UserName" AS "CreatorUsername", -- <--- Selecting and Aliasing the username
        (u."UserName" = p_username) AS "IsCreator", -- specific logic: true if the param matches the creator
        e."RoutePolyline",
        e."WaypointsJson"
    FROM events e
    JOIN users u ON e.creator_id = u.user_id
    WHERE u.username = p_username;
END;
$$;