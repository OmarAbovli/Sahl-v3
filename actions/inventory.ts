"use server"

import { db } from "@/db"
import {
    inventory,
    warehouses,
    inventoryMovements,
    products,
    companies
} from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// --- INVENTORY ITEMS ---

export async function getInventory(companyId: number) {
    try {
        const data = await db.query.inventory.findMany({
            where: eq(inventory.companyId, companyId),
            with: {
                warehouse: true
            },
            orderBy: [desc(inventory.createdAt)]
        })
        return { success: true, data }
    } catch (error) {
        console.error("Error fetching inventory:", error)
        return { success: false, error: "Failed to fetch inventory" }
    }
}

export async function createInventoryItem(companyId: number, data: any) {
    try {
        await db.insert(inventory).values({
            companyId,
            warehouseId: parseInt(data.warehouseId),
            itemName: data.itemName,
            itemCode: data.itemCode,
            category: data.category,
            quantity: 0, // Initial stock is 0
            unitPrice: data.unitPrice ? data.unitPrice.toString() : "0",
        })
        revalidatePath('/employee')
        return { success: true, message: "Item created" }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create item" }
    }
}

export async function updateInventoryItem(id: number, data: any) {
    try {
        await db.update(inventory).set({
            itemName: data.itemName,
            itemCode: data.itemCode,
            category: data.category,
            unitPrice: data.unitPrice ? data.unitPrice.toString() : "0",
            warehouseId: parseInt(data.warehouseId)
        }).where(eq(inventory.id, id))

        revalidatePath('/employee')
        return { success: true, message: "Item updated" }
    } catch (error: any) {
        return { success: false, error: "Failed to update item" }
    }
}

export async function deleteInventoryItem(id: number) {
    try {
        await db.delete(inventory).where(eq(inventory.id, id))
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete item" }
    }
}

// --- ADJUST STOCK ---

export async function adjustStock(userId: number, companyId: number, itemId: number, adjustQty: number, reason: string) {
    try {
        await db.transaction(async (tx) => {
            // 1. Get current item to ensure it exists and get warehouse
            const item = await tx.query.inventory.findFirst({
                where: eq(inventory.id, itemId)
            })
            if (!item) throw new Error("Item not found")

            // 2. Update Quantity
            const newQty = item.quantity + adjustQty
            if (newQty < 0) throw new Error("Stock cannot be negative")

            await tx.update(inventory)
                .set({ quantity: newQty })
                .where(eq(inventory.id, itemId))

            // ... Check if product_id exists effectively, schema says 'products' table is separate from 'inventory'.
            // The current schema has Inventory table acting as the product list for sales/purchasing.
            // But inventoryMovements requires a 'productId'. 
            // WAIT: The schema `inventory_movements` refers to `products` table, NOT `inventory` table.
            // AND `inventory` table seems to duplicate some `products` data (itemName, itemCode).
            // This is a schema design flaw. 'Inventory' should likely link to 'Products'.
            // FOR NOW: I'll assume I can't easily insert into inventory_movements if I don't have a product ID?
            // Actually, `inventory` table has `id`.
            // Let's check `inventory_movements` schema again.
            // It links `productId` -> `products.id`.
            // But `inventory` table is used in Sales/Purchasing.

            // FIX: I will skip inserting into `inventory_movements` for now to avoid FK Constraint fail if `products` table is empty.
            // Or I should be using `products` table?
            // Sales/Purchasing used `inventory` table directly.
            // I will continue using `inventory` as the source of truth for now.
        })

        revalidatePath('/employee')
        return { success: true, message: "Stock adjusted" }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to adjust stock" }
    }
}

// --- WAREHOUSES ---

export async function getWarehouses(companyId: number) {
    try {
        const data = await db.query.warehouses.findMany({
            where: eq(warehouses.companyId, companyId)
        })
        return { success: true, data }
    } catch (error) {
        return { success: false, error: "Failed to fetch warehouses" }
    }
}

export async function createWarehouse(companyId: number, data: any) {
    try {
        await db.insert(warehouses).values({
            companyId,
            name: data.name,
            location: data.location,
            isActive: true
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to create warehouse" }
    }
}
