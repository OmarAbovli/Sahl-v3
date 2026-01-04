import { relations } from "drizzle-orm/relations";
import { companies, users, warehouses, employees, invoices, inventory, activityLogs, supportTickets, debtPayments, debts, chartOfAccounts, journalEntries, journalEntryLines, aiInsights, customers, salesInvoices, suppliers, purchaseInvoices, products, purchaseOrders, salesOrders, bankAccounts, bankTransactions, fixedAssets, taxSettings, biometricDevices, accounts, journalLines, taxRules, customerPayments, supplierPayments, cashBankAccounts, inventoryMovements, cashBankTransactions, assetDepreciation, taxes, invoiceTaxes, roles, rolePermissions, permissions, userRoles, approvals, periodLocks, financialReports, purchaseInvoiceStatusHistory, salesInvoiceStatusHistory, biometricAttendance, salesInvoiceLines, purchaseInvoiceLines, chatMessages, costCenters, leads, deals, activities, attendanceRecords, leaveRequests, payrollRuns, payrollRunDetails } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
	company: one(companies, {
		fields: [users.companyId],
		references: [companies.id]
	}),
	warehouses: many(warehouses),
	employees: many(employees),
	invoices: many(invoices),
	activityLogs: many(activityLogs),
	supportTickets: many(supportTickets),
	debtPayments: many(debtPayments),
	debts: many(debts),
	journalEntries: many(journalEntries),
	salesInvoices: many(salesInvoices),
	purchaseInvoices: many(purchaseInvoices),
	purchaseOrders: many(purchaseOrders),
	salesOrders: many(salesOrders),
	bankTransactions: many(bankTransactions),
	purchaseInvoiceStatusHistories: many(purchaseInvoiceStatusHistory),
	salesInvoiceStatusHistories: many(salesInvoiceStatusHistory),
	chatMessages: many(chatMessages),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
	users: many(users),
	warehouses: many(warehouses),
	employees: many(employees),
	invoices: many(invoices),
	inventories: many(inventory),
	activityLogs: many(activityLogs),
	supportTickets: many(supportTickets),
	debtPayments: many(debtPayments),
	chartOfAccounts: many(chartOfAccounts),
	debts: many(debts),
	journalEntries: many(journalEntries),
	aiInsights: many(aiInsights),
	customers: many(customers),
	salesInvoices: many(salesInvoices),
	suppliers: many(suppliers),
	purchaseInvoices: many(purchaseInvoices),
	products: many(products),
	purchaseOrders: many(purchaseOrders),
	salesOrders: many(salesOrders),
	inventoryMovements: many(inventoryMovements),
	cashBankTransactions: many(cashBankTransactions),
	taxes: many(taxes),
	roles: many(roles),
	approvals: many(approvals),
	periodLocks: many(periodLocks),
	financialReports: many(financialReports),
	biometricAttendances: many(biometricAttendance),
	chatMessages: many(chatMessages),
	attendanceRecords: many(attendanceRecords),
	leaveRequests: many(leaveRequests),
	payrollRuns: many(payrollRuns),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
	company: one(companies, {
		fields: [warehouses.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [warehouses.managerId],
		references: [users.id]
	}),
	employees: many(employees),
	inventories: many(inventory),
	inventoryMovements: many(inventoryMovements),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
	company: one(companies, {
		fields: [employees.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
	warehouse: one(warehouses, {
		fields: [employees.warehouseId],
		references: [warehouses.id]
	}),
	biometricAttendances: many(biometricAttendance),
	attendanceRecords: many(attendanceRecords),
	leaveRequests: many(leaveRequests),
	payrollRunDetails: many(payrollRunDetails),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
	company: one(companies, {
		fields: [invoices.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [invoices.createdBy],
		references: [users.id]
	}),
	debts: many(debts),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
	company: one(companies, {
		fields: [inventory.companyId],
		references: [companies.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventory.warehouseId],
		references: [warehouses.id]
	}),
	salesInvoiceLines: many(salesInvoiceLines),
	purchaseInvoiceLines: many(purchaseInvoiceLines),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	company: one(companies, {
		fields: [activityLogs.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
	company: one(companies, {
		fields: [supportTickets.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [supportTickets.createdBy],
		references: [users.id]
	}),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
	company: one(companies, {
		fields: [debtPayments.companyId],
		references: [companies.id]
	}),
	debt: one(debts, {
		fields: [debtPayments.debtId],
		references: [debts.id]
	}),
	user: one(users, {
		fields: [debtPayments.recordedBy],
		references: [users.id]
	}),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
	debtPayments: many(debtPayments),
	company: one(companies, {
		fields: [debts.companyId],
		references: [companies.id]
	}),
	invoice: one(invoices, {
		fields: [debts.invoiceId],
		references: [invoices.id]
	}),
	user: one(users, {
		fields: [debts.createdBy],
		references: [users.id]
	}),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
	company: one(companies, {
		fields: [chartOfAccounts.companyId],
		references: [companies.id]
	}),
	chartOfAccount: one(chartOfAccounts, {
		fields: [chartOfAccounts.parentAccountId],
		references: [chartOfAccounts.id],
		relationName: "chartOfAccounts_parentAccountId_chartOfAccounts_id"
	}),
	chartOfAccounts: many(chartOfAccounts, {
		relationName: "chartOfAccounts_parentAccountId_chartOfAccounts_id"
	}),
	journalEntryLines: many(journalEntryLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
	company: one(companies, {
		fields: [journalEntries.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [journalEntries.createdBy],
		references: [users.id]
	}),
	journalEntryLines: many(journalEntryLines),
	journalLines: many(journalLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
	journalEntry: one(journalEntries, {
		fields: [journalEntryLines.journalEntryId],
		references: [journalEntries.id]
	}),
	chartOfAccount: one(chartOfAccounts, {
		fields: [journalEntryLines.accountId],
		references: [chartOfAccounts.id]
	}),
}));



export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
	company: one(companies, {
		fields: [aiInsights.companyId],
		references: [companies.id]
	}),
}));





export const customersRelations = relations(customers, ({ one, many }) => ({
	company: one(companies, {
		fields: [customers.companyId],
		references: [companies.id]
	}),
	salesInvoices: many(salesInvoices),
	salesOrders: many(salesOrders),
	customerPayments: many(customerPayments),
}));

export const salesInvoicesRelations = relations(salesInvoices, ({ one, many }) => ({
	company: one(companies, {
		fields: [salesInvoices.companyId],
		references: [companies.id]
	}),
	customer: one(customers, {
		fields: [salesInvoices.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [salesInvoices.createdBy],
		references: [users.id]
	}),
	customerPayments: many(customerPayments),
	salesInvoiceStatusHistories: many(salesInvoiceStatusHistory),
	salesInvoiceLines: many(salesInvoiceLines),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
	company: one(companies, {
		fields: [suppliers.companyId],
		references: [companies.id]
	}),
	purchaseInvoices: many(purchaseInvoices),
	purchaseOrders: many(purchaseOrders),
	supplierPayments: many(supplierPayments),
}));

export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one, many }) => ({
	company: one(companies, {
		fields: [purchaseInvoices.companyId],
		references: [companies.id]
	}),
	supplier: one(suppliers, {
		fields: [purchaseInvoices.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [purchaseInvoices.createdBy],
		references: [users.id]
	}),
	supplierPayments: many(supplierPayments),
	purchaseInvoiceStatusHistories: many(purchaseInvoiceStatusHistory),
	purchaseInvoiceLines: many(purchaseInvoiceLines),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
	company: one(companies, {
		fields: [products.companyId],
		references: [companies.id]
	}),
	inventoryMovements: many(inventoryMovements),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
	company: one(companies, {
		fields: [purchaseOrders.companyId],
		references: [companies.id]
	}),
	supplier: one(suppliers, {
		fields: [purchaseOrders.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [purchaseOrders.createdBy],
		references: [users.id]
	}),
}));

export const salesOrdersRelations = relations(salesOrders, ({ one }) => ({
	company: one(companies, {
		fields: [salesOrders.companyId],
		references: [companies.id]
	}),
	customer: one(customers, {
		fields: [salesOrders.customerId],
		references: [customers.id]
	}),
	user: one(users, {
		fields: [salesOrders.createdBy],
		references: [users.id]
	}),
}));



export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
	company: one(companies, {
		fields: [bankAccounts.companyId],
		references: [companies.id]
	}),
	bankTransactions: many(bankTransactions),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
	company: one(companies, {
		fields: [bankTransactions.companyId],
		references: [companies.id]
	}),
	bankAccount: one(bankAccounts, {
		fields: [bankTransactions.bankAccountId],
		references: [bankAccounts.id]
	}),
	user: one(users, {
		fields: [bankTransactions.createdBy],
		references: [users.id]
	}),
}));

export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
	company: one(companies, {
		fields: [fixedAssets.companyId],
		references: [companies.id]
	}),
	assetDepreciations: many(assetDepreciation),
}));

