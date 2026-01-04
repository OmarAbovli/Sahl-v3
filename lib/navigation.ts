import type { User } from "@/lib/auth"

export interface NavItem {
    name: string
    href: string
    iconName: string
}

export interface NavGroup {
    title: string
    items: NavItem[]
}

export function getAdminNavItems(): NavGroup[] {
    return [
        {
            title: "Management",
            items: [
                { name: "Overview", href: "/company-admin", iconName: "LayoutDashboard" },
                { name: "Settings", href: "/company-admin/settings", iconName: "Settings" },
            ]
        },
        {
            title: "Commercial",
            items: [
                { name: "Sales & Invoices", href: "/company-admin/invoices", iconName: "TrendingUp" },
                { name: "Purchasing", href: "/company-admin/purchasing", iconName: "ShoppingCart" },
                { name: "CRM", href: "/company-admin/crm", iconName: "Target" },
            ]
        },
        {
            title: "Finance",
            items: [
                { name: "General Ledger", href: "/company-admin/accounting?view=general_ledger", iconName: "BookOpen" },
                { name: "Cash & Bank", href: "/company-admin/accounting?view=cash_bank", iconName: "Banknote" },
                { name: "Receivables", href: "/company-admin/accounting?view=accounts_receivable", iconName: "FileText" },
                { name: "Payables", href: "/company-admin/accounting?view=accounts_payable", iconName: "CreditCard" },
                { name: "Tax Management", href: "/company-admin/accounting?view=tax_management", iconName: "Calculator" },
                { name: "Financial Reports", href: "/company-admin/accounting?view=financial_reports", iconName: "BarChart3" },
            ]
        },
        {
            title: "Operations",
            items: [
                { name: "Inventory", href: "/company-admin/inventory", iconName: "Package" },
                { name: "Warehouses", href: "/company-admin/warehouses", iconName: "Warehouse" },
                { name: "Fixed Assets", href: "/company-admin/accounting?view=fixed_assets", iconName: "Building" },
            ]
        },
        {
            title: "Human Resources",
            items: [
                { name: "Employees", href: "/company-admin/employees", iconName: "Users" },
                { name: "HR Dashboard", href: "/company-admin/hr", iconName: "Users" },
                { name: "Payroll", href: "/company-admin/hr?view=payroll", iconName: "DollarSign" },
            ]
        }
    ]
}

export function getEmployeeNavItems(user: User): NavGroup[] {
    const permissions = user.permissions as Record<string, boolean> || {}
    const hasAccess = (module: string) => permissions[`view_${module}`] || permissions[`manage_${module}`]

    const groups: NavGroup[] = []

    // 1. Dashboard
    groups.push({
        title: "Overview",
        items: [
            { name: "Dashboard", href: "/employee", iconName: "LayoutDashboard" }
        ]
    })

    // 2. Commercial / Operations
    const opsItems: NavItem[] = []
    if (hasAccess('sales')) opsItems.push({ name: "Sales", href: "/employee?view=sales", iconName: "TrendingUp" })
    if (hasAccess('purchasing')) opsItems.push({ name: "Purchasing", href: "/employee?view=purchasing", iconName: "ShoppingCart" })
    if (hasAccess('inventory')) opsItems.push({ name: "Inventory", href: "/employee?view=inventory", iconName: "Package" })
    if (hasAccess('warehouses')) opsItems.push({ name: "Warehouses", href: "/employee?view=warehouses", iconName: "Warehouse" })
    if (hasAccess('fixed_assets')) opsItems.push({ name: "Fixed Assets", href: "/employee?view=fixed_assets", iconName: "Building" })

    if (opsItems.length > 0) {
        groups.push({ title: "Operations", items: opsItems })
    }

    // 3. Finance
    const finItems: NavItem[] = []
    if (hasAccess('general_ledger')) finItems.push({ name: "General Ledger", href: "/employee?view=general_ledger", iconName: "BookOpen" })
    if (hasAccess('cash_bank')) finItems.push({ name: "Cash & Bank", href: "/employee?view=cash_bank", iconName: "Banknote" })
    if (hasAccess('accounts_receivable')) finItems.push({ name: "Receivables", href: "/employee?view=accounts_receivable", iconName: "FileText" })
    if (hasAccess('accounts_payable')) finItems.push({ name: "Payables", href: "/employee?view=accounts_payable", iconName: "CreditCard" })
    if (hasAccess('tax_management')) finItems.push({ name: "Tax Management", href: "/employee?view=tax_management", iconName: "Calculator" })
    if (hasAccess('financial_reports')) finItems.push({ name: "Financial Reports", href: "/employee?view=financial_reports", iconName: "BarChart3" })

    // Old Invoices/Debts fallback if permissions are messy, but let's assume new structure covers it.
    // If 'invoices' exists but not 'sales', we might want to show it.
    // But 'Sales' covers invoices now. Let's keep it clean.

    if (finItems.length > 0) {
        groups.push({ title: "Finance", items: finItems })
    }

    // 4. HR
    const hrItems: NavItem[] = []
    if (hasAccess('hr_payroll')) hrItems.push({ name: "HR & Payroll", href: "/employee?view=hr_payroll", iconName: "Users" })
    if (hasAccess('employees')) hrItems.push({ name: "Team Directory", href: "/employee?view=employees", iconName: "Users" }) // Old view

    if (hrItems.length > 0) {
        groups.push({ title: "Human Resources", items: hrItems })
    }

    return groups
}
