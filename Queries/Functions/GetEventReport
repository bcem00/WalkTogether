-- Adminler için Belirtilen Olayın Katılımcı Raporunu Getiren Fonksiyon 
CREATE OR REPLACE FUNCTION get_event_report(p_event_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    cur_attendees CURSOR FOR 
        SELECT u.username, a.has_completed
        FROM attendances a
        JOIN users u ON a.user_id = u.user_id
        WHERE a.event_id = p_event_id;
    rec_attendee RECORD;

    v_output TEXT := '';
BEGIN
    OPEN cur_attendees;
    LOOP
        FETCH cur_attendees INTO rec_attendee;
        EXIT WHEN NOT FOUND;
        v_output := v_output || rec_attendee.username || ': ' || 
                    CASE WHEN rec_attendee.has_completed THEN 'Tamamladı' ELSE 'Sürüyor' END || ' | ';
    END LOOP;
    CLOSE cur_attendees;
    IF v_output = '' THEN
        RETURN 'Henüz katılımcı yok.';
    ELSE
        RETURN v_output;
    END IF;
END;
$$;