import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/database"

// GET: List depreciation records for an asset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const asset_id = Number(params.id)
    // Ensure asset belongs to company
    const asset = await sql`SELECT * FROM fixed_assets WHERE id = ${asset_id} AND company_id = ${user.company_id}`
    if (asset.length === 0) {
      return NextResponse.json({ error: "Asset not found or not authorized" }, { status: 404 })
    }
    const records = await sql`SELECT * FROM asset_depreciation WHERE asset_id = ${asset_id} ORDER BY period_start ASC`
    return NextResponse.json({ records })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch depreciation records" }, { status: 500 })
  }
}

// POST: Add a depreciation record
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const asset_id = Number(params.id)
    // Ensure asset belongs to company
    const asset = await sql`SELECT * FROM fixed_assets WHERE id = ${asset_id} AND company_id = ${user.company_id}`
    if (asset.length === 0) {
      return NextResponse.json({ error: "Asset not found or not authorized" }, { status: 404 })
    }
    const data = await req.json()
    const { period_start, period_end, depreciation_amount } = data
    if (!period_start || !period_end || !depreciation_amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const result = await sql`
      INSERT INTO asset_depreciation (asset_id, period_start, period_end, depreciation_amount, created_at, updated_at)
      VALUES (${asset_id}, ${period_start}, ${period_end}, ${depreciation_amount}, NOW(), NOW())
      RETURNING *
    `
    return NextResponse.json({ record: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add depreciation record" }, { status: 500 })
  }
} 