import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { db } from "@/db"
import { biometricAttendance, employees } from "@/db/schema"
import { eq, and, desc, inArray, sql as drizzleSql } from "drizzle-orm"
import { getSession } from "@/lib/session"

// GET /api/company-admin/attendance-logs?company_id=1&device_id=2&limit=100
export async function GET(req: NextRequest) {
  const session = await getSession()
  const url = req.nextUrl || new URL(req.url)
  const companyIdParam = url.searchParams.get("company_id")
  const deviceIdParam = url.searchParams.get("device_id")
  const limitParam = url.searchParams.get("limit")

  const companyId = companyIdParam ? Number(companyIdParam) : (session?.companyId || session?.company_id)
  const deviceId = deviceIdParam ? Number(deviceIdParam) : null
  const limit = limitParam ? Number(limitParam) : 100

  if (!companyId) {
    return NextResponse.json({ error: "Missing or invalid company_id" }, { status: 400 })
  }

  try {
    let baseQuery = db.select({
      id: biometricAttendance.id,
      employeeId: biometricAttendance.employeeId,
      attendanceTime: biometricAttendance.attendanceTime,
      attendanceType: biometricAttendance.attendanceType,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeNumber: employees.employeeNumber
    })
      .from(biometricAttendance)
      .leftJoin(employees, eq(biometricAttendance.employeeId, employees.id))
      .where(eq(biometricAttendance.companyId, Number(companyId)))

    if (deviceId) {
      // Original logic: ${deviceId ? sql`AND ba.device_user_id IN (SELECT device_user_id FROM biometric_attendance WHERE id IN (SELECT id FROM biometric_attendance WHERE company_id = ${companyId} AND device_user_id = ${deviceId}))` : sql``}
      // This seems to find all logs for users who have at some point used that device.
      // I'll implement a simpler version or replicate it if needed.
      baseQuery = baseQuery.where(and(
        eq(biometricAttendance.companyId, Number(companyId)),
        eq(biometricAttendance.deviceUserId, deviceId.toString()) // Assuming device_user_id is the parameter
      )) as any
    }

    const logs = await baseQuery
      .orderBy(desc(biometricAttendance.attendanceTime))
      .limit(limit)

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error("Fetch attendance logs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
