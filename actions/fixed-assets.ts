"use server"

import { db } from "@/db"
import { fixedAssets, journalEntries, journalLines, accounts } from "@/db/schema"
import { eq, and, sql, lte, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logActivity } from "./audit"
import { auditLogs } from "@/db/schema"

/**
 * Fetch all fixed assets for a company
 */
export async function getFixedAssets(companyId: number) {
    try {
        const data = await db.query.fixedAssets.findMany({
            where: eq(fixedAssets.companyId, companyId),
            orderBy: [sql`${fixedAssets.assetCode} ASC`]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Fetch fixed assets error:", error)
        return { success: false, error: "Failed to fetch fixed assets" }
    }
}

/**
 * Create a new fixed asset
 */
export async function createFixedAsset(data: {
    companyId: number
    assetCode: string
    assetName: string
    category?: string
    purchaseDate: string
    purchaseCost: number
    usefulLifeYears: number
    depreciationMethod: "straight_line" | "declining_balance"
    residualValue?: number
    serialNumber?: string
    location?: string
    department?: string
    vendor?: string
    condition?: string
    insuranceDetails?: string
    userId?: number
}) {
    try {
        const residualValue = data.residualValue || 0
        const purchaseCost = data.purchaseCost

        // Calculate depreciation rate for declining balance (typically 200% or 150%)
        const depreciationRate = data.depreciationMethod === "declining_balance"
            ? (100 / data.usefulLifeYears) * 2 // 200% declining balance
            : 0

        const [newAsset] = await db.insert(fixedAssets).values({
            companyId: data.companyId,
            assetCode: data.assetCode,
            assetName: data.assetName,
            category: data.category || null,
            purchaseDate: data.purchaseDate,
            purchaseCost: purchaseCost.toString(),
            usefulLifeYears: data.usefulLifeYears,
            depreciationMethod: data.depreciationMethod,
            residualValue: residualValue.toString(),
            depreciationRate: depreciationRate.toString(),
            bookValue: purchaseCost.toString(), // Initial book value = purchase cost
            accumulatedDepreciation: "0",
            lastDepreciationDate: null,
            serialNumber: data.serialNumber || null,
            location: data.location || null,
            department: data.department || null,
            vendor: data.vendor || null,
            condition: data.condition || 'good',
            insuranceDetails: data.insuranceDetails || null,
            isActive: true
        }).returning()

        if (newAsset) {
            await logActivity({
                companyId: data.companyId,
                userId: data.userId,
                action: "CREATE_FIXED_ASSET",
                tableName: "fixed_assets",
                recordId: newAsset.id,
                newValues: newAsset,
                details: `Asset registered: ${newAsset.assetName} (${newAsset.assetCode})`
            })
        }

        revalidatePath("/company-admin/fixed-assets")
        return { success: true, data: newAsset }
    } catch (error: any) {
        console.error("Create fixed asset error:", error)
        if (error.code === '23505') {
            return { success: false, error: "Asset code already exists" }
        }
        return { success: false, error: "Failed to create fixed asset" }
    }
}

/**
 * Update a fixed asset
 */
export async function updateFixedAsset(id: number, data: Partial<{
    assetName: string
    category: string
    isActive: boolean
    location: string
    department: string
    vendor: string
    condition: string
    insuranceDetails: string
}>, userId?: number) {
    try {
        const oldAsset = await db.query.fixedAssets.findFirst({
            where: eq(fixedAssets.id, id)
        })

        const [updated] = await db.update(fixedAssets)
            .set(data)
            .where(eq(fixedAssets.id, id))
            .returning()

        if (updated) {
            await logActivity({
                companyId: updated.companyId,
                userId,
                action: "UPDATE_FIXED_ASSET",
                tableName: "fixed_assets",
                recordId: updated.id,
                oldValues: oldAsset,
                newValues: updated,
                details: `Asset updated: ${updated.assetName}`
            })
        }

        revalidatePath("/company-admin/fixed-assets")
        return { success: true, data: updated }
    } catch (error) {
        console.error("Update fixed asset error:", error)
        return { success: false, error: "Failed to update fixed asset" }
    }
}

/**
 * Calculate depreciation for a single asset
 */
export async function calculateDepreciation(assetId: number) {
    try {
        const asset = await db.query.fixedAssets.findFirst({
            where: eq(fixedAssets.id, assetId)
        })

        if (!asset) {
            return { success: false, error: "Asset not found" }
        }

        const purchaseCost = parseFloat(asset.purchaseCost || "0")
        const residualValue = parseFloat(asset.residualValue || "0")
        const accumulatedDep = parseFloat(asset.accumulatedDepreciation || "0")
        const bookValue = parseFloat(asset.bookValue || "0")
        const usefulLifeYears = asset.usefulLifeYears || 1

        let monthlyDepreciation = 0

        if (asset.depreciationMethod === "straight_line") {
            // Straight Line: (Cost - Residual Value) / Useful Life / 12 months
            const depreciableAmount = purchaseCost - residualValue
            monthlyDepreciation = depreciableAmount / usefulLifeYears / 12
        } else if (asset.depreciationMethod === "declining_balance") {
            // Declining Balance: Book Value × Rate / 12 months
            const rate = parseFloat(asset.depreciationRate || "0") / 100
            monthlyDepreciation = bookValue * rate / 12
        }

        // Ensure we don't depreciate below residual value
        const newAccumulatedDep = accumulatedDep + monthlyDepreciation
        if (purchaseCost - newAccumulatedDep < residualValue) {
            monthlyDepreciation = purchaseCost - residualValue - accumulatedDep
        }

        const newBookValue = purchaseCost - newAccumulatedDep

        return {
            success: true,
            data: {
                assetId,
                assetName: asset.assetName,
                monthlyDepreciation,
                newAccumulatedDepreciation: newAccumulatedDep,
                newBookValue
            }
        }
    } catch (error) {
        console.error("Calculate depreciation error:", error)
        return { success: false, error: "Failed to calculate depreciation" }
    }
}

/**
 * Run batch depreciation for all active assets in a company
 */
export async function runDepreciationBatch(companyId: number, periodDate: string) {
    try {
        const assets = await db.query.fixedAssets.findMany({
            where: and(
                eq(fixedAssets.companyId, companyId),
                eq(fixedAssets.isActive, true)
            )
        })

        const results = []
        let totalDepreciation = 0

        for (const asset of assets) {
            // Skip if already depreciated this month
            if (asset.lastDepreciationDate === periodDate) {
                continue
            }

            const calcResult = await calculateDepreciation(asset.id)
            if (calcResult.success && calcResult.data) {
                const { monthlyDepreciation, newAccumulatedDepreciation, newBookValue } = calcResult.data

                // Update asset
                await db.update(fixedAssets)
                    .set({
                        accumulatedDepreciation: newAccumulatedDepreciation.toString(),
                        bookValue: newBookValue.toString(),
                        lastDepreciationDate: periodDate
                    })
                    .where(eq(fixedAssets.id, asset.id))

                results.push({
                    assetCode: asset.assetCode,
                    assetName: asset.assetName,
                    depreciation: monthlyDepreciation
                })

                totalDepreciation += monthlyDepreciation
            }
        }

        revalidatePath("/company-admin/fixed-assets")

        return {
            success: true,
            data: {
                processedAssets: results.length,
                totalDepreciation,
                details: results
            }
        }
    } catch (error) {
        console.error("Depreciation batch error:", error)
        return { success: false, error: "Failed to run depreciation batch" }
    }
}

/**
 * Dispose of an asset
 */
export async function disposeAsset(assetId: number, disposalData: {
    disposalDate: string
    disposalAmount: number
    notes?: string
}) {
    try {
        const asset = await db.query.fixedAssets.findFirst({
            where: eq(fixedAssets.id, assetId)
        })

        if (!asset) {
            return { success: false, error: "Asset not found" }
        }

        const bookValue = parseFloat(asset.bookValue || "0")
        const gainLoss = disposalData.disposalAmount - bookValue

        // Deactivate the asset
        await db.update(fixedAssets)
            .set({
                isActive: false
            })
            .where(eq(fixedAssets.id, assetId))

        revalidatePath("/company-admin/fixed-assets")

        return {
            success: true,
            data: {
                assetName: asset.assetName,
                bookValue,
                disposalAmount: disposalData.disposalAmount,
                gainLoss,
                isGain: gainLoss > 0
            }
        }
    } catch (error) {
        console.error("Dispose asset error:", error)
        return { success: false, error: "Failed to dispose asset" }
    }
}

/**
 * Get depreciation schedule for an asset
 */
export async function getAssetDepreciationSchedule(assetId: number) {
    try {
        const asset = await db.query.fixedAssets.findFirst({
            where: eq(fixedAssets.id, assetId)
        })

        if (!asset) {
            return { success: false, error: "Asset not found" }
        }

        const purchaseCost = parseFloat(asset.purchaseCost || "0")
        const residualValue = parseFloat(asset.residualValue || "0")
        const usefulLifeYears = asset.usefulLifeYears || 1
        const totalMonths = usefulLifeYears * 12

        const schedule = []
        let remainingBookValue = purchaseCost
        let accumulatedDep = 0

        for (let month = 1; month <= totalMonths; month++) {
            let monthlyDep = 0

            if (asset.depreciationMethod === "straight_line") {
                const depreciableAmount = purchaseCost - residualValue
                monthlyDep = depreciableAmount / totalMonths
            } else if (asset.depreciationMethod === "declining_balance") {
                const rate = parseFloat(asset.depreciationRate || "0") / 100
                monthlyDep = remainingBookValue * rate / 12
            }

            // Ensure we don't go below residual value
            if (remainingBookValue - monthlyDep < residualValue) {
                monthlyDep = remainingBookValue - residualValue
            }

            accumulatedDep += monthlyDep
            remainingBookValue -= monthlyDep

            schedule.push({
                month,
                depreciation: monthlyDep,
                accumulatedDepreciation: accumulatedDep,
                bookValue: remainingBookValue
            })

            if (remainingBookValue <= residualValue) {
                break
            }
        }

        return {
            success: true,
            data: {
                asset: {
                    code: asset.assetCode,
                    name: asset.assetName,
                    purchaseCost,
                    residualValue,
                    usefulLifeYears
                },
                schedule
            }
        }
    } catch (error) {
        console.error("Depreciation schedule error:", error)
        return { success: false, error: "Failed to generate schedule" }
    }
}

/**
 * Get audit trail for a specific asset
 */
export async function getAssetAuditTrail(assetId: number) {
    try {
        const data = await db.query.auditLogs.findMany({
            where: and(
                eq(auditLogs.tableName, "fixed_assets"),
                eq(auditLogs.recordId, assetId)
            ),
            orderBy: [desc(auditLogs.createdAt)],
            with: {
                user: true
            }
        })
        return { success: true, data }
    } catch (error) {
        console.error("Asset audit trail error:", error)
        return { success: false, error: "Failed to fetch audit trail" }
    }
}
