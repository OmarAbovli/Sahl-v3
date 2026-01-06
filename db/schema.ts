import { pgTable, unique, serial, varchar, timestamp, boolean, index, foreignKey, integer, jsonb, numeric, date, text, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const companies = pgTable("companies", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	// New Fields
	address: text("address"),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 255 }),
	website: varchar("website", { length: 255 }),
	logoUrl: text("logo_url"),
	currency: varchar("currency", { length: 10 }).default('EGP'),
	taxId: varchar("tax_id", { length: 50 }),

	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("companies_name_key").on(table.name),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	uniqueKey: varchar("unique_key", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	companyId: integer("company_id"),
	role: varchar({ length: 50 }).notNull(),
	permissions: jsonb().default({}),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }),
}, (table) => [
	index("idx_users_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_users_unique_key").using("btree", table.uniqueKey.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "users_company_id_fkey"
	}).onDelete("cascade"),
	unique("users_unique_key_key").on(table.uniqueKey),
	unique("users_email_key").on(table.email),
]);

export const warehouses = pgTable("warehouses", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	name: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 500 }),
	managerId: integer("manager_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_warehouses_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_warehouses_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "warehouses_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.managerId],
		foreignColumns: [users.id],
		name: "warehouses_manager_id_fkey"
	}),
]);

export const employees = pgTable("employees", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	userId: integer("user_id"),
	employeeNumber: varchar("employee_number", { length: 50 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	position: varchar({ length: 100 }),
	department: varchar({ length: 100 }),
	salary: numeric({ precision: 12, scale: 2 }).default('0'),
	hireDate: date("hire_date"),
	contractType: varchar("contract_type", { length: 50 }).default('full_time'),
	bankDetails: jsonb("bank_details"),
	shiftStart: varchar("shift_start", { length: 5 }).default('09:00'),
	shiftEnd: varchar("shift_end", { length: 5 }).default('17:00'),
	warehouseId: integer("warehouse_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_employees_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_employees_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "employees_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "employees_user_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.warehouseId],
		foreignColumns: [warehouses.id],
		name: "employees_warehouse_id_fkey"
	}),
]);

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
	clientName: varchar("client_name", { length: 255 }),
	amount: numeric({ precision: 12, scale: 2 }).notNull(),
	status: varchar({ length: 50 }).default('pending'),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_invoices_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "invoices_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "invoices_created_by_fkey"
	}),
]);

export const inventory = pgTable("inventory", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	warehouseId: integer("warehouse_id"),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	itemCode: varchar("item_code", { length: 100 }),
	quantity: integer().default(0).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
	category: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_inventory_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_inventory_warehouse_id").using("btree", table.warehouseId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "inventory_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.warehouseId],
		foreignColumns: [warehouses.id],
		name: "inventory_warehouse_id_fkey"
	}).onDelete("cascade"),
]);

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	userId: integer("user_id"),
	action: varchar({ length: 255 }).notNull(),
	entityType: varchar("entity_type", { length: 100 }),
	entityId: integer("entity_id"),
	details: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_activity_logs_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "activity_logs_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "activity_logs_user_id_fkey"
	}).onDelete("set null"),
]);

export const supportTickets = pgTable("support_tickets", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	createdBy: integer("created_by"),
	subject: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: varchar({ length: 50 }).default('open'),
	priority: varchar({ length: 50 }).default('medium'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_support_tickets_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "support_tickets_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "support_tickets_created_by_fkey"
	}).onDelete("cascade"),
]);

export const debtPayments = pgTable("debt_payments", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	debtId: integer("debt_id"),
	paymentAmount: numeric("payment_amount", { precision: 12, scale: 2 }).notNull(),
	paymentDate: date("payment_date").notNull(),
	paymentMethod: varchar("payment_method", { length: 100 }),
	referenceNumber: varchar("reference_number", { length: 100 }),
	notes: text(),
	recordedBy: integer("recorded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_debt_payments_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_debt_payments_date").using("btree", table.paymentDate.asc().nullsLast().op("date_ops")),
	index("idx_debt_payments_debt_id").using("btree", table.debtId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "debt_payments_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.debtId],
		foreignColumns: [debts.id],
		name: "debt_payments_debt_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.recordedBy],
		foreignColumns: [users.id],
		name: "debt_payments_recorded_by_fkey"
	}),
]);

export const chartOfAccounts = pgTable("chart_of_accounts", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	accountCode: varchar("account_code", { length: 20 }).notNull(),
	accountName: varchar("account_name", { length: 255 }).notNull(),
	accountType: varchar("account_type", { length: 50 }).notNull(),
	parentAccountId: integer("parent_account_id"),
	isActive: boolean("is_active").default(true),
	balance: numeric({ precision: 15, scale: 2 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_chart_of_accounts_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "chart_of_accounts_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.parentAccountId],
		foreignColumns: [table.id],
		name: "chart_of_accounts_parent_account_id_fkey"
	}),
	unique("chart_of_accounts_company_id_account_code_key").on(table.companyId, table.accountCode),
]);

