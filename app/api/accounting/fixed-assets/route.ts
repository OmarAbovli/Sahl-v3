import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/database"

// GET: List all fixed assets for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const assets = await sql`
      SELECT * FROM fixed_assets WHERE company_id = ${user.company_id} ORDER BY id ASC
    `
    return NextResponse.json({ assets })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

// POST: Create a new fixed asset
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const data = await req.json()
    const { name, asset_code, purchase_date, cost, depreciation_method, useful_life, salvage_value, status } = data
    if (!name || !cost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const result = await sql`
      INSERT INTO fixed_assets (company_id, name, asset_code, purchase_date, cost, depreciation_method, useful_life, salvage_value, status, created_at, updated_at)
      VALUES (
        ${user.company_id}, ${name}, ${asset_code}, ${purchase_date}, ${cost}, ${depreciation_method}, ${useful_life}, ${salvage_value}, ${status || 'active'}, NOW(), NOW()
      ) RETURNING *
    `
    return NextResponse.json({ asset: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
} 