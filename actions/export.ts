"use server"

import { db } from "@/db"
import {
    salesInvoices,
    purchaseInvoices,
    inventory,
    journalEntries,
    payroll,
    hrEmployees,
    customers,
    suppliers
} from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"

export async function exportModelData(
    companyId: number,
    model: string,
    startDate?: string,
    endDate?: string
) {
    try {
        let data: any[] = []

        switch (model) {
            case "sales_invoices":
                data = await db.query.salesInvoices.findMany({
                    where: and(
                        eq(salesInvoices.companyId, companyId),
                        startDate ? gte(salesInvoices.invoiceDate, startDate) : undefined,
                        endDate ? lte(salesInvoices.invoiceDate, endDate) : undefined
                    ),
                    with: { customer: true }
                })
                // Flatten
                data = data.map(item => ({
                    Invoice_Number: item.invoiceNumber,
                    Date: item.invoiceDate,
                    Customer: item.customer?.name || "N/A",
                    Subtotal: item.subtotal,
                    Tax: item.taxAmount,
                    Total: item.totalAmount,
                    Status: item.status
                }))
                break;

            case "purchase_invoices":
                data = await db.query.purchaseInvoices.findMany({
                    where: and(
                        eq(purchaseInvoices.companyId, companyId),
                        startDate ? gte(purchaseInvoices.invoiceDate, startDate) : undefined,
                        endDate ? lte(purchaseInvoices.invoiceDate, endDate) : undefined
                    ),
                    with: { supplier: true }
                })
                data = data.map(item => ({
                    Invoice_Number: item.invoiceNumber,
                    Date: item.invoiceDate,
                    Supplier: item.supplier?.name || "N/A",
                    Subtotal: item.subtotal,
                    Tax: item.taxAmount,
                    Total: item.totalAmount,
                    Status: item.status
                }))
                break;

            case "inventory":
                data = await db.query.inventory.findMany({
                    where: eq(inventory.companyId, companyId)
                })
                data = data.map(item => ({
                    Code: item.itemCode,
                    Name: item.itemName,
                    Category: item.category,
                    Quantity: item.quantity,
                    Unit_Price: item.unitPrice,
                    Total_Value: (item.quantity || 0) * (item.unitPrice || 0)
                }))
                break;

            case "hr_employees":
                data = await db.query.hrEmployees.findMany({
                    where: eq(hrEmployees.companyId, companyId)
                })
                data = data.map(item => ({
                    Number: item.employeeNumber,
                    First_Name: item.firstName,
                    Last_Name: item.lastName,
                    Position: item.position,
                    Department: item.department,
                    Hire_Date: item.hireDate,
                    Salary: item.salary,
                    Status: item.status
                }))
                break;

            case "payroll":
                data = await db.query.payroll.findMany({
                    where: and(
                        eq(payroll.companyId, companyId),
                        startDate ? gte(payroll.payPeriodStart, startDate) : undefined,
                        endDate ? lte(payroll.payPeriodEnd, endDate) : undefined
                    ),
                    with: { employee: true }
                })
                data = data.map(item => ({
                    Employee: `${item.employee?.firstName} ${item.employee?.lastName}`,
                    Period_Start: item.payPeriodStart,
                    Period_End: item.payPeriodEnd,
                    Basic: item.basicSalary,
                    Allowances: item.allowances,
                    Deductions: item.deductions,
                    Net_Salary: item.netSalary,
                    Status: item.status
                }))
                break;

            case "customers":
                data = await db.query.customers.findMany({
                    where: eq(customers.companyId, companyId)
                })
                data = data.map(item => ({
                    Name: item.name,
                    Email: item.email,
                    Phone: item.phone,
                    Address: item.address,
                    Tax_Number: item.taxNumber,
                    Balance: item.balance
                }))
                break;

            case "vendors":
                data = await db.query.suppliers.findMany({
                    where: eq(suppliers.companyId, companyId)
                })
                data = data.map(item => ({
                    Name: item.name,
                    Email: item.email,
                    Phone: item.phone,
                    Address: item.address,
                    Tax_Number: item.taxNumber,
                    Balance: item.balance
                }))
                break;

            case "journal_entries":
                data = await db.query.journalEntries.findMany({
                    where: and(
                        eq(journalEntries.companyId, companyId),
                        startDate ? gte(journalEntries.entryDate, startDate) : undefined,
                        endDate ? lte(journalEntries.entryDate, endDate) : undefined
                    )
                })
                data = data.map(item => ({
                    Number: item.entryNumber,
                    Date: item.entryDate,
                    Description: item.description,
                    Reference: item.reference,
                    Total_Debit: item.totalDebit,
                    Total_Credit: item.totalCredit
                }))
                break;

            default:
                throw new Error("Unsupported model for export")
        }

        return { success: true, data }
    } catch (error) {
        console.error("Export Action Error:", error)
        return { success: false, error: "Failed to fetch export data" }
    }
}