export const debts = pgTable("debts", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	debtorName: varchar("debtor_name", { length: 255 }).notNull(),
	debtorType: varchar("debtor_type", { length: 50 }).default('individual'),
	debtorContact: varchar("debtor_contact", { length: 255 }),
	invoiceId: integer("invoice_id"),
	originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
	remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
	saleDate: date("sale_date").notNull(),
	dueDate: date("due_date"),
	lastPaymentDate: date("last_payment_date"),
	lastPaymentAmount: numeric("last_payment_amount", { precision: 12, scale: 2 }).default('0'),
	status: varchar({ length: 50 }).default('active'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	accountName: varchar("account_name", { length: 100 }),
}, (table) => [
	index("idx_debts_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_debts_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_debts_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "debts_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [invoices.id],
		name: "debts_invoice_id_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "debts_created_by_fkey"
	}),
]);

export const journalEntries = pgTable("journal_entries", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	entryNumber: varchar("entry_number", { length: 50 }).notNull(),
	entryDate: date("entry_date").notNull(),
	description: text(),
	reference: varchar({ length: 100 }),
	totalDebit: numeric("total_debit", { precision: 15, scale: 2 }).default('0'),
	totalCredit: numeric("total_credit", { precision: 15, scale: 2 }).default('0'),
	isPosted: boolean("is_posted").default(false),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_journal_entries_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_journal_entries_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "journal_entries_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "journal_entries_created_by_fkey"
	}),
	unique("journal_entries_company_id_entry_number_key").on(table.companyId, table.entryNumber),
]);

export const journalEntryLines = pgTable("journal_entry_lines", {
	id: serial().primaryKey().notNull(),
	journalEntryId: integer("journal_entry_id").notNull(),
	accountId: integer("account_id").notNull(),
	description: text(),
	debitAmount: numeric("debit_amount", { precision: 15, scale: 2 }).default('0'),
	creditAmount: numeric("credit_amount", { precision: 15, scale: 2 }).default('0'),
	costCenterId: integer("cost_center_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.journalEntryId],
		foreignColumns: [journalEntries.id],
		name: "journal_entry_lines_journal_entry_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.accountId],
		foreignColumns: [accounts.id],
		name: "journal_entry_lines_account_id_fkey"
	}),
	foreignKey({
		columns: [table.costCenterId],
		foreignColumns: [costCenters.id],
		name: "journal_entry_lines_cost_center_id_fkey"
	}).onDelete("set null"),
]);


export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	customerCode: varchar("customer_code", { length: 20 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	address: text(),
	taxNumber: varchar("tax_number", { length: 50 }),
	creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }).default('0'),
	balance: numeric({ precision: 15, scale: 2 }).default('0'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_customers_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "customers_company_id_fkey"
	}).onDelete("cascade"),
	unique("customers_company_id_customer_code_key").on(table.companyId, table.customerCode),
]);

