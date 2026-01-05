-- 1. UUID fonksiyonlarını kullanabilmek için eklenti (Gerekirse)
-- PostgreSQL 13+ kullanıyorsan gen_random_uuid() zaten vardır, gerek yok.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 

-- TEMİZLİK
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 2. ROLES (UUID to match User model)
CREATE TABLE roles (
    role_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE
);
INSERT INTO roles (role_id, role_name) VALUES 
    (gen_random_uuid(), 'user'), 
    (gen_random_uuid(), 'admin');

-- 3. USERS (UUID'ye geçildi)
CREATE TABLE users (
    user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Otomatik UUID üretir
    role_id UUID NOT NULL REFERENCES roles(role_id),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    motivation_point INTEGER DEFAULT 0,
    has_badge BOOLEAN DEFAULT FALSE
);

-- 4. ROUTES (UUID'ye geçildi)
CREATE TABLE routes (
    route_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    distance INTEGER DEFAULT 0
);

-- 5. EVENTS (UUID'ye geçildi)
CREATE TABLE events (
    event_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(route_id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    invitation_code VARCHAR(20) UNIQUE,
    start_date TIMESTAMPTZ NOT NULL,
    creation_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    route_polyline TEXT,
    waypoints_json TEXT,
    total_distance_meters INTEGER,
    estimated_duration_seconds INTEGER
);

-- 6. DESTINATIONS
CREATE TABLE destinations (
    destination_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    order_in_route INTEGER NOT NULL
);

-- 7. ATTENDANCES
CREATE TABLE attendances (
    attendance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    has_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, event_id)
);

-- İNDEKSLER (Değişmedi, sadece tipler artık UUID)
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_events_creator_id ON events(creator_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_destinations_route_order ON destinations(route_id, order_in_route);
CREATE INDEX idx_attendances_user_event ON attendances(user_id, event_id);