import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

// GET /api/company-admin/attendance-logs?company_id=1&device_id=2&limit=100
export async function GET(req: NextRequest) {
  const url = req.nextUrl || new URL(req.url)
  const companyIdParam = url.searchParams.get("company_id")
  const deviceIdParam = url.searchParams.get("device_id")
  const limitParam = url.searchParams.get("limit")
  const companyId = Number(companyIdParam)
  const deviceId = deviceIdParam ? Number(deviceIdParam) : null
  const limit = limitParam ? Number(limitParam) : 100
  if (!companyId) {
    return NextResponse.json({ error: "Missing or invalid company_id" }, { status: 400 })
  }
  try {
    const logs = await sql`
      SELECT ba.*, e.first_name, e.last_name, e.employee_number
      FROM biometric_attendance ba
      LEFT JOIN employees e ON ba.employee_id = e.id
      WHERE ba.company_id = ${companyId}
      ${deviceId ? sql`AND ba.device_user_id IN (SELECT device_user_id FROM biometric_attendance WHERE id IN (SELECT id FROM biometric_attendance WHERE company_id = ${companyId} AND device_user_id = ${deviceId}))` : sql``}
      ORDER BY ba.attendance_time DESC
      LIMIT ${limit}
    `
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
