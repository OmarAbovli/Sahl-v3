import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  if (!id) {
    return NextResponse.json({ error: "Invalid device ID" }, { status: 400 })
  }
  try {
    const result = await sql`
      DELETE FROM biometric_devices WHERE id = ${Number(id)} RETURNING *
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
