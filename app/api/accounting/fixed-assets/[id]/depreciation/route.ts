import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { assetDepreciation, fixedAssets } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"

// GET: List depreciation records for an asset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !user.company_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const asset_id = Number(params.id)
    const companyId = user.company_id || user.companyId
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Ensure asset belongs to company
    const [asset] = await db.select()
      .from(fixedAssets)
      .where(and(
        eq(fixedAssets.id, asset_id),
        eq(fixedAssets.companyId, companyId)
      ))
      .limit(1)

    if (!asset) {
      return NextResponse.json({ error: "Asset not found or not authorized" }, { status: 404 })
    }

    const records = await db.select()
      .from(assetDepreciation)
      .where(eq(assetDepreciation.assetId, asset_id))
      .orderBy(asc(assetDepreciation.periodStart))

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
    const companyId = user.company_id || user.companyId
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Ensure asset belongs to company
    const [asset] = await db.select()
      .from(fixedAssets)
      .where(and(
        eq(fixedAssets.id, asset_id),
        eq(fixedAssets.companyId, companyId)
      ))
      .limit(1)

    if (!asset) {
      return NextResponse.json({ error: "Asset not found or not authorized" }, { status: 404 })
    }

    const data = await req.json()
    const { period_start, period_end, depreciation_amount } = data
    if (!period_start || !period_end || !depreciation_amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [record] = await db.insert(assetDepreciation).values({
      assetId: asset_id,
      periodStart: period_start,
      periodEnd: period_end,
      depreciationAmount: depreciation_amount.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json({ record })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add depreciation record" }, { status: 500 })
  }
} 