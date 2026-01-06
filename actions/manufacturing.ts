"use server"

import { db } from "@/db"
import { machines, billOfMaterials, bomItems, productionOrders, productionStages, qualityLogs, maintenanceLogs } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { logActivity } from "./audit"
import { getSession } from "@/lib/session"

// Machine Management
export async function getMachines(companyId: number) {
    return await db.query.machines.findMany({
        where: eq(machines.companyId, companyId),
        orderBy: [desc(machines.createdAt)]
    })
}

export async function createMachine(data: any) {
    const session = await getSession()
    const [result] = await db.insert(machines).values(data).returning()

    await logActivity({
        companyId: data.companyId,
        userId: session?.userId,
        action: "CREATE_MACHINE",
        tableName: "machines",
        recordId: result.id,
        newValues: result,
        severity: 'info'
    })

    revalidatePath("/company-admin/manufacturing")
    return result
}

export async function updateMachine(id: number, data: any) {
    const session = await getSession()
    const [oldData] = await db.select().from(machines).where(eq(machines.id, id))
    const [result] = await db.update(machines).set(data).where(eq(machines.id, id)).returning()

    await logActivity({
        companyId: result.companyId,
        userId: session?.userId,
        action: "UPDATE_MACHINE",
        tableName: "machines",
        recordId: id,
        oldValues: oldData,
        newValues: result,
        severity: 'info'
    })

    revalidatePath("/company-admin/manufacturing")
    return result
}

// Bill of Materials (BOM)
export async function getBOMs(companyId: number) {
    return await db.query.billOfMaterials.findMany({
        where: eq(billOfMaterials.companyId, companyId),
        with: {
            finishedProduct: true,
            items: {
                with: {
                    rawMaterial: true
                }
            }
        }
    })
}

export async function createBOM(data: {
    companyId: number,
    finishedProductId: number,
    version?: string,
    notes?: string,
    items: { rawMaterialId: number, quantity: number, unit?: string }[]
}) {
    const { items, ...bomData } = data

    const [newBOM] = await db.insert(billOfMaterials).values(bomData).returning()

    if (items.length > 0) {
        await db.insert(bomItems).values(
            items.map(item => ({
                bomId: newBOM.id,
                ...item,
                quantity: item.quantity.toString() // numeric is string in Drizzle
            }))
        )
    }

    revalidatePath("/company-admin/manufacturing")
    return newBOM
}

// Production Orders
export async function getProductionOrders(companyId: number) {
    return await db.query.productionOrders.findMany({
        where: eq(productionOrders.companyId, companyId),
        orderBy: [desc(productionOrders.createdAt)],
        with: {
            product: true,
            bom: true,
            stages: {
                with: {
                    machine: true
                }
            }
        }
    })
}

export async function createProductionOrder(data: {
    companyId: number,
    orderNumber: string,
    productId: number,
    bomId?: number,
    quantity: number,
    startDate?: string,
    expectedEndDate?: string,
    priority?: string,
    notes?: string,
    createdBy?: number,
    stages?: { name: string, sequence: number, machineId?: number }[]
}) {
    const { stages, ...orderData } = data

    const [newOrder] = await db.insert(productionOrders).values({
        ...orderData,
        quantity: orderData.quantity.toString()
    }).returning()

    if (stages && stages.length > 0) {
        await db.insert(productionStages).values(
            stages.map(stage => ({
                productionOrderId: newOrder.id,
                ...stage
            }))
        )
    }

    revalidatePath("/company-admin/manufacturing")
    return newOrder
}

export async function updateStageStatus(stageId: number, status: string, notes?: string) {
    const updateData: any = { status }
    if (status === 'active') updateData.startedAt = new Date().toISOString()
    if (status === 'completed') updateData.completedAt = new Date().toISOString()
    if (notes) updateData.notes = notes

    const [result] = await db.update(productionStages).set(updateData).where(eq(productionStages.id, stageId)).returning()
    revalidatePath("/company-admin/manufacturing")
    return result
}
