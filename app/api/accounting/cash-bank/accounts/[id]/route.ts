import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { cashBankAccounts } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// PUT: Update a cash/bank account
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

        // Remap snake_case to camelCase if needed, or just pass data if it's already aligned
        // For cashBankAccounts, the fields are: name, accountNumber, bankName, type
        const [account] = await db.update(cashBankAccounts)
            .set({
                name: data.name,
                accountNumber: data.account_number,
                bankName: data.bank_name,
                type: data.type,
                isActive: data.is_active,
            })
            .where(and(
                eq(cashBankAccounts.id, id),
                eq(cashBankAccounts.companyId, companyId)
            ))
            .returning()

        if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

        return NextResponse.json({ account })
    } catch (error) {
        console.error("Update account error:", error)
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }
}

// DELETE: Delete a cash/bank account
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession()
    if (!user || (!user.companyId && !user.company_id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const id = Number(params.id)
        await db.delete(cashBankAccounts)
            .where(and(
                eq(cashBankAccounts.id, id),
                eq(cashBankAccounts.companyId, companyId)
            ))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete account error:", error)
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }
}
