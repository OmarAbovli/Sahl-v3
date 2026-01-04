-- Insert a test device for development/demo purposes
INSERT INTO biometric_devices (
  company_id, device_name, device_type, ip_address, port, model, serial_number, protocol, username, password, location
) VALUES (
  1, -- Change to your test company_id if needed
  'Test Device',
  'zkteco',
  '192.168.1.250',
  4370,
  'K40',
  'TEST123456',
  'TCP',
  'admin',
  'admin',
  'Test Lab'
);

INSERT INTO biometric_devices (
  company_id, device_name, device_type, ip_address, port, model, serial_number, protocol, username, password, location
) VALUES (
  3, -- Change to your test company_id if needed
  'Test Device',
  'zkteco',
  '192.168.1.250',
  4370,
  'K40',
  'TEST123456',
  'TCP',
  'admin',
  'admin',
  'Test Lab'
);

-- Optionally, insert a test attendance log for this device
INSERT INTO biometric_attendance (
  company_id, employee_id, device_user_id, attendance_time, attendance_type, raw_log_id
) VALUES (
  1, -- company_id
  NULL, -- employee_id (null for test)
  99, -- device_user_id
  NOW(),
  0, -- attendance_type (0 = check-in)
  123456 -- raw_log_id
);
