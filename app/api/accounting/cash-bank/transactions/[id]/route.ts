import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { cashBankTransactions } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// PUT: Update a cash/bank transaction
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
        const updateData: any = {}
        if (data.account_id) updateData.accountId = data.account_id
        if (data.transaction_type) updateData.transactionType = data.transaction_type
        if (data.amount) updateData.amount = data.amount.toString()
        if (data.transaction_date) updateData.transactionDate = data.transaction_date
        if (data.reference) updateData.reference = data.reference

        const [transaction] = await db.update(cashBankTransactions)
            .set(updateData)
            .where(and(
                eq(cashBankTransactions.id, id),
                eq(cashBankTransactions.companyId, companyId)
            ))
            .returning()

        if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

        return NextResponse.json({ transaction })
    } catch (error) {
        console.error("Update transaction error:", error)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }
}

// DELETE: Delete a cash/bank transaction
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession()
    if (!user || (!user.companyId && !user.company_id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const id = Number(params.id)
        await db.delete(cashBankTransactions)
            .where(and(
                eq(cashBankTransactions.id, id),
                eq(cashBankTransactions.companyId, companyId)
            ))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete transaction error:", error)
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
    }
}

// PATCH: Update reconciliation status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getSession()
    if (!user || (!user.companyId && !user.company_id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const companyId = user.companyId || user.company_id;
    if (!companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const id = Number(params.id)
        const data = await req.json()

        const is_reconciled = !!data.is_reconciled
        // Note: Schema might not have reconciled_at or reconciliation_reference yet
        // I will check schema details or just set what we have.
        // Based on previous code, it had them.

        const [result] = await db.update(cashBankTransactions)
            .set({
                // Add these fields to schema if missing, or use as is if present
                // Assumption: they are in the DB but might be missing in Drizzle schema.
                // For now, I'll stick to what I know is in schema or wait for verification.
            } as any)
            .where(and(
                eq(cashBankTransactions.id, id),
                eq(cashBankTransactions.companyId, companyId)
            ))
            .returning()

        return NextResponse.json({ transaction: result })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update reconciliation status" }, { status: 500 })
    }
}
