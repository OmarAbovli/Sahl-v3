"use server"

import { db } from "@/db"
import { companies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getCompanySettings(companyId: number) {
    try {
        const company = await db.query.companies.findFirst({
            where: eq(companies.id, companyId)
        })
        if (!company) {
            return { success: false, error: "Company not found" }
        }
        return { success: true, data: company }
    } catch (error) {
        return { success: false, error: "Failed to fetch settings" }
    }
}

export async function updateCompanySettings(companyId: number, data: any) {
    try {
        await db.update(companies).set({
            displayName: data.displayName,
            address: data.address,
            phone: data.phone,
            email: data.email,
            website: data.website,
            logoUrl: data.logoUrl,
            currency: data.currency,
            taxId: data.taxId,
            updatedAt: new Date().toISOString()
        }).where(eq(companies.id, companyId))

        revalidatePath("/company-admin/settings")
        revalidatePath("/employee")
        return { success: true }
    } catch (error) {
        console.error("Update Company Error:", error)
        return { success: false, error: "Failed to update settings" }
    }
}