export const salesInvoices = pgTable("sales_invoices", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	customerId: integer("customer_id").notNull(),
	invoiceDate: date("invoice_date").notNull(),
	dueDate: date("due_date"),
	subtotal: numeric({ precision: 15, scale: 2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default('0'),
	paidAmount: numeric("paid_amount", { precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('draft'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	accountName: varchar("account_name", { length: 100 }),
}, (table) => [
	index("idx_sales_invoices_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "sales_invoices_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
		name: "sales_invoices_customer_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "sales_invoices_created_by_fkey"
	}),
	unique("sales_invoices_company_id_invoice_number_key").on(table.companyId, table.invoiceNumber),
]);

export const suppliers = pgTable("suppliers", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	supplierCode: varchar("supplier_code", { length: 20 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	address: text(),
	taxNumber: varchar("tax_number", { length: 50 }),
	balance: numeric({ precision: 15, scale: 2 }).default('0'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_suppliers_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "suppliers_company_id_fkey"
	}).onDelete("cascade"),
	unique("suppliers_company_id_supplier_code_key").on(table.companyId, table.supplierCode),
]);

export const purchaseInvoices = pgTable("purchase_invoices", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	supplierId: integer("supplier_id").notNull(),
	invoiceDate: date("invoice_date").notNull(),
	dueDate: date("due_date"),
	subtotal: numeric({ precision: 15, scale: 2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default('0'),
	paidAmount: numeric("paid_amount", { precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('pending'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_purchase_invoices_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "purchase_invoices_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.supplierId],
		foreignColumns: [suppliers.id],
		name: "purchase_invoices_supplier_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "purchase_invoices_created_by_fkey"
	}),
	unique("purchase_invoices_company_id_invoice_number_key").on(table.companyId, table.invoiceNumber),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	productCode: varchar("product_code", { length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	unitOfMeasure: varchar("unit_of_measure", { length: 50 }),
	costPrice: numeric("cost_price", { precision: 15, scale: 2 }).default('0'),
	sellingPrice: numeric("selling_price", { precision: 15, scale: 2 }).default('0'),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default('0'),
	reorderLevel: integer("reorder_level").default(0),
	productType: varchar("product_type", { length: 50 }).default('product'), // product, raw_material, service
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_products_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "products_company_id_fkey"
	}).onDelete("cascade"),
	unique("products_company_id_product_code_key").on(table.companyId, table.productCode),
]);

export const purchaseOrders = pgTable("purchase_orders", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	poNumber: varchar("po_number", { length: 50 }).notNull(),
	supplierId: integer("supplier_id").notNull(),
	orderDate: date("order_date").notNull(),
	expectedDate: date("expected_date"),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('pending'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "purchase_orders_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.supplierId],
		foreignColumns: [suppliers.id],
		name: "purchase_orders_supplier_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "purchase_orders_created_by_fkey"
	}),
	unique("purchase_orders_company_id_po_number_key").on(table.companyId, table.poNumber),
]);

export const purchaseOrderLines = pgTable("purchase_order_lines", {
	id: serial().primaryKey().notNull(),
	purchaseOrderId: integer("purchase_order_id").notNull(),
	inventoryItemId: integer("inventory_item_id"),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale: 3 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
	lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default('0'),
	lineNumber: integer("line_number").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.purchaseOrderId],
		foreignColumns: [purchaseOrders.id],
		name: "purchase_order_lines_purchase_order_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.inventoryItemId],
		foreignColumns: [inventory.id],
		name: "purchase_order_lines_inventory_item_id_fkey"
	}),
]);

export const salesOrders = pgTable("sales_orders", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	soNumber: varchar("so_number", { length: 50 }).notNull(),
	customerId: integer("customer_id").notNull(),
	orderDate: date("order_date").notNull(),
	deliveryDate: date("delivery_date"),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('pending'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "sales_orders_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
		name: "sales_orders_customer_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "sales_orders_created_by_fkey"
	}),
	unique("sales_orders_company_id_so_number_key").on(table.companyId, table.soNumber),
]);


export const bankAccounts = pgTable("bank_accounts", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	accountName: varchar("account_name", { length: 255 }).notNull(),
	accountNumber: varchar("account_number", { length: 50 }),
	bankName: varchar("bank_name", { length: 255 }),
	accountType: varchar("account_type", { length: 50 }),
	balance: numeric({ precision: 15, scale: 2 }).default('0'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "bank_accounts_company_id_fkey"
	}).onDelete("cascade"),
]);

export const bankTransactions = pgTable("bank_transactions", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	bankAccountId: integer("bank_account_id").notNull(),
	transactionDate: date("transaction_date").notNull(),
	description: text(),
	reference: varchar({ length: 100 }),
	debitAmount: numeric("debit_amount", { precision: 15, scale: 2 }).default('0'),
	creditAmount: numeric("credit_amount", { precision: 15, scale: 2 }).default('0'),
	balance: numeric({ precision: 15, scale: 2 }).default('0'),
	isReconciled: boolean("is_reconciled").default(false),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "bank_transactions_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.bankAccountId],
		foreignColumns: [bankAccounts.id],
		name: "bank_transactions_bank_account_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "bank_transactions_created_by_fkey"
	}),
]);

export const fixedAssets = pgTable("fixed_assets", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	assetCode: varchar("asset_code", { length: 20 }).notNull(),
	assetName: varchar("asset_name", { length: 255 }).notNull(),
	category: varchar({ length: 100 }),
	purchaseDate: date("purchase_date"),
	purchaseCost: numeric("purchase_cost", { precision: 15, scale: 2 }).default('0'),
	usefulLifeYears: integer("useful_life_years").default(0),
	depreciationMethod: varchar("depreciation_method", { length: 50 }).default('straight_line'),
	accumulatedDepreciation: numeric("accumulated_depreciation", { precision: 15, scale: 2 }).default('0'),
	bookValue: numeric("book_value", { precision: 15, scale: 2 }).default('0'),
	residualValue: numeric("residual_value", { precision: 15, scale: 2 }).default('0'),
	depreciationRate: numeric("depreciation_rate", { precision: 5, scale: 2 }).default('0'),
	lastDepreciationDate: date("last_depreciation_date"),
	isActive: boolean("is_active").default(true),
	serialNumber: varchar("serial_number", { length: 100 }),
	location: varchar({ length: 255 }),
	department: varchar({ length: 100 }),
	vendor: varchar({ length: 255 }),
	condition: varchar({ length: 50 }).default('good'), // good, fair, poor, damaged
	insuranceDetails: text("insurance_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_fixed_assets_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "fixed_assets_company_id_fkey"
	}).onDelete("cascade"),
	unique("fixed_assets_company_id_asset_code_key").on(table.companyId, table.assetCode),
]);

export const taxSettings = pgTable("tax_settings", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	taxName: varchar("tax_name", { length: 100 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "tax_settings_company_id_fkey"
	}).onDelete("cascade"),
]);

export const biometricDevices = pgTable("biometric_devices", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	deviceName: varchar("device_name", { length: 255 }).notNull(),
	deviceType: varchar("device_type", { length: 100 }),
	ipAddress: varchar("ip_address", { length: 100 }),
	port: integer().default(4370),
	model: varchar({ length: 100 }),
	serialNumber: varchar("serial_number", { length: 100 }),
	protocol: varchar({ length: 50 }),
	username: varchar({ length: 100 }),
	password: varchar({ length: 100 }),
	location: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "biometric_devices_company_id_fkey"
	}).onDelete("cascade"),
]);

export const accounts = pgTable("accounts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "accounts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }),
	type: varchar({ length: 30 }).notNull(),
	parentId: integer("parent_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_accounts_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "accounts_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.parentId],
		foreignColumns: [table.id],
		name: "accounts_parent_id_fkey"
	}).onDelete("set null"),
	unique("accounts_company_id_code_key").on(table.companyId, table.code),
]);

export const journalLines = pgTable("journal_lines", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "journal_lines_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	journalEntryId: integer("journal_entry_id").notNull(),
	accountId: integer("account_id").notNull(),
	debit: numeric({ precision: 14, scale: 2 }).default('0'),
	credit: numeric({ precision: 14, scale: 2 }).default('0'),
	costCenterId: integer("cost_center_id"),
	description: text(),
}, (table) => [
	index("idx_journal_lines_entry").using("btree", table.journalEntryId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.journalEntryId],
		foreignColumns: [journalEntries.id],
		name: "journal_lines_journal_entry_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.accountId],
		foreignColumns: [accounts.id],
		name: "journal_lines_account_id_fkey"
	}),
	foreignKey({
		columns: [table.costCenterId],
		foreignColumns: [costCenters.id],
		name: "journal_lines_cost_center_id_fkey"
	}).onDelete("set null"),
]);

export const taxRules = pgTable("tax_rules", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	rate: numeric({ precision: 6, scale: 2 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "tax_rules_company_id_fkey"
	}).onDelete("cascade"),
	check("chk_tax_rate", sql`rate >= (0)::numeric`),
]);

export const customerPayments = pgTable("customer_payments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "customer_payments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	customerId: integer("customer_id").notNull(),
	invoiceId: integer("invoice_id"),
	amount: numeric({ precision: 14, scale: 2 }).notNull(),
	paymentDate: date("payment_date").notNull(),
	method: varchar({ length: 30 }),
	reference: varchar({ length: 50 }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "customer_payments_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
		name: "customer_payments_customer_id_fkey"
	}),
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [salesInvoices.id],
		name: "customer_payments_invoice_id_fkey"
	}),
]);

export const supplierPayments = pgTable("supplier_payments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "supplier_payments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	supplierId: integer("supplier_id").notNull(),
	invoiceId: integer("invoice_id"),
	purchaseOrderId: integer("purchase_order_id"),
	amount: numeric({ precision: 14, scale: 2 }).notNull(),
	paymentDate: date("payment_date").notNull(),
	method: varchar({ length: 30 }),
	reference: varchar({ length: 50 }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "supplier_payments_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.supplierId],
		foreignColumns: [suppliers.id],
		name: "supplier_payments_supplier_id_fkey"
	}),
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [purchaseInvoices.id],
		name: "supplier_payments_invoice_id_fkey"
	}),
	foreignKey({
		columns: [table.purchaseOrderId],
		foreignColumns: [purchaseOrders.id],
		name: "supplier_payments_purchase_order_id_fkey"
	}),
]);

export const cashBankAccounts = pgTable("cash_bank_accounts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "cash_bank_accounts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	accountNumber: varchar("account_number", { length: 50 }),
	bankName: varchar("bank_name", { length: 100 }),
	type: varchar({ length: 20 }).notNull(),
	currency: varchar({ length: 10 }).default('EGP').notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_cash_bank_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "cash_bank_accounts_company_id_fkey"
	}).onDelete("cascade"),
]);

export const inventoryMovements = pgTable("inventory_movements", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "inventory_movements_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	productId: integer("product_id").notNull(),
	warehouseId: integer("warehouse_id").notNull(),
	movementType: varchar("movement_type", { length: 20 }).notNull(),
	quantity: numeric({ precision: 14, scale: 2 }).notNull(),
	movementDate: date("movement_date").notNull(),
	reference: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "inventory_movements_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productId],
		foreignColumns: [products.id],
		name: "inventory_movements_product_id_fkey"
	}),
	foreignKey({
		columns: [table.warehouseId],
		foreignColumns: [warehouses.id],
		name: "inventory_movements_warehouse_id_fkey"
	}),
]);


export const cashBankTransactions = pgTable("cash_bank_transactions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "cash_bank_transactions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	accountId: integer("account_id").notNull(),
	transactionType: varchar("transaction_type", { length: 20 }).notNull(),
	amount: numeric({ precision: 14, scale: 2 }).notNull(),
	transactionDate: date("transaction_date").notNull(),
	reference: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_cash_bank_tx_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "cash_bank_transactions_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.accountId],
		foreignColumns: [cashBankAccounts.id],
		name: "cash_bank_transactions_account_id_fkey"
	}),
]);

export const assetDepreciation = pgTable("asset_depreciation", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "asset_depreciation_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	assetId: integer("asset_id").notNull(),
	periodStart: date("period_start").notNull(),
	periodEnd: date("period_end").notNull(),
	depreciationAmount: numeric("depreciation_amount", { precision: 14, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.assetId],
		foreignColumns: [fixedAssets.id],
		name: "asset_depreciation_asset_id_fkey"
	}).onDelete("cascade"),
]);

export const taxes = pgTable("taxes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "taxes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	rate: numeric({ precision: 6, scale: 3 }).notNull(),
	type: varchar({ length: 30 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_taxes_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "taxes_company_id_fkey"
	}).onDelete("cascade"),
]);

export const invoiceTaxes = pgTable("invoice_taxes", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "invoice_taxes_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	invoiceType: varchar("invoice_type", { length: 20 }).notNull(),
	invoiceId: integer("invoice_id").notNull(),
	taxId: integer("tax_id").notNull(),
	amount: numeric({ precision: 14, scale: 2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.taxId],
		foreignColumns: [taxes.id],
		name: "invoice_taxes_tax_id_fkey"
	}),
]);

export const roles = pgTable("roles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_roles_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "roles_company_id_fkey"
	}).onDelete("cascade"),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "role_permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.roleId],
		foreignColumns: [roles.id],
		name: "role_permissions_role_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.permissionId],
		foreignColumns: [permissions.id],
		name: "role_permissions_permission_id_fkey"
	}).onDelete("cascade"),
]);

export const permissions = pgTable("permissions", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "permissions_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
});

export const userRoles = pgTable("user_roles", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "user_roles_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	userId: integer("user_id").notNull(),
	roleId: integer("role_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_roles_user_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.roleId],
		foreignColumns: [roles.id],
		name: "user_roles_role_id_fkey"
	}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "audit_logs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id"),
	userId: integer("user_id"),
	action: varchar({ length: 100 }).notNull(),
	tableName: varchar("table_name", { length: 100 }),
	recordId: integer("record_id"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	details: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	severity: varchar({ length: 20 }).default('info'), // info, warning, critical
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_audit_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
]);

export const approvals = pgTable("approvals", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "approvals_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	module: varchar({ length: 50 }).notNull(),
	recordId: integer("record_id").notNull(),
	status: varchar({ length: 20 }).default('pending'),
	requestedBy: integer("requested_by"),
	approvedBy: integer("approved_by"),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow(),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approvals_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "approvals_company_id_fkey"
	}).onDelete("cascade"),
]);

export const periodLocks = pgTable("period_locks", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "period_locks_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	periodStart: date("period_start").notNull(),
	periodEnd: date("period_end").notNull(),
	isLocked: boolean("is_locked").default(true),
	lockedBy: integer("locked_by"),
	lockedAt: timestamp("locked_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_period_locks_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "period_locks_company_id_fkey"
	}).onDelete("cascade"),
]);

export const financialReports = pgTable("financial_reports", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "financial_reports_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	parameters: jsonb(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_financial_reports_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "financial_reports_company_id_fkey"
	}).onDelete("cascade"),
]);

export const purchaseInvoiceStatusHistory = pgTable("purchase_invoice_status_history", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id").notNull(),
	oldStatus: varchar("old_status", { length: 20 }),
	newStatus: varchar("new_status", { length: 20 }).notNull(),
	changedBy: integer("changed_by"),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [purchaseInvoices.id],
		name: "purchase_invoice_status_history_invoice_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.changedBy],
		foreignColumns: [users.id],
		name: "purchase_invoice_status_history_changed_by_fkey"
	}),
]);

export const salesInvoiceStatusHistory = pgTable("sales_invoice_status_history", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id").notNull(),
	oldStatus: varchar("old_status", { length: 20 }),
	newStatus: varchar("new_status", { length: 20 }).notNull(),
	changedBy: integer("changed_by"),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [salesInvoices.id],
		name: "sales_invoice_status_history_invoice_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.changedBy],
		foreignColumns: [users.id],
		name: "sales_invoice_status_history_changed_by_fkey"
	}),
]);

export const biometricAttendance = pgTable("biometric_attendance", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id"),
	deviceId: integer("device_id"),
	employeeId: integer("employee_id"),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	eventType: varchar("event_type", { length: 20 }).notNull(),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "biometric_attendance_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.deviceId],
		foreignColumns: [biometricDevices.id],
		name: "biometric_attendance_device_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.employeeId],
		foreignColumns: [employees.id],
		name: "biometric_attendance_employee_id_fkey"
	}).onDelete("cascade"),
]);

export const salesInvoiceLines = pgTable("sales_invoice_lines", {
	id: serial().primaryKey().notNull(),
	salesInvoiceId: integer("sales_invoice_id").notNull(),
	inventoryItemId: integer("inventory_item_id"),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale: 3 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
	lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default('0'),
	lineNumber: integer("line_number").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.salesInvoiceId],
		foreignColumns: [salesInvoices.id],
		name: "sales_invoice_lines_sales_invoice_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.inventoryItemId],
		foreignColumns: [inventory.id],
		name: "sales_invoice_lines_inventory_item_id_fkey"
	}),
]);

export const purchaseInvoiceLines = pgTable("purchase_invoice_lines", {
	id: serial().primaryKey().notNull(),
	purchaseInvoiceId: integer("purchase_invoice_id").notNull(),
	inventoryItemId: integer("inventory_item_id"),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale: 3 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
	lineTotal: numeric("line_total", { precision: 15, scale: 2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default('0'),
	lineNumber: integer("line_number").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.purchaseInvoiceId],
		foreignColumns: [purchaseInvoices.id],
		name: "purchase_invoice_lines_purchase_invoice_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.inventoryItemId],
		foreignColumns: [inventory.id],
		name: "purchase_invoice_lines_inventory_item_id_fkey"
	}),
]);

export const chatMessages = pgTable("chat_messages", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	userId: integer("user_id").notNull(),
	content: text(),
	fileUrl: text("file_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_chat_messages_company_id").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "chat_messages_company_id_fkey"
	}),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "chat_messages_user_id_fkey"
	}),
]);

export const costCenters = pgTable("cost_centers", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	code: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_cost_centers_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "cost_centers_company_id_fkey"
	}).onDelete("cascade"),
	unique("cost_centers_company_id_code_key").on(table.companyId, table.code),
]);

export const aiInsights = pgTable("ai_insights", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	insightType: varchar("insight_type", { length: 50 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	severity: varchar({ length: 20 }).notNull(),
	metadata: jsonb(),
	actionUrl: text("action_url"),
	isRead: boolean("is_read").default(false),
	isArchived: boolean("is_archived").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_ai_insights_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "ai_insights_company_id_fkey"
	}).onDelete("cascade"),
]);

export const leads = pgTable("leads", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	email: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	companyName: varchar("company_name", { length: 100 }),
	status: varchar({ length: 20 }).default('new').notNull(),
	source: varchar({ length: 50 }),
	notes: text(),
	assignedTo: integer("assigned_to"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_leads_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "leads_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.assignedTo],
		foreignColumns: [users.id],
		name: "leads_assigned_to_fkey"
	}),
]);

export const deals = pgTable("deals", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	value: numeric({ precision: 14, scale: 2 }).default('0'),
	currency: varchar({ length: 3 }).default('EGP'),
	stage: varchar({ length: 50 }).notNull(),
	leadId: integer("lead_id"),
	customerId: integer("customer_id"),
	expectedCloseDate: date("expected_close_date"),
	probability: integer().default(0),
	notes: text(),
	assignedTo: integer("assigned_to"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_deals_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "deals_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.leadId],
		foreignColumns: [leads.id],
		name: "deals_lead_id_fkey"
	}),
	foreignKey({
		columns: [table.customerId],
		foreignColumns: [customers.id],
		name: "deals_customer_id_fkey"
	}),
]);

export const activities = pgTable("activities", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	leadId: integer("lead_id"),
	dealId: integer("deal_id"),
	customerId: integer("customer_id"),
	assignedTo: integer("assigned_to"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_activities_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "activities_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.leadId],
		foreignColumns: [leads.id],
		name: "activities_lead_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.dealId],
		foreignColumns: [deals.id],
		name: "activities_deal_id_fkey"
	}).onDelete("cascade"),
]);

export const attendanceRecords = pgTable("attendance_records", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	employeeId: integer("employee_id").notNull(),
	date: date("date").notNull(),
	checkIn: timestamp("check_in", { mode: 'string' }),
	checkOut: timestamp("check_out", { mode: 'string' }),
	status: varchar({ length: 20 }).notNull(), // present, absent, late, half_day
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_attendance_company").using("btree", table.companyId.asc().nullsLast().op("int4_ops")),
	index("idx_attendance_employee").using("btree", table.employeeId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "attendance_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.employeeId],
		foreignColumns: [employees.id],
		name: "attendance_employee_id_fkey"
	}).onDelete("cascade"),
]);

export const leaveRequests = pgTable("leave_requests", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	employeeId: integer("employee_id").notNull(),
	leaveType: varchar("leave_type", { length: 50 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	daysCount: integer("days_count").notNull(),
	reason: text(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	approvedBy: integer("approved_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "leave_requests_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.employeeId],
		foreignColumns: [employees.id],
		name: "leave_requests_employee_id_fkey"
	}).onDelete("cascade"),
]);

export const payrollRuns = pgTable("payroll_runs", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	month: integer().notNull(),
	year: integer().notNull(),
	totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('draft').notNull(),
	processedBy: integer("processed_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "payroll_runs_company_id_fkey"
	}).onDelete("cascade"),
]);

export const payrollRunDetails = pgTable("payroll_run_details", {
	id: serial().primaryKey().notNull(),
	payrollRunId: integer("payroll_run_id").notNull(),
	employeeId: integer("employee_id").notNull(),
	basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
	allowances: numeric({ precision: 14, scale: 2 }).default('0'),
	deductions: numeric({ precision: 14, scale: 2 }).default('0'),
	netSalary: numeric("net_salary", { precision: 14, scale: 2 }).notNull(),
	breakdown: jsonb(), // Store detailed calculation components
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.payrollRunId],
		foreignColumns: [payrollRuns.id],
		name: "payroll_details_run_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.employeeId],
		foreignColumns: [employees.id],
		name: "payroll_details_employee_id_fkey"
	}),
]);

export const taxReports = pgTable("tax_reports", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	period: varchar({ length: 50 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('pending'),
	filed: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "tax_reports_company_id_fkey"
	}).onDelete("cascade"),
]);

export const taxFilings = pgTable("tax_filings", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	period: varchar({ length: 50 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	filed: boolean().default(true),
	docUrl: text("doc_url"),
	filedAt: timestamp("filed_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "tax_filings_company_id_fkey"
	}).onDelete("cascade"),
]);

export const aiReports = pgTable("ai_reports", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	reportType: varchar("report_type", { length: 50 }).notNull(),
	generatedBy: integer("generated_by"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "ai_reports_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.generatedBy],
		foreignColumns: [users.id],
		name: "ai_reports_generated_by_fkey"
	}).onDelete("set null"),
]);

export const treasurySessions = pgTable("treasury_sessions", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	userId: integer("user_id").notNull(),
	openingBalance: numeric("opening_balance", { precision: 15, scale: 2 }).default('0'),
	expectedClosingBalance: numeric("expected_closing_balance", { precision: 15, scale: 2 }).default('0'),
	actualClosingBalance: numeric("actual_closing_balance", { precision: 15, scale: 2 }),
	difference: numeric({ precision: 15, scale: 2 }).default('0'),
	status: varchar({ length: 20 }).default('open').notNull(), // open, closed, pending_review
	currency: varchar({ length: 10 }).default('EGP').notNull(),
	notes: text(),
	openedAt: timestamp("opened_at", { mode: 'string' }).defaultNow(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "treasury_sessions_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "treasury_sessions_user_id_fkey"
	}).onDelete("cascade"),
]);

export const treasuryTransfers = pgTable("treasury_transfers", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	fromUserId: integer("from_user_id"),
	toUserId: integer("to_user_id"),
	fromAccountId: integer("from_account_id"),
	toAccountId: integer("to_account_id"),
	amount: numeric({ precision: 15, scale: 2 }).notNull(),
	currency: varchar({ length: 10 }).default('EGP').notNull(),
	conversionRate: numeric("conversion_rate", { precision: 15, scale: 6 }).default('1'),
	type: varchar({ length: 30 }).notNull(), // vault_to_user, user_to_vault, user_to_user, etc.
	status: varchar({ length: 20 }).default('pending').notNull(), // pending, completed, rejected
	reference: varchar({ length: 100 }),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "treasury_transfers_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.fromUserId],
		foreignColumns: [users.id],
		name: "treasury_transfers_from_user_id_fkey"
	}),
	foreignKey({
		columns: [table.toUserId],
		foreignColumns: [users.id],
		name: "treasury_transfers_to_user_id_fkey"
	}),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "treasury_transfers_created_by_fkey"
	}),
]);

