-- SYSTEM_LOGS 
CREATE TABLE IF NOT EXISTS system_logs (
    log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action_type VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    severity VARCHAR(10) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying logs by user
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- Index for querying logs by table
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name);

-- Index for querying logs by timestamp
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
