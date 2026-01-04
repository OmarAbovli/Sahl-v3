"use server"

import { db } from "@/db"
import {
    customers,
    suppliers,
    inventory,
    salesInvoices,
    purchaseInvoices,
    employees,
    fixedAssets,
    costCenters,
    journalEntries,
    chartOfAccounts
} from "@/db/schema"
import { or, ilike, eq, and, sql } from "drizzle-orm"

export interface SearchFilters {
    modules?: string[]
    limit?: number
    dateRange?: {
        start: string
        end: string
    }
}

export interface SearchResult {
    type: string
    id: number
    title: string
    subtitle: string
    description?: string
    metadata?: any
    url: string
}

/**
 * Universal global search across all modules
 */
export async function globalSearch(
    query: string,
    companyId: number,
    filters?: SearchFilters
) {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: { results: [], totalResults: 0, byModule: {} } }
        }

        const searchTerm = `%${query}%`
        const limit = filters?.limit || 10
        const results: SearchResult[] = []
        const byModule: Record<string, number> = {}

        // Helper to check if module is included
        const shouldSearch = (module: string) => {
            return !filters?.modules || filters.modules.includes(module)
        }

        // Search Customers
        if (shouldSearch('customers')) {
            const customerResults = await db
                .select({
                    id: customers.id,
                    name: customers.name,
                    email: customers.email,
                    phone: customers.phone,
                    code: customers.customerCode,
                    balance: customers.balance
                })
                .from(customers)
                .where(
                    and(
                        eq(customers.companyId, companyId),
                        or(
                            ilike(customers.name, searchTerm),
                            ilike(customers.email, searchTerm),
                            ilike(customers.phone, searchTerm),
                            ilike(customers.customerCode, searchTerm)
                        )
                    )
                )
                .limit(limit)

            customerResults.forEach(c => {
                results.push({
                    type: 'customer',
                    id: c.id,
                    title: c.name,
                    subtitle: c.code || '',
                    description: c.email || c.phone || '',
                    metadata: { balance: c.balance },
                    url: `/company-admin/customers/${c.id}`
                })
            })
            byModule.customers = customerResults.length
        }

        // Search Suppliers
        if (shouldSearch('suppliers')) {
            const supplierResults = await db
                .select({
                    id: suppliers.id,
                    name: suppliers.name,
                    email: suppliers.email,
                    phone: suppliers.phone,
                    code: suppliers.supplierCode
                })
                .from(suppliers)
                .where(
                    and(
                        eq(suppliers.companyId, companyId),
                        or(
                            ilike(suppliers.name, searchTerm),
                            ilike(suppliers.email, searchTerm),
                            ilike(suppliers.supplierCode, searchTerm)
                        )
                    )
                )
                .limit(limit)

            supplierResults.forEach(s => {
                results.push({
                    type: 'supplier',
                    id: s.id,
                    title: s.name,
                    subtitle: s.code || '',
                    description: s.email || s.phone || '',
                    url: `/company-admin/suppliers/${s.id}`
                })
            })
            byModule.suppliers = supplierResults.length
        }

        // Search Products/Inventory
        if (shouldSearch('products')) {
            const productResults = await db
                .select({
                    id: inventory.id,
                    name: inventory.itemName,
                    sku: inventory.sku,
                    category: inventory.category,
                    quantity: inventory.quantity,
                    unitPrice: inventory.unitPrice
                })
                .from(inventory)
                .where(
                    and(
                        eq(inventory.companyId, companyId),
                        or(
                            ilike(inventory.itemName, searchTerm),
                            ilike(inventory.sku, searchTerm),
                            ilike(inventory.category, searchTerm)
                        )
                    )
                )
                .limit(limit)

            productResults.forEach(p => {
                results.push({
                    type: 'product',
                    id: p.id,
                    title: p.name,
                    subtitle: p.sku || '',
                    description: `${p.category || 'N/A'} • Qty: ${p.quantity}`,
                    metadata: { quantity: p.quantity, price: p.unitPrice },
                    url: `/company-admin/inventory/${p.id}`
                })
            })
            byModule.products = productResults.length
        }

        // Search Sales Invoices
        if (shouldSearch('sales_invoices')) {
            const invoiceResults = await db
                .select({
                    id: salesInvoices.id,
                    number: salesInvoices.invoiceNumber,
                    date: salesInvoices.invoiceDate,
                    total: salesInvoices.totalAmount,
                    status: salesInvoices.status
                })
                .from(salesInvoices)
                .where(
                    and(
                        eq(salesInvoices.companyId, companyId),
                        ilike(salesInvoices.invoiceNumber, searchTerm)
                    )
                )
                .limit(limit)

            invoiceResults.forEach(i => {
                results.push({
                    type: 'sales_invoice',
                    id: i.id,
                    title: `Invoice ${i.number}`,
                    subtitle: new Date(i.date).toLocaleDateString(),
                    description: `${i.status} • ${i.total} EGP`,
                    metadata: { total: i.total, status: i.status },
                    url: `/company-admin/sales/${i.id}`
                })
            })
            byModule.sales_invoices = invoiceResults.length
        }

        // Search Employees
        if (shouldSearch('employees')) {
            const employeeResults = await db
                .select({
                    id: employees.id,
                    name: employees.fullName,
                    email: employees.email,
                    position: employees.position,
                    department: employees.department
                })
                .from(employees)
                .where(
                    and(
                        eq(employees.companyId, companyId),
                        or(
                            ilike(employees.fullName, searchTerm),
                            ilike(employees.email, searchTerm),
                            ilike(employees.position, searchTerm)
                        )
                    )
                )
                .limit(limit)

            employeeResults.forEach(e => {
                results.push({
                    type: 'employee',
                    id: e.id,
                    title: e.name,
                    subtitle: e.position || '',
                    description: `${e.department || 'N/A'} • ${e.email}`,
                    url: `/company-admin/employees/${e.id}`
                })
            })
            byModule.employees = employeeResults.length
        }

        // Search Fixed Assets
        if (shouldSearch('fixed_assets')) {
            const assetResults = await db
                .select({
                    id: fixedAssets.id,
                    code: fixedAssets.assetCode,
                    name: fixedAssets.assetName,
                    category: fixedAssets.category,
                    bookValue: fixedAssets.bookValue
                })
                .from(fixedAssets)
                .where(
                    and(
                        eq(fixedAssets.companyId, companyId),
                        or(
                            ilike(fixedAssets.assetCode, searchTerm),
                            ilike(fixedAssets.assetName, searchTerm),
                            ilike(fixedAssets.category, searchTerm)
                        )
                    )
                )
                .limit(limit)

            assetResults.forEach(a => {
                results.push({
                    type: 'fixed_asset',
                    id: a.id,
                    title: a.name,
                    subtitle: a.code,
                    description: `${a.category || 'N/A'} • Book Value: ${a.bookValue} EGP`,
                    metadata: { bookValue: a.bookValue },
                    url: `/company-admin/fixed-assets/${a.id}`
                })
            })
            byModule.fixed_assets = assetResults.length
        }

        // Search Cost Centers
        if (shouldSearch('cost_centers')) {
            const costCenterResults = await db
                .select({
                    id: costCenters.id,
                    code: costCenters.code,
                    name: costCenters.name,
                    description: costCenters.description
                })
                .from(costCenters)
                .where(
                    and(
                        eq(costCenters.companyId, companyId),
                        or(
                            ilike(costCenters.code, searchTerm),
                            ilike(costCenters.name, searchTerm)
                        )
                    )
                )
                .limit(limit)

            costCenterResults.forEach(cc => {
                results.push({
                    type: 'cost_center',
                    id: cc.id,
                    title: cc.name,
                    subtitle: cc.code,
                    description: cc.description || '',
                    url: `/company-admin/cost-centers/${cc.id}`
                })
            })
            byModule.cost_centers = costCenterResults.length
        }

        // Search Journal Entries
        if (shouldSearch('journal_entries')) {
            const journalResults = await db
                .select({
                    id: journalEntries.id,
                    number: journalEntries.entryNumber,
                    date: journalEntries.entryDate,
                    description: journalEntries.description,
                    isPosted: journalEntries.isPosted
                })
                .from(journalEntries)
                .where(
                    and(
                        eq(journalEntries.companyId, companyId),
                        or(
                            ilike(journalEntries.entryNumber, searchTerm),
                            ilike(journalEntries.description, searchTerm)
                        )
                    )
                )
                .limit(limit)

            journalResults.forEach(j => {
                results.push({
                    type: 'journal_entry',
                    id: j.id,
                    title: `Journal Entry ${j.number}`,
                    subtitle: new Date(j.date).toLocaleDateString(),
                    description: j.description || '',
                    metadata: { isPosted: j.isPosted },
                    url: `/company-admin/journal-entries/${j.id}`
                })
            })
            byModule.journal_entries = journalResults.length
        }

        const totalResults = results.length

        return {
            success: true,
            data: {
                results,
                totalResults,
                byModule,
                query
            }
        }
    } catch (error) {
        console.error("Global search error:", error)
        return { success: false, error: "Search failed" }
    }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query: string, companyId: number, limit: number = 5) {
    if (!query || query.length < 2) {
        return { success: true, data: [] }
    }

    const results = await globalSearch(query, companyId, { limit })

    if (results.success) {
        const suggestions = results.data!.results.map(r => ({
            text: r.title,
            type: r.type
        }))
        return { success: true, data: suggestions }
    }

    return { success: false, error: "Failed to get suggestions" }
}
