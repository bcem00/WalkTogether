-- ================================================================
-- SEED DATA - Sample records for all tables
-- Run this after TablesInit.sql
-- ================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
DELETE FROM attendances;
DELETE FROM destinations;
DELETE FROM events;
DELETE FROM routes;
DELETE FROM users;
-- Note: roles are kept as they were inserted in TablesInit.sql

-- ================================================================
-- 1. USERS (10 records)
-- Get the role_id for 'walktogether_user' role
-- ================================================================
DO $$
DECLARE
    v_user_role_id UUID;
    v_admin_role_id UUID;
BEGIN
    SELECT role_id INTO v_user_role_id FROM roles WHERE role_name = 'walktogether_user';
    SELECT role_id INTO v_admin_role_id FROM roles WHERE role_name = 'admin';

    -- Insert 10 users
    INSERT INTO users (user_id, role_id, first_name, last_name, password_hash, email, username, motivation_point, has_badge) VALUES
    ('11111111-1111-1111-1111-111111111111', v_user_role_id, 'Ahmet', 'Yılmaz', '$2a$11$hashedpassword1234567890abcdef', 'ahmet@example.com', 'ahmetyilmaz', 150, FALSE),
    ('22222222-2222-2222-2222-222222222222', v_user_role_id, 'Ayşe', 'Kaya', '$2a$11$hashedpassword1234567890abcdef', 'ayse@example.com', 'aysekaya', 320, FALSE),
    ('33333333-3333-3333-3333-333333333333', v_user_role_id, 'Mehmet', 'Demir', '$2a$11$hashedpassword1234567890abcdef', 'mehmet@example.com', 'mehmetdemir', 890, FALSE),
    ('44444444-4444-4444-4444-444444444444', v_user_role_id, 'Fatma', 'Çelik', '$2a$11$hashedpassword1234567890abcdef', 'fatma@example.com', 'fatmacelik', 1050, TRUE),
    ('55555555-5555-5555-5555-555555555555', v_user_role_id, 'Ali', 'Öztürk', '$2a$11$hashedpassword1234567890abcdef', 'ali@example.com', 'aliozturk', 45, FALSE),
    ('66666666-6666-6666-6666-666666666666', v_user_role_id, 'Zeynep', 'Arslan', '$2a$11$hashedpassword1234567890abcdef', 'zeynep@example.com', 'zeyneparslan', 720, FALSE),
    ('77777777-7777-7777-7777-777777777777', v_user_role_id, 'Mustafa', 'Koç', '$2a$11$hashedpassword1234567890abcdef', 'mustafa@example.com', 'mustafakoc', 1200, TRUE),
    ('88888888-8888-8888-8888-888888888888', v_user_role_id, 'Elif', 'Şahin', '$2a$11$hashedpassword1234567890abcdef', 'elif@example.com', 'elifsahin', 560, FALSE),
    ('99999999-9999-9999-9999-999999999999', v_admin_role_id, 'Admin', 'User', '$2a$11$hashedpassword1234567890abcdef', 'admin@walktogether.com', 'admin', 0, FALSE),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_user_role_id, 'Emre', 'Güneş', '$2a$11$hashedpassword1234567890abcdef', 'emre@example.com', 'emregunes', 980, FALSE);
END $$;

-- ================================================================
-- 2. ROUTES (10 records)
-- ================================================================
INSERT INTO routes (route_id, distance) VALUES
('b1111111-1111-1111-1111-111111111111', 2500),
('b2222222-2222-2222-2222-222222222222', 5000),
('b3333333-3333-3333-3333-333333333333', 3200),
('b4444444-4444-4444-4444-444444444444', 7500),
('b5555555-5555-5555-5555-555555555555', 1800),
('b6666666-6666-6666-6666-666666666666', 4200),
('b7777777-7777-7777-7777-777777777777', 6100),
('b8888888-8888-8888-8888-888888888888', 8000),
('b9999999-9999-9999-9999-999999999999', 2100),
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3800);

