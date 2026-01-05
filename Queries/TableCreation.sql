-- 1. Önce eski tablolar varsa temizleyelim (Hata almamak için)
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS destinations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. USERS Tablosu
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE, 
    username VARCHAR(50) NOT NULL UNIQUE,
    motivation_point INTEGER DEFAULT 0, -- Varsayılan 0 puan
    has_badge BOOLEAN DEFAULT FALSE     -- Varsayılan rozet yok
);

-- 3. ROUTES Tablosu (Events ve Destinations buna bağlanacağı için önce bu gerekli)
CREATE TABLE routes (
    route_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    distance INTEGER DEFAULT 0 -- Metre cinsinden mesafe
);

-- 4. EVENTS Tablosu
CREATE TABLE events (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    invitation_code VARCHAR(20) UNIQUE, -- Davet kodları benzersiz olmalı
    start_date TIMESTAMPTZ NOT NULL,
    creation_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. DESTINATIONS Tablosu
CREATE TABLE destinations (
    destination_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    route_id BIGINT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    order_in_route INTEGER NOT NULL
);

-- 6. ATTENDANCES Tablosu
CREATE TABLE attendances (
    attendance_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    has_completed BOOLEAN DEFAULT FALSE,
    
    -- Bir kullanıcı aynı etkinliğe iki kere katılamasın diye ek koruma:
    UNIQUE(user_id, event_id)
);


-- 7. SYSTEM_LOGS Tablosus
CREATE TABLE system_logs (
    log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- İşlemi yapan kim?
    action_type VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN_ATTEMPT'
    table_name VARCHAR(50), -- Hangi tablo etkilendi?
    record_id UUID, -- Etkilenen satırın ID'si
    old_data JSONB, -- Değişimden önceki veri
    new_data JSONB, -- Değişimden sonraki veri
    ip_address VARCHAR(45), -- İşlemin yapıldığı IP
    severity VARCHAR(10) DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Hızlı arama için indeksler
CREATE INDEX idx_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_logs_created_at ON system_logs(created_at);