export const taxSettingsRelations = relations(taxSettings, ({ one }) => ({
	company: one(companies, {
		fields: [taxSettings.companyId],
		references: [companies.id]
	}),
}));

export const biometricDevicesRelations = relations(biometricDevices, ({ one, many }) => ({
	company: one(companies, {
		fields: [biometricDevices.companyId],
		references: [companies.id]
	}),
	biometricAttendances: many(biometricAttendance),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	company: one(companies, {
		fields: [accounts.companyId],
		references: [companies.id]
	}),
	account: one(accounts, {
		fields: [accounts.parentId],
		references: [accounts.id],
		relationName: "accounts_parentId_accounts_id"
	}),
	accounts: many(accounts, {
		relationName: "accounts_parentId_accounts_id"
	}),
	journalLines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
	journalEntry: one(journalEntries, {
		fields: [journalLines.journalEntryId],
		references: [journalEntries.id]
	}),
	account: one(accounts, {
		fields: [journalLines.accountId],
		references: [accounts.id]
	}),
}));

export const taxRulesRelations = relations(taxRules, ({ one }) => ({
	company: one(companies, {
		fields: [taxRules.companyId],
		references: [companies.id]
	}),
}));

export const customerPaymentsRelations = relations(customerPayments, ({ one }) => ({
	company: one(companies, {
		fields: [customerPayments.companyId],
		references: [companies.id]
	}),
	customer: one(customers, {
		fields: [customerPayments.customerId],
		references: [customers.id]
	}),
	salesInvoice: one(salesInvoices, {
		fields: [customerPayments.invoiceId],
		references: [salesInvoices.id]
	}),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one }) => ({
	company: one(companies, {
		fields: [supplierPayments.companyId],
		references: [companies.id]
	}),
	supplier: one(suppliers, {
		fields: [supplierPayments.supplierId],
		references: [suppliers.id]
	}),
	purchaseInvoice: one(purchaseInvoices, {
		fields: [supplierPayments.invoiceId],
		references: [purchaseInvoices.id]
	}),
}));

export const cashBankAccountsRelations = relations(cashBankAccounts, ({ one, many }) => ({
	company: one(companies, {
		fields: [cashBankAccounts.companyId],
		references: [companies.id]
	}),
	cashBankTransactions: many(cashBankTransactions),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
	company: one(companies, {
		fields: [inventoryMovements.companyId],
		references: [companies.id]
	}),
	product: one(products, {
		fields: [inventoryMovements.productId],
		references: [products.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventoryMovements.warehouseId],
		references: [warehouses.id]
	}),
}));


export const cashBankTransactionsRelations = relations(cashBankTransactions, ({ one }) => ({
	company: one(companies, {
		fields: [cashBankTransactions.companyId],
		references: [companies.id]
	}),
	cashBankAccount: one(cashBankAccounts, {
		fields: [cashBankTransactions.accountId],
		references: [cashBankAccounts.id]
	}),
}));

export const assetDepreciationRelations = relations(assetDepreciation, ({ one }) => ({
	fixedAsset: one(fixedAssets, {
		fields: [assetDepreciation.assetId],
		references: [fixedAssets.id]
	}),
}));

export const taxesRelations = relations(taxes, ({ one, many }) => ({
	company: one(companies, {
		fields: [taxes.companyId],
		references: [companies.id]
	}),
	invoiceTaxes: many(invoiceTaxes),
}));

export const invoiceTaxesRelations = relations(invoiceTaxes, ({ one }) => ({
	tax: one(taxes, {
		fields: [invoiceTaxes.taxId],
		references: [taxes.id]
	}),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
	company: one(companies, {
		fields: [roles.companyId],
		references: [companies.id]
	}),
	rolePermissions: many(rolePermissions),
	userRoles: many(userRoles),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
	rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
	company: one(companies, {
		fields: [approvals.companyId],
		references: [companies.id]
	}),
}));

export const periodLocksRelations = relations(periodLocks, ({ one }) => ({
	company: one(companies, {
		fields: [periodLocks.companyId],
		references: [companies.id]
	}),
}));

export const financialReportsRelations = relations(financialReports, ({ one }) => ({
	company: one(companies, {
		fields: [financialReports.companyId],
		references: [companies.id]
	}),
}));

