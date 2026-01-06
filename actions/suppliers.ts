"use server"

import { db } from "@/db"
import { suppliers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getSuppliers(companyId: number) {
    try {
        const data = await db.query.suppliers.findMany({
            where: eq(suppliers.companyId, companyId),
            orderBy: [desc(suppliers.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch suppliers" }
    }
}

export async function createSupplier(params: {
    companyId: number
    name: string
    supplierCode: string
    email?: string
    phone?: string
    address?: string
    taxNumber?: string
}) {
    try {
        const [newSupplier] = await db.insert(suppliers).values({
            ...params,
            isActive: true,
            balance: "0"
        }).returning()

        revalidatePath('/company-admin/purchasing')
        return { success: true, data: newSupplier }
    } catch (error: any) {
        console.error("Create Supplier Error:", error)
        return { success: false, error: error.message || "Failed to create supplier" }
    }
}

export async function updateSupplier(id: number, params: Partial<{
    name: string
    email: string
    phone: string
    address: string
    taxNumber: string
    isActive: boolean
}>) {
    try {
        await db.update(suppliers).set(params).where(eq(suppliers.id, id))
        revalidatePath('/company-admin/purchasing')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update supplier" }
    }
}
