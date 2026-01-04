import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

// Helper to extract companyId from query string (for API routes)
function getClientCompanyId(req: NextRequest): number | null {
  const url = req.nextUrl || new URL(req.url)
  const companyIdParam = url.searchParams.get("company_id")
  if (!companyIdParam) return null
  const companyId = Number(companyIdParam)
  return isNaN(companyId) ? null : companyId
}

export async function GET(req: NextRequest) {
  const companyId = await getClientCompanyId(req)

  try {
    const result = await sql`
      SELECT * FROM biometric_devices
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
    `
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const companyId = await getClientCompanyId(req)
  const body = await req.json()

  // Debug: log the incoming payload and companyId
  console.log("Incoming POST /biometric-devices payload:", { companyId, ...body })

  try {
    const {
      device_name,
      device_type,
      ip_address,
      port,
      model,
      serial_number,
      protocol,
      username,
      password,
      location,
    } = body

    // Extra validation for required fields and types
    if (!companyId || !device_name || !device_type || !ip_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    let portNumber = Number(port)
    if (isNaN(portNumber)) {
      return NextResponse.json({ error: "Port must be a number" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO biometric_devices (
        company_id, device_name, device_type,
        ip_address, port, model, serial_number,
        protocol, username, password, location
      ) VALUES (
        ${companyId},
        ${device_name},
        ${device_type},
        ${ip_address},
        ${portNumber},
        ${model ?? null},
        ${serial_number ?? null},
        ${protocol ?? null},
        ${username ?? null},
        ${password ?? null},
        ${location ?? null}
      ) RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    // Log the error and payload for debugging
    console.error("POST /biometric-devices error:", error, { companyId, ...body })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
