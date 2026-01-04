import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/database"

// PUT: Update a fixed asset
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    const data = await req.json()
    const result = await sql`
      UPDATE fixed_assets
      SET ${sql(data)}, updated_at = NOW()
      WHERE id = ${id} AND company_id = ${user.company_id}
      RETURNING *
    `
    if (result.length === 0) {
      return NextResponse.json({ error: "Asset not found or not authorized" }, { status: 404 })
    }
    return NextResponse.json({ asset: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

// DELETE: Delete a fixed asset
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const id = Number(params.id)
    await sql`
      DELETE FROM fixed_assets WHERE id = ${id} AND company_id = ${user.company_id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
} 