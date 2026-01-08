CREATE OR REPLACE FUNCTION check_badge_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.motivation_point >= 1000 AND OLD.has_badge = FALSE THEN
        NEW.has_badge := TRUE;
    END IF;
    RETURN NEW;
END;
$$;

-- Motivation Puanı Güncellendiğinde Rozet Kontrolü Yapan Trigger
CREATE TRIGGER trg_award_badge
BEFORE UPDATE ON users
FOR EACH ROW
WHEN (OLD.motivation_point < 1000 AND NEW.motivation_point >= 1000) -- Sadece baraj geçildiğinde çalışsın
EXECUTE FUNCTION check_badge_eligibility();