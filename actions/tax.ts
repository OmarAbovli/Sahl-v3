"use server"

import { db } from "@/db"
import { salesInvoices, purchaseInvoices, payroll, hrEmployees } from "@/db/schema"
import { eq, and, sql, gte, lte } from "drizzle-orm"

export async function getTaxSummary(companyId: number, startDate?: string, endDate?: string) {
    try {
        const conditions = [eq(salesInvoices.companyId, companyId)]
        if (startDate) conditions.push(gte(salesInvoices.invoiceDate, startDate))
        if (endDate) conditions.push(lte(salesInvoices.invoiceDate, endDate))

        // 1. VAT Collected (Sales)
        const salesRes = await db
            .select({
                totalTax: sql`SUM(${salesInvoices.taxAmount})`,
                totalAmount: sql`SUM(${salesInvoices.totalAmount})`,
                subtotal: sql`SUM(${salesInvoices.subtotal})`
            })
            .from(salesInvoices)
            .where(and(...conditions))

        // 2. VAT Paid (Purchases)
        const purchaseConditions = [eq(purchaseInvoices.companyId, companyId)]
        if (startDate) purchaseConditions.push(gte(purchaseInvoices.invoiceDate, startDate))
        if (endDate) purchaseConditions.push(lte(purchaseInvoices.invoiceDate, endDate))

        const purchaseRes = await db
            .select({
                totalTax: sql`SUM(${purchaseInvoices.taxAmount})`,
                totalAmount: sql`SUM(${purchaseInvoices.totalAmount})`,
                subtotal: sql`SUM(${purchaseInvoices.subtotal})`
            })
            .from(purchaseInvoices)
            .where(and(...purchaseConditions))

        // 3. Payroll (Deductions/Taxes)
        const payrollConditions = [eq(payroll.companyId, companyId)]
        if (startDate) payrollConditions.push(gte(payroll.payPeriodStart, startDate))
        if (endDate) payrollConditions.push(lte(payroll.payPeriodEnd, endDate))

        const payrollRes = await db
            .select({
                totalBasic: sql`SUM(${payroll.basicSalary})`,
                totalDeductions: sql`SUM(${payroll.deductions})`
            })
            .from(payroll)
            .where(and(...payrollConditions))

        const vatCollected = parseFloat(salesRes[0]?.totalTax as string) || 0
        const vatPaid = parseFloat(purchaseRes[0]?.totalTax as string) || 0
        const netVat = vatCollected - vatPaid

        const revenue = parseFloat(salesRes[0]?.subtotal as string) || 0
        const expenses = parseFloat(purchaseRes[0]?.subtotal as string) || 0
        const payrollExpense = parseFloat(payrollRes[0]?.totalBasic as string) || 0

        const taxableProfit = Math.max(0, revenue - expenses - payrollExpense)
        const corporateTaxRate = 0.225 // 22.5% standard in Egypt
        const estimatedCorporateTax = taxableProfit * corporateTaxRate

        return {
            success: true,
            data: {
                vat: {
                    collected: vatCollected,
                    paid: vatPaid,
                    net: netVat
                },
                corporate: {
                    taxableProfit,
                    estimatedTax: estimatedCorporateTax,
                    rate: corporateTaxRate * 100
                },
                payroll: {
                    totalBasic: payrollExpense,
                    estimatedTax: payrollExpense * 0.1 // 10% estimation
                },
                totalLiability: netVat + estimatedCorporateTax + (payrollExpense * 0.1)
            }
        }
    } catch (error) {
        console.error("Tax Summary Error:", error)
        return { success: false, error: "Failed to fetch tax summary" }
    }
}
