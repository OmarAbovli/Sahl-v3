import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/database"

// POST: Dispose or sell an asset
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
    const { disposal_date, disposal_type, sale_amount, notes } = data
    if (!disposal_date || !disposal_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const status = disposal_type === 'sale' ? 'sold' : 'disposed'
    const result = await sql`
      UPDATE fixed_assets
      SET status = ${status},
          disposal_date = ${disposal_date},
          disposal_type = ${disposal_type},
          sale_amount = ${sale_amount},
          notes = ${notes},
          updated_at = NOW()
      WHERE id = ${asset_id} AND company_id = ${user.company_id}
      RETURNING *
    `
    return NextResponse.json({ asset: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to dispose/sell asset" }, { status: 500 })
  }
} 