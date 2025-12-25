CREATE OR REPLACE FUNCTION fn_log_all_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_record_id UUID;
BEGIN
    -- C# tarafından gönderilen mevcut kullanıcı ID'sini session'dan almaya çalışır
    BEGIN
        v_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL; -- Eğer session'da user_id yoksa null bırakır
    END;

    -- İşlem tipine göre loglama yap
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO system_logs (user_id, action_type, table_name, record_id, new_data, severity)
        VALUES (v_user_id, 'INSERT', TG_TABLE_NAME, NULL, to_jsonb(NEW), 'INFO');
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO system_logs (user_id, action_type, table_name, record_id, old_data, new_data, severity)
        VALUES (v_user_id, 'UPDATE', TG_TABLE_NAME, NULL, to_jsonb(OLD), to_jsonb(NEW), 'INFO');
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO system_logs (user_id, action_type, table_name, record_id, old_data, severity)
        VALUES (v_user_id, 'DELETE', TG_TABLE_NAME, NULL, to_jsonb(OLD), 'WARN');
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 1. Users Tablosu için
CREATE TRIGGER trg_log_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

-- 2. Events Tablosu için
CREATE TRIGGER trg_log_events
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

-- 3. Routes Tablosu için
CREATE TRIGGER trg_log_routes
AFTER INSERT OR UPDATE OR DELETE ON routes
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

-- 4. Destinations Tablosu için
CREATE TRIGGER trg_log_destinations
AFTER INSERT OR UPDATE OR DELETE ON destinations
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

-- 5. Attendances Tablosu için
CREATE TRIGGER trg_log_attendances
AFTER INSERT OR UPDATE OR DELETE ON attendances
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

-- 6. Roles Tablosu için (Genelde nadir değişir ama loglamak iyidir)
CREATE TRIGGER trg_log_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION fn_log_all_changes();