export const machines = pgTable("machines", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 100 }),
	type: varchar({ length: 100 }), // CNC, Assembly, etc.
	status: varchar({ length: 50 }).default('operational'), // operational, idle, maintenance, broken
	healthScore: integer("health_score").default(100),
	lastMaintenanceAt: timestamp("last_maintenance_at", { mode: 'string' }),
	nextMaintenanceAt: timestamp("next_maintenance_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "machines_company_id_fkey"
	}).onDelete("cascade"),
]);

export const billOfMaterials = pgTable("bill_of_materials", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	finishedProductId: integer("finished_product_id").notNull(),
	version: varchar({ length: 20 }).default('1.0'),
	isActive: boolean("is_active").default(true),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "bom_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.finishedProductId],
		foreignColumns: [products.id],
		name: "bom_finished_product_id_fkey"
	}).onDelete("cascade"),
]);

export const bomItems = pgTable("bom_items", {
	id: serial().primaryKey().notNull(),
	bomId: integer("bom_id").notNull(),
	rawMaterialId: integer("raw_material_id").notNull(),
	quantity: numeric({ precision: 12, scale: 4 }).notNull(),
	unit: varchar({ length: 50 }),
}, (table) => [
	foreignKey({
		columns: [table.bomId],
		foreignColumns: [billOfMaterials.id],
		name: "bom_items_bom_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.rawMaterialId],
		foreignColumns: [products.id],
		name: "bom_items_raw_material_id_fkey"
	}),
]);

export const productionOrders = pgTable("production_orders", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	productId: integer("product_id").notNull(),
	bomId: integer("bom_id"),
	quantity: numeric({ precision: 12, scale: 2 }).notNull(),
	startDate: date("start_date"),
	expectedEndDate: date("expected_end_date"),
	actualEndDate: date("actual_end_date"),
	status: varchar({ length: 30 }).default('planned'), // planned, in_progress, completed, cancelled
	priority: varchar({ length: 20 }).default('medium'),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "production_orders_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productId],
		foreignColumns: [products.id],
		name: "production_orders_product_id_fkey"
	}),
	foreignKey({
		columns: [table.bomId],
		foreignColumns: [billOfMaterials.id],
		name: "production_orders_bom_id_fkey"
	}),
]);

export const productionStages = pgTable("production_stages", {
	id: serial().primaryKey().notNull(),
	productionOrderId: integer("production_order_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	sequence: integer().notNull(),
	machineId: integer("machine_id"),
	status: varchar({ length: 30 }).default('pending'), // pending, active, completed
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	operatorId: integer("operator_id"),
	notes: text(),
}, (table) => [
	foreignKey({
		columns: [table.productionOrderId],
		foreignColumns: [productionOrders.id],
		name: "production_stages_order_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.machineId],
		foreignColumns: [machines.id],
		name: "production_stages_machine_id_fkey"
	}),
	foreignKey({
		columns: [table.operatorId],
		foreignColumns: [users.id],
		name: "production_stages_operator_id_fkey"
	}),
]);

export const qualityLogs = pgTable("quality_logs", {
	id: serial().primaryKey().notNull(),
	companyId: integer("company_id").notNull(),
	productionOrderId: integer("production_order_id"),
	productionStageId: integer("production_stage_id"),
	checkerId: integer("checker_id"),
	status: varchar({ length: 20 }).notNull(), // pass, fail, rework
	findings: text(),
	measurements: jsonb(),
	checkedAt: timestamp("checked_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.companyId],
		foreignColumns: [companies.id],
		name: "quality_logs_company_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productionOrderId],
		foreignColumns: [productionOrders.id],
		name: "quality_logs_production_order_id_fkey"
	}),
	foreignKey({
		columns: [table.checkerId],
		foreignColumns: [users.id],
		name: "quality_logs_checker_id_fkey"
	}),
]);

export const maintenanceLogs = pgTable("maintenance_logs", {
	id: serial().primaryKey().notNull(),
	machineId: integer("machine_id").notNull(),
	type: varchar({ length: 50 }).notNull(), // routine, repair, emergency
	description: text().notNull(),
	cost: numeric({ precision: 12, scale: 2 }),
	technicianName: varchar({ length: 255 }),
	performedAt: timestamp("performed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.machineId],
		foreignColumns: [machines.id],
		name: "maintenance_logs_machine_id_fkey"
	}).onDelete("cascade"),
]);
