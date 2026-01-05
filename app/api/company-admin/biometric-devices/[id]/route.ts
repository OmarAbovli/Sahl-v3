import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { db } from "@/db"
import { biometricDevices } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/lib/session"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  const companyId = session?.companyId || session?.company_id

  const { id } = params
  if (!id) {
    return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
  }

  try {
    const conditions = [eq(biometricDevices.id, Number(id))]
    if (companyId) {
      conditions.push(eq(biometricDevices.companyId, Number(companyId)))
    }

    const [device] = await db.delete(biometricDevices)
      .where(and(...conditions))
      .returning()

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete biometric device error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
