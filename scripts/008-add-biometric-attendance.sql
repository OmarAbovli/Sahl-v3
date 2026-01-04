-- Biometric attendance logs for employee check-in/out
CREATE TABLE IF NOT EXISTS biometric_attendance (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES biometric_devices(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- 'check_in', 'check_out'
    raw_data JSONB, -- optional: store raw device data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
