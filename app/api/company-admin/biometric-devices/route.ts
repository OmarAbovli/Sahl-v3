import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { db } from "@/db"
import { biometricDevices } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getSession } from "@/lib/session"

// Helper to extract companyId
async function getEffectiveCompanyId(req: NextRequest): Promise<number | null> {
  const session = await getSession()
  if (session?.companyId || session?.company_id) return (session.companyId || session.company_id) as number

  const url = req.nextUrl || new URL(req.url)
  const companyIdParam = url.searchParams.get("company_id")
  if (!companyIdParam) return null
  const companyId = Number(companyIdParam)
  return isNaN(companyId) ? null : companyId
}

export async function GET(req: NextRequest) {
  const companyId = await getEffectiveCompanyId(req)
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await db.select()
      .from(biometricDevices)
      .where(eq(biometricDevices.companyId, companyId))
      .orderBy(desc(biometricDevices.createdAt))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Fetch biometric devices error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const companyId = await getEffectiveCompanyId(req)
  if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

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

    if (!device_name || !device_type || !ip_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let portNumber = Number(port)
    if (isNaN(portNumber)) {
      return NextResponse.json({ error: "Port must be a number" }, { status: 400 })
    }

    const [device] = await db.insert(biometricDevices).values({
      companyId,
      deviceName: device_name,
      deviceType: device_type,
      ipAddress: ip_address,
      port: portNumber,
      model: model ?? null,
      serialNumber: serial_number ?? null,
      protocol: protocol ?? null,
      username: username ?? null,
      password: password ?? null,
      location: location ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json(device, { status: 201 })
  } catch (error: any) {
    console.error("POST /biometric-devices error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