-- ================================================================
-- 3. EVENTS (10 records)
-- ================================================================
INSERT INTO events (event_id, creator_id, route_id, title, description, invitation_code, start_date, route_polyline, waypoints_json, total_distance_meters, estimated_duration_seconds) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Sabah Yürüyüşü', 'Güne enerjik başlamak için sabah yürüyüşü', 'SABAH001', NOW() + INTERVAL '1 day', NULL, NULL, 2500, 1800),
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Park Turu', 'Hafta sonu parkta keyifli bir yürüyüş', 'PARK0002', NOW() + INTERVAL '3 days', NULL, NULL, 5000, 3600),
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Sahil Yürüyüşü', 'Deniz kenarında nefis bir yürüyüş', 'SAHIL003', NOW() + INTERVAL '5 days', NULL, NULL, 3200, 2400),
('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Dağ Yürüyüşü', 'Zorlu ama eğlenceli dağ parkuru', 'DAGI0004', NOW() + INTERVAL '7 days', NULL, NULL, 7500, 5400),
('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Akşam Yürüyüşü', 'Gün batımında rahatlatıcı yürüyüş', 'AKSAM005', NOW() + INTERVAL '2 days', NULL, NULL, 1800, 1200),
('e6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Şehir Turu', 'Tarihi mekanları keşfet', 'SEHIR006', NOW() + INTERVAL '4 days', NULL, NULL, 4200, 3000),
('e7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 'Orman Yürüyüşü', 'Doğayla iç içe bir deneyim', 'ORMAN007', NOW() + INTERVAL '6 days', NULL, NULL, 6100, 4500),
('e8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 'Maraton Hazırlık', 'Maraton için antrenman yürüyüşü', 'MARAT008', NOW() + INTERVAL '8 days', NULL, NULL, 8000, 6000),
('e9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'b9999999-9999-9999-9999-999999999999', 'Öğle Molası Yürüyüşü', 'İş arasında kısa yürüyüş', 'OGLE0009', NOW() + INTERVAL '1 day', NULL, NULL, 2100, 1500),
('eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hafta Sonu Gezisi', 'Arkadaşlarla keyifli yürüyüş', 'HAFTA010', NOW() + INTERVAL '10 days', NULL, NULL, 3800, 2700);

-- ================================================================
-- 4. DESTINATIONS (12 records - multiple per some routes)
-- ================================================================
INSERT INTO destinations (destination_id, route_id, latitude, longitude, order_in_route) VALUES
-- Route 1 destinations
('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 41.0082, 28.9784, 1),
('d1111111-1111-1111-1111-111111111112', 'b1111111-1111-1111-1111-111111111111', 41.0092, 28.9794, 2),
-- Route 2 destinations
('d2222222-2222-2222-2222-222222222221', 'b2222222-2222-2222-2222-222222222222', 41.0422, 29.0083, 1),
('d2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 41.0432, 29.0093, 2),
-- Route 3 destinations
('d3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 40.9876, 29.0234, 1),
-- Route 4 destinations
('d4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 40.7654, 29.9123, 1),
-- Route 5 destinations
('d5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 41.1234, 28.8765, 1),
-- Route 6 destinations
('d6666666-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 41.0355, 28.9850, 1),
-- Route 7 destinations
('d7777777-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 41.1567, 29.0567, 1),
-- Route 8 destinations
('d8888888-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 40.8901, 29.1234, 1),
-- Route 9 destinations
('d9999999-9999-9999-9999-999999999999', 'b9999999-9999-9999-9999-999999999999', 41.0789, 28.9456, 1),
-- Route 10 destinations
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 41.0234, 29.0012, 1);

-- ================================================================
-- 5. ATTENDANCES (15 records - users joining various events)
-- ================================================================
INSERT INTO attendances (attendance_id, user_id, event_id, has_completed) VALUES
-- Event 1 attendees (creator + others)
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', FALSE),
('a1111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', FALSE),
('a1111111-1111-1111-1111-111111111113', '33333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', FALSE),
-- Event 2 attendees
('a2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', FALSE),
('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', FALSE),
-- Event 3 attendees
('a3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', FALSE),
('a3333333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555555', 'e3333333-3333-3333-3333-333333333333', FALSE),
('a3333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'e3333333-3333-3333-3333-333333333333', FALSE),
-- Event 4 attendees
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444', FALSE),
('a4444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777777', 'e4444444-4444-4444-4444-444444444444', FALSE),
-- Event 5 attendees
('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'e5555555-5555-5555-5555-555555555555', FALSE),
-- Event 6 attendees
('a6666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'e6666666-6666-6666-6666-666666666666', FALSE),
('a6666666-6666-6666-6666-666666666667', '88888888-8888-8888-8888-888888888888', 'e6666666-6666-6666-6666-666666666666', FALSE),
-- Event 7 attendees
('a7777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'e7777777-7777-7777-7777-777777777777', FALSE),
-- Event 8 attendees
('a8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'e8888888-8888-8888-8888-888888888888', FALSE);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
SELECT 'Users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'Routes', COUNT(*) FROM routes
UNION ALL
SELECT 'Events', COUNT(*) FROM events
UNION ALL
SELECT 'Destinations', COUNT(*) FROM destinations
UNION ALL
SELECT 'Attendances', COUNT(*) FROM attendances
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles;
