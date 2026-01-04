import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { fixedAssets } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// PUT: Update a fixed asset
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession()
    if (!user || (!user.companyId && !user.company_id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const id = Number(params.id)
        const data = await req.json()

        // Remap snake_case to camelCase
        const updateData: any = {
            updatedAt: new Date().toISOString()
        }
        if (data.asset_code) updateData.assetCode = data.asset_code
        if (data.asset_name) updateData.assetName = data.asset_name
        if (data.category) updateData.category = data.category
        if (data.purchase_date) updateData.purchaseDate = data.purchase_date
        if (data.purchase_cost) updateData.purchaseCost = data.purchase_cost.toString()

        const [result] = await db.update(fixedAssets)
            .set(updateData)
            .where(and(
                eq(fixedAssets.id, id),
                eq(fixedAssets.companyId, companyId)
            ))
            .returning()

        if (!result) return NextResponse.json({ error: "Asset not found" }, { status: 404 })

        return NextResponse.json({ asset: result })
    } catch (error) {
        console.error("Update asset error:", error)
        return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
    }
}

// DELETE: Delete a fixed asset
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession()
    if (!user || (!user.companyId && !user.company_id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const id = Number(params.id)
        await db.delete(fixedAssets)
            .where(and(
                eq(fixedAssets.id, id),
                eq(fixedAssets.companyId, companyId)
            ))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete asset error:", error)
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
    }
}
