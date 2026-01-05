import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { fixedAssets } from "@/db/schema"
import { eq, asc } from "drizzle-orm"

// GET: List all fixed assets for the user's company
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user || (!user.companyId && !user.company_id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const companyId = user.companyId || user.company_id;
  if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const assets = await db.select()
      .from(fixedAssets)
      .where(eq(fixedAssets.companyId, companyId))
      .orderBy(asc(fixedAssets.id))

    return NextResponse.json({ assets })
  } catch (error) {
    console.error("Fetch assets error:", error)
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
  }
}

// POST: Create a new fixed asset
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || (!user.companyId && !user.company_id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const companyId = user.companyId || user.company_id;
  if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await req.json()
    const { name, asset_code, purchase_date, cost, depreciation_method, useful_life, salvage_value, status } = data
    if (!name || !cost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [asset] = await db.insert(fixedAssets).values({
      companyId,
      assetName: name,
      assetCode: asset_code,
      purchaseDate: purchase_date,
      purchaseCost: cost.toString(),
      depreciationMethod: depreciation_method,
      usefulLife: Number(useful_life),
      salvageValue: salvage_value ? salvage_value.toString() : null,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json({ asset })
  } catch (error) {
    console.error("Create asset error:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}