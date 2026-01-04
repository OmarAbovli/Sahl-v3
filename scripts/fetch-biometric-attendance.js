// scripts/fetch-biometric-attendance.js

const ZKLib = require('node-zklib');
const { sql } = require('../lib/database'); // Adjust path if needed

// CONFIGURE THESE:
const DEVICE_IP = '192.168.1.201'; // Replace with your device's IP
const DEVICE_PORT = 4370; // Default ZKTeco port
const COMPANY_ID = 1; // Set the company_id for which to fetch logs

// Optionally, map device user IDs to employee IDs in your DB
async function mapDeviceUserIdToEmployeeId(deviceUserId, companyId) {
  // Example: assumes you have a column 'biometric_user_id' in 'employees'
  const result = await sql`
    SELECT id FROM employees
    WHERE biometric_user_id = ${deviceUserId} AND company_id = ${companyId}
    LIMIT 1
  `;
  return result[0]?.id || null;
}

async function main() {
  const zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);

  try {
    // Connect to device
    await zkInstance.createSocket();

    // Fetch attendance logs
    const logs = await zkInstance.getAttendances();
    console.log(`Fetched ${logs.data.length} attendance logs from device.`);

    for (const log of logs.data) {
      const {
        uid, // Device user ID
        id,  // Attendance log ID (not always unique)
        state, // 0: check-in, 1: check-out, etc.
        timestamp // JS Date object
      } = log;

      // Map device user ID to employee ID in your DB
      const employeeId = await mapDeviceUserIdToEmployeeId(uid, COMPANY_ID);

      // Insert into biometric_attendance table
      await sql`
        INSERT INTO biometric_attendance (
          company_id,
          employee_id,
          device_user_id,
          attendance_time,
          attendance_type,
          raw_log_id
        ) VALUES (
          ${COMPANY_ID},
          ${employeeId},
          ${uid},
          ${timestamp.toISOString()},
          ${state},
          ${id}
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log('Attendance logs inserted into database.');
    await zkInstance.disconnect();
  } catch (err) {
    console.error('Error fetching/inserting attendance logs:', err);
  }
}

main();