export const purchaseInvoiceStatusHistoryRelations = relations(purchaseInvoiceStatusHistory, ({ one }) => ({
	purchaseInvoice: one(purchaseInvoices, {
		fields: [purchaseInvoiceStatusHistory.invoiceId],
		references: [purchaseInvoices.id]
	}),
	user: one(users, {
		fields: [purchaseInvoiceStatusHistory.changedBy],
		references: [users.id]
	}),
}));

export const salesInvoiceStatusHistoryRelations = relations(salesInvoiceStatusHistory, ({ one }) => ({
	salesInvoice: one(salesInvoices, {
		fields: [salesInvoiceStatusHistory.invoiceId],
		references: [salesInvoices.id]
	}),
	user: one(users, {
		fields: [salesInvoiceStatusHistory.changedBy],
		references: [users.id]
	}),
}));

export const biometricAttendanceRelations = relations(biometricAttendance, ({ one }) => ({
	company: one(companies, {
		fields: [biometricAttendance.companyId],
		references: [companies.id]
	}),
	biometricDevice: one(biometricDevices, {
		fields: [biometricAttendance.deviceId],
		references: [biometricDevices.id]
	}),
	employee: one(employees, {
		fields: [biometricAttendance.employeeId],
		references: [employees.id]
	}),
}));

export const salesInvoiceLinesRelations = relations(salesInvoiceLines, ({ one }) => ({
	salesInvoice: one(salesInvoices, {
		fields: [salesInvoiceLines.salesInvoiceId],
		references: [salesInvoices.id]
	}),
	inventory: one(inventory, {
		fields: [salesInvoiceLines.inventoryItemId],
		references: [inventory.id]
	}),
}));

export const purchaseInvoiceLinesRelations = relations(purchaseInvoiceLines, ({ one }) => ({
	purchaseInvoice: one(purchaseInvoices, {
		fields: [purchaseInvoiceLines.purchaseInvoiceId],
		references: [purchaseInvoices.id]
	}),
	inventory: one(inventory, {
		fields: [purchaseInvoiceLines.inventoryItemId],
		references: [inventory.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	company: one(companies, {
		fields: [chatMessages.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
	company: one(companies, {
		fields: [leads.companyId],
		references: [companies.id]
	}),
	assignedUser: one(users, {
		fields: [leads.assignedTo],
		references: [users.id]
	}),
	deals: many(deals),
	activities: many(activities),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
	company: one(companies, {
		fields: [deals.companyId],
		references: [companies.id]
	}),
	lead: one(leads, {
		fields: [deals.leadId],
		references: [leads.id]
	}),
	customer: one(customers, {
		fields: [deals.customerId],
		references: [customers.id]
	}),
	assignedUser: one(users, {
		fields: [deals.assignedTo],
		references: [users.id]
	}),
	activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
	company: one(companies, {
		fields: [activities.companyId],
		references: [companies.id]
	}),
	lead: one(leads, {
		fields: [activities.leadId],
		references: [leads.id]
	}),
	deal: one(deals, {
		fields: [activities.dealId],
		references: [deals.id]
	}),
	assignedUser: one(users, {
		fields: [activities.assignedTo],
		references: [users.id]
	}),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
	company: one(companies, {
		fields: [attendanceRecords.companyId],
		references: [companies.id]
	}),
	employee: one(employees, {
		fields: [attendanceRecords.employeeId],
		references: [employees.id]
	}),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
	company: one(companies, {
		fields: [leaveRequests.companyId],
		references: [companies.id]
	}),
	employee: one(employees, {
		fields: [leaveRequests.employeeId],
		references: [employees.id]
	}),
	approver: one(users, {
		fields: [leaveRequests.approvedBy],
		references: [users.id]
	}),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
	company: one(companies, {
		fields: [payrollRuns.companyId],
		references: [companies.id]
	}),
	processor: one(users, {
		fields: [payrollRuns.processedBy],
		references: [users.id]
	}),
	details: many(payrollRunDetails),
}));

export const payrollRunDetailsRelations = relations(payrollRunDetails, ({ one }) => ({
	payrollRun: one(payrollRuns, {
		fields: [payrollRunDetails.payrollRunId],
		references: [payrollRuns.id]
	}),
	employee: one(employees, {
		fields: [payrollRunDetails.employeeId],
		references: [employees.id]
	}),
}));
