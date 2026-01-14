CREATE EXTENSION IF NOT EXISTS pg_cron;


SELECT cron.unschedule('delete-past-events') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'delete-past-events'
);


SELECT cron.schedule(
    'delete-past-events',           
    '0 * * * *',                     
    'DELETE FROM events WHERE start_date < CURRENT_TIMESTAMP'  
);

