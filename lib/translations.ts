// Translation system for Arabic and English support

export type Language = "en" | "ar"

export interface TranslationKeys {
  // Navigation & General
  dashboard: string
  login: string
  logout: string
  welcome: string
  loading: string
  save: string
  cancel: string
  delete: string
  edit: string
  add: string
  create: string
  update: string
  search: string
  filter: string
  export: string
  print: string
  import: string
  settings: string
  profile: string
  help: string
  back: string
  not_applicable: string
  next: string
  previous: string
  close: string
  confirm: string
  view: string
  manage: string
  new: string
  read: string
  unread: string
  mark: string
  recent: string
  latest: string
  generating: string
  generate: string
  details: string
  download: string
  refresh: string
  unknown: string
  overview: string
  month: string
  months: string
  total_sales: string
  pending_receivables: string
  pending_payables: string
  revenue_overview: string
  recent_activity: string
  welcome_back: string
  daily_summary: string
  online: string
  sign_out: string
  active_employees: string
  operations: string
  management: string
  finance: string
  accounting: string
  hr: string
  crm: string
  pos: string
  reporting: string
  analytics: string
  human_resources: string
  team_directory: string
  operations_desc: string
  finance_desc: string
  hr_desc: string
  employee_portal: string
  employee_portal_desc: string
  your_permissions: string
  full_access: string
  view_only: string
  no_permissions: string
  restricted_access: string
  back_to_overview: string
  receivables: string
  payables: string
  general_reports: string
  debt_management: string
  global_report: string

  // Auth & Login
  client_key: string
  password: string
  secure_login: string
  verifying: string
  enter_unique_key: string
  login_failed: string
  error_occurred: string
  enterprise_access: string

  // User & Business Management
  users: string
  employees: string
  companies: string
  email: string
  role: string
  permissions: string
  status: string
  active: string
  inactive: string
  invoices: string
  inventory: string
  warehouses: string
  reports: string
  debts: string
  payments: string
  sales: string
  purchases: string
  purchasing: string
  warehouse: string
  first_name: string
  last_name: string
  position: string
  department: string
  hire_date: string
  salary: string
  employee_number: string
  add_employee: string
  edit_employee: string
  search_employees: string

  // Accounting & Finance
  general_ledger: string
  chart_of_accounts: string
  journal_entries: string
  accounts_receivable: string
  accounts_payable: string
  cash_bank: string
  fixed_assets: string
  hr_payroll: string
  tax_management: string
  financial_reports: string
  total: string
  amount: string
  price: string
  date: string
  debit: string
  credit: string
  balance: string
  account: string
  transaction: string
  customer: string
  supplier: string
  client: string
  client_name: string
  issue_date: string
  due_date: string
  vendor: string
  asset: string
  liability: string
  equity: string
  revenue: string
  expense: string
  profit_loss: string
  vat: string
  tax_rule: string
  tax_rate: string
  payroll: string
  payment_method: string
  invoice_number: string
  reference: string
  subtotal: string
  tax_amount: string
  total_amount: string
  paid_amount: string
  balance_due: string
  mark_as_paid: string
  post_to_gl: string
  unposted: string
  posted: string

  // Inventory & Warehouse
  items: string
  item_name: string
  item_code: string
  category: string
  quantity: string
  unit_price: string
  stock_on_hand: string
  stock_adjustment: string
  reorder_level: string
  warehouse_name: string
  location: string
  add_item: string
  edit_item: string
  moving_stock: string

  // UI Specific & Misc
  no_data: string
  no_access: string
  operation_failed: string
  operation_successful: string
  search_placeholder: string
  select_placeholder: string
  summary: string
  type: string
  reason: string
  notes: string
  attendance: string
  fingerprint_sync: string
  active_sessions: string
  draft: string
  pending: string
  paid: string
  delivered: string
  cancelled: string
  new_invoice: string
  accounting_modules: string
  accounting_modules_desc: string
  success: string
  error: string
  alert: string
  action_required: string
  info: string
  description: string
  name: string
  confirm_delete: string
  // Account Recovery
  account_recovery: string
  reset_password: string
  new_secure_password: string
  password_too_short: string
  confirm_overwrite: string
  abort: string

  // Luxury UI specific
  institutional: string
  setup: string
  tier: string
  ledger: string
  transparency: string
  assessment: string
  engine: string
  compliance: string
  governance: string
  hierarchy: string
  liquidity: string
  capital: string
  inflow: string
  outflow: string
  entry: string
  disbursement: string
  fulfillment: string
  dossier: string
  enrollment: string
  revision: string
  terminate: string
  biometric: string
  synchronization: string
  history: string
  filters: string
  rule: string
  currency_symbol: string
  net_vat_liability: string
  estimated_corporate_tax: string
  employment_tax: string
  total_tax_owed: string
  tax_breakdown: string
  income_vs_expenses: string
  taxable_revenue: string
  output_vat: string
  input_vat: string
  deductible_expenses: string
  compliance_status: string
  filing_ready: string
  treasury: string
  manufacturing: string
  machines: string
  production_orders: string
  bill_of_materials: string
  maintenance: string
  audit_trails: string
  entity_type: string
  old_value: string
  new_value: string
  action_type: string
  monitor_system_changes: string
  search_logs: string
  no_logs_found: string
  treasury_management: string
  manage_vault_and_reconciliation: string
  open_shift: string
  close_shift: string
  my_vault_status: string
  current_balance: string
  opening: string
  started_at: string
  initiate_transfer: string
  vault_transfer: string
  treasury_admin: string
  all_sessions: string
  active_shifts: string
  open_for_user: string
  conversion_rate: string
  bank_to_vault: string
  vault_to_bank: string
  invoice_to_vault: string
  select_user: string
  select_currency: string
  rate: string
  pending_transfers: string
  sheet: string
  movement: string
  protocol: string
  commercial: string
  security_logs: string
  "security_&_logs": string
  activity_log: string
  active_orders: string
  currently_in_production: string
  machine_health: string
  quality_pass_rate: string
  historical_average: string
  maintenance_due: string
  units_require_attention: string
  active_production_monitor: string
  real_time_stage_tracking: string
  no_active_production: string
  machine_activity: string
  production_order_management: string
  refresh_registry: string
  asset_fleet_monitoring: string
  bom_configuration_center: string
  production_intelligence: string
  units: string
  operational: string
  idle: string
  broken: string
  critical: string
  user_agent: string
  in_progress: string
  completed: string
  sales_invoices: string
  serial_number: string
  condition: string
  good: string
  fair: string
  poor: string
  damaged: string
  asset_history: string
  view_dossier: string
  personnel_dossier: string
  access_credentials: string
  username: string
  account_status: string
  asset_code: string
  asset_name: string
  purchase_date: string
  purchase_cost: string
  useful_life: string
  depreciation_method: string
  residual_value: string
  fixed_assets_management: string
  professional_asset_lifecycle: string
  run_depreciation: string
  new_asset: string
  total_assets: string
  book_value: string
  accumulated_depreciation: string
  depreciation: string
  accumulated: string
  straight_line: string
  declining_balance: string
  pending_invoice_selection: string
  target_deposit_account: string
  authorize_inflow: string
  authorize_outflow: string
  locate_invoice: string
  select_destination_account: string
  add_invoice: string
  purchasing_intelligence: string
  supplier_invoice_workflow_desc: string
  purchasing_workflow: string
  received_goods: string
  system_intelligence: string
  sales_invoice_integration_desc: string
  treasury_integration_desc: string
  sales_operations: string
  record_payment: string
  receive_payment: string
  capital_inflow_entry: string
  issue_disbursement: string
  capital_outflow_entry: string
  enterprise_settings: string
  institutional_identity: string
  branding: string
  contact_details: string
  commit_changes: string
  received_this_month: string
  new_purchase_order: string
  receive_goods: string
  tax_id: string
  website: string
  address: string
  phone: string
  display_name: string
  currency: string
  security_rbac: string
  system_audit_logs: string
  treasury_liquidity_management: string
  total_liquidity: string
  available_balance: string
  institutional_account_setup: string
  new_treasury_unit_config: string
  entity_identifier: string
  liquidity_class: string
  commercial_bank: string
  internal_vault_petty: string
  associated_bank: string
  iban_reference: string
  initialize_treasury_account: string
  ar_liquidation: string
  transfer_amount: string
  transaction_date: string
  capital_disbursement: string
  ap_fulfillment: string
  outstanding_liability: string
  select_purchase_record: string
  source_funding_account: string
  select_withdrawal_source: string
  disbursement_amount: string
  accounting_date: string
  ledger_records: string
  manual_ledger_allocation: string
  transaction_narrative_placeholder: string
  ledger_allocations: string
  add_line: string
  select_account: string
  line_description: string
  total_debit: string
  total_credit: string
  balanced: string
  out_of_balance: string
  financial_structure: string
  po_number: string
  order_items: string
  qty_short: string
  cost: string
  no_items_added: string
  estimated_total: string
  order_number: string
  placed_on: string
  unit_cost: string
  add_new_supplier: string
  quick_add_supplier_desc: string
  invoices_management: string
  manage_invoices_desc: string
  view_invoices_desc: string
  create_invoice: string
  search_invoices: string
  all_status: string
  overdue: string
  loading_invoices: string
  no_invoices_criteria: string
  edit_invoice: string
  create_new_invoice: string
  update_invoice_info: string
  enter_invoice_details: string
  saving: string
}

export const translations: Record<Language, TranslationKeys> = {
  en: {
    dashboard: "Dashboard",
    login: "Login",
    logout: "Logout",
    welcome: "Welcome",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    update: "Update",
    search: "Search",
    filter: "Filter",
    export: "Export",
    print: "Print",
    import: "Import",
    settings: "Settings",
    profile: "Profile",
    help: "Help",
    back: "Back",
    not_applicable: "N/A",
    next: "Next",
    previous: "Previous",
    close: "Close",
    confirm: "Confirm",
    view: "View",
    manage: "Manage",
    new: "New",
    read: "Read",
    unread: "Unread",
    mark: "Mark",
    recent: "Recent",
    latest: "Latest",
    generating: "Generating",
    generate: "Generate",
    details: "Details",
    download: "Download",
    refresh: "Refresh",
    unknown: "Unknown",
    overview: "Overview",
    month: "Month",
    months: "Months",
    total_sales: "Total Sales",
    pending_receivables: "Pending Receivables",
    pending_payables: "Pending Payables",
    revenue_overview: "Revenue Overview",
    recent_activity: "Recent Activity",
    welcome_back: "Welcome back",
    daily_summary: "Here is your daily summary.",
    online: "Online",
    sign_out: "Sign Out",
    active_employees: "Active Employees",
    operations: "Operations",
    management: "Management",
    finance: "Finance",
    accounting: "Accounting",
    hr: "Human Resources",
    crm: "CRM",
    pos: "Point of Sale",
    reporting: "Reporting",
    analytics: "Analytics",
    human_resources: "Human Resources",
    team_directory: "Team Directory",
    operations_desc: "Manage company operations.",
    finance_desc: "Financial management and accounting.",
    hr_desc: "Personnel and payroll management.",
    employee_portal: "Employee Portal",
    employee_portal_desc: "Access your assigned modules and tools.",
    your_permissions: "Your Permissions",
    full_access: "Full Access",
    view_only: "View Only",
    no_permissions: "No specific permissions assigned.",
    restricted_access: "Restricted Access",
    back_to_overview: "Back to Overview",
    receivables: "Receivables",
    payables: "Payables",
    general_reports: "General Reports",
    debt_management: "Debt Management",
    client_key: "Client Key",
    password: "Password",
    secure_login: "Secure Login",
    verifying: "Verifying...",
    enter_unique_key: "ENTER YOUR UNIQUE KEY",
    login_failed: "Login failed",
    error_occurred: "An error occurred. Please try again.",
    enterprise_access: "Enterprise Access",
    users: "Users",
    employees: "Employees",
    companies: "Companies",
    email: "Email",
    role: "Role",
    permissions: "Permissions",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    invoices: "Invoices",
    inventory: "Inventory",
    warehouses: "Warehouses",
    reports: "Reports",
    debts: "Debts",
    payments: "Payments",
    sales: "Sales",
    purchases: "Purchases",
    purchasing: "Purchasing",
    warehouse: "Warehouse",
    first_name: "First Name",
    last_name: "Last Name",
    position: "Position",
    department: "Department",
    hire_date: "Hire Date",
    salary: "Salary",
    employee_number: "Employee #",
    add_employee: "Add Employee",
    edit_employee: "Edit Employee",
    search_employees: "Search employees...",
    general_ledger: "General Ledger",
    chart_of_accounts: "Chart of Accounts",
    journal_entries: "Journal Entries",
    accounts_receivable: "Accounts Receivable",
    accounts_payable: "Accounts Payable",
    cash_bank: "Cash & Bank",
    fixed_assets: "Fixed Assets",
    hr_payroll: "HR & Payroll",
    tax_management: "Tax Management",
    financial_reports: "Financial Reports",
    total: "Total",
    amount: "Amount",
    price: "Price",
    date: "Date",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
    account: "Account",
    transaction: "Transaction",
    customer: "Customer",
    supplier: "Supplier",
    client: "Client",
    client_name: "Client Name",
    issue_date: "Issue Date",
    due_date: "Due Date",
    vendor: "Vendor",
    asset: "Asset",
    liability: "Liability",
    equity: "Equity",
    revenue: "Revenue",
    expense: "Expense",
    profit_loss: "Profit & Loss",
    vat: "VAT",
    tax_rule: "Tax Rule",
    tax_rate: "Tax Rate",
    payroll: "Payroll",
    payment_method: "Payment Method",
    invoice_number: "Invoice #",
    reference: "Reference",
    subtotal: "Subtotal",
    tax_amount: "Tax Amount",
    total_amount: "Total Amount",
    paid_amount: "Paid Amount",
    balance_due: "Balance Due",
    mark_as_paid: "Mark as Paid",
    post_to_gl: "Post to GL",
    unposted: "Unposted",
    posted: "Posted",
    items: "Items",
    item_name: "Item Name",
    item_code: "Item Code",
    category: "Category",
    quantity: "Quantity",
    unit_price: "Unit Price",
    stock_on_hand: "Stock On Hand",
    stock_adjustment: "Stock Adjustment",
    reorder_level: "Reorder Level",
    warehouse_name: "Warehouse Name",
    location: "Location",
    add_item: "Add Item",
    edit_item: "Edit Item",
    moving_stock: "Moving Stock",
    no_data: "No records found.",
    no_access: "Access Denied",
    operation_failed: "Operation failed",
    operation_successful: "Operation successful",
    search_placeholder: "Search anything...",
    select_placeholder: "Select an option",
    summary: "Summary",
    type: "Type",
    reason: "Reason",
    notes: "Notes",
    attendance: "Attendance",
    fingerprint_sync: "Fingerprint Sync",
    active_sessions: "Active Sessions",
    draft: "Draft",
    pending: "Pending",
    paid: "Paid",
    delivered: "Delivered",
    cancelled: "Cancelled",
    new_invoice: "New Invoice",
    accounting_modules: "Accounting Modules",
    accounting_modules_desc: "Manage your financial ecosystem.",
    success: "Success",
    error: "Error",
    alert: "Alert",
    action_required: "Action Required",
    info: "Information",
    description: "Description",
    name: "Name",
    confirm_delete: "Are you sure you want to delete this?",
    institutional: "Institutional",
    setup: "Setup",
    tier: "Tier",
    ledger: "Ledger",
    transparency: "Transparency",
    assessment: "Assessment",
    engine: "Engine",
    compliance: "Compliance",
    governance: "Governance",
    hierarchy: "Hierarchy",
    liquidity: "Liquidity",
    capital: "Capital",
    inflow: "Inflow",
    outflow: "Outflow",
    entry: "Entry",
    disbursement: "Disbursement",
    fulfillment: "Fulfillment",
    dossier: "Dossier",
    enrollment: "Enrollment",
    revision: "Revision",
    terminate: "Terminate",
    biometric: "Biometric",
    synchronization: "Synchronization",
    history: "History",
    filters: "Filters",
    rule: "Rule",
    currency_symbol: "EGP",
    net_vat_liability: "Net VAT Liability",
    estimated_corporate_tax: "Est. Corporate Tax",
    employment_tax: "Employment Tax",
    total_tax_owed: "Total Tax Owed",
    tax_breakdown: "Detailed Taxable Breakdown",
    income_vs_expenses: "Income vs. Deductible Expenses",
    taxable_revenue: "Total Taxable Revenue",
    output_vat: "Output VAT (Collected)",
    input_vat: "Input VAT (Claimable)",
    deductible_expenses: "Operational Deductibles",
    compliance_status: "Compliance Status",
    filing_ready: "Filing Ready",
    treasury: "Treasury",
    manufacturing: "Manufacturing",
    machines: "Machines",
    production_orders: "Production Orders",
    bill_of_materials: "Bill of Materials",
    maintenance: "Maintenance",
    audit_trails: "Audit Trails",
    entity_type: "Entity Type",
    old_value: "Old Value",
    new_value: "New Value",
    action_type: "Action",
    monitor_system_changes: "Monitor all system changes and historical data",
    search_logs: "Search logs...",
    no_logs_found: "No audit logs found for this period",
    account_recovery: "Account Recovery",
    reset_password: "Reset Password",
    new_secure_password: "New Secure Password",
    password_too_short: "Password is too short (min 6 characters)",
    confirm_overwrite: "Confirm Overwrite",
    abort: "Abort",
    global_report: "Global Report",
    treasury_management: "Treasury Management",
    manage_vault_and_reconciliation: "Manage your personal vault and shift reconciliation.",
    open_shift: "Open Shift",
    close_shift: "Close Shift",
    my_vault_status: "My Vault Status",
    current_balance: "Current Balance",
    opening: "Opening",
    started_at: "Started At",
    initiate_transfer: "Initiate Transfer",
    vault_transfer: "Vault Transfer",
    treasury_admin: "Treasury Administration",
    all_sessions: "All Sessions",
    active_shifts: "Active Shifts",
    open_for_user: "Open for User",
    conversion_rate: "Conversion Rate",
    bank_to_vault: "Bank to Vault",
    vault_to_bank: "Vault to Bank",
    invoice_to_vault: "Invoice to Vault",
    select_user: "Select User",
    select_currency: "Select Currency",
    rate: "Rate",
    pending_transfers: "Pending Transfers",
    sheet: "Sheet",
    movement: "Movement",
    protocol: "Protocol",
    commercial: "Commercial",
    security_logs: "Security & Logs",
    "security_&_logs": "Security & Logs",
    activity_log: "Activity Log",
    active_orders: "Active Orders",
    currently_in_production: "Currently in Production",
    machine_health: "Machine Health",
    quality_pass_rate: "Quality Pass Rate",
    historical_average: "Historical Average",
    maintenance_due: "Maintenance Due",
    units_require_attention: "Units Require Attention",
    active_production_monitor: "Active Production Monitor",
    real_time_stage_tracking: "Real-time stage tracking",
    no_active_production: "No active production runs detected",
    machine_activity: "Machine Activity",
    production_order_management: "Production Order Management Interface",
    refresh_registry: "Refresh Registry",
    asset_fleet_monitoring: "Asset & Fleet Monitoring Dashboard",
    bom_configuration_center: "Bill of Materials Configuration Center",
    production_intelligence: "Production Intelligence & Resource Planning",
    units: "Units",
    operational: "Operational",
    idle: "Idle",
    broken: "Broken",
    critical: "Critical",
    user_agent: "User Agent",
    in_progress: "In Progress",
    completed: "Completed",
    sales_invoices: "Sales Invoices",
    serial_number: "Serial Number",
    condition: "Condition",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    damaged: "Damaged",
    asset_history: "Asset History",
    view_dossier: "View Dossier",
    personnel_dossier: "Personnel Dossier",
    access_credentials: "Access Credentials",
    username: "Username",
    account_status: "Account Status",
    asset_code: "Asset Code",
    asset_name: "Asset Name",
    purchase_date: "Purchase Date",
    purchase_cost: "Purchase Cost",
    useful_life: "Useful Life (Years)",
    depreciation_method: "Depreciation Method",
    residual_value: "Residual Value",
    fixed_assets_management: "Fixed Assets Management",
    professional_asset_lifecycle: "Professional Asset Lifecycle & Automated Depreciation",
    run_depreciation: "Run Depreciation",
    new_asset: "New Asset",
    total_assets: "Total Assets",
    book_value: "Book Value",
    accumulated_depreciation: "Accumulated Depreciation",
    depreciation: "Depreciation",
    accumulated: "Accumulated",
    straight_line: "Straight-Line",
    declining_balance: "Declining Balance",
    pending_invoice_selection: "Pending Invoice Selection",
    target_deposit_account: "Target Deposit Account",
    authorize_inflow: "Authorize Inflow Entry",
    authorize_outflow: "Authorize Outflow Entry",
    locate_invoice: "Locate Invoice Record",
    select_destination_account: "Select Destination Account",
    add_invoice: "Add Invoice",
    purchasing_intelligence: "Purchasing Intelligence",
    supplier_invoice_workflow_desc: "Supplier invoices are generated during the Purchasing Workflow to ensure direct linkage with Received Goods.",
    purchasing_workflow: "Purchasing Workflow",
    received_goods: "Received Goods",
    system_intelligence: "System Intelligence",
    sales_invoice_integration_desc: "Sales Invoice operations are integrated within the Sales & Operations module for seamless stock handling.",
    treasury_integration_desc: "Payment records are managed within the Cash & Bank module for consolidated treasury reconciliation.",
    sales_operations: "Sales & Operations",
    record_payment: "Record Payment",
    receive_payment: "Receive Payment",
    capital_inflow_entry: "Capital Inflow Entry",
    issue_disbursement: "Issue Disbursement",
    capital_outflow_entry: "Capital Outflow Entry",
    enterprise_settings: "Enterprise Settings",
    institutional_identity: "Institutional Identity",
    branding: "Branding",
    contact_details: "Contact Details",
    commit_changes: "Commit Changes",
    received_this_month: "Received This Month",
    new_purchase_order: "New Purchase Order",
    receive_goods: "Receive Goods",
    tax_id: "Tax ID / VAT Number",
    website: "Website",
    address: "Address",
    phone: "Phone",
    display_name: "Display Name",
    currency: "Currency",
    security_rbac: "Security & RBAC",
    system_audit_logs: "System Audit Logs",
    treasury_liquidity_management: "Treasury & Liquidity Management",
    total_liquidity: "Total Liquidity",
    available_balance: "Available Balance",
    institutional_account_setup: "Institutional Account Setup",
    new_treasury_unit_config: "New Treasury Unit Configuration",
    entity_identifier: "Entity Identifier",
    liquidity_class: "Liquidity Class",
    commercial_bank: "Commercial Bank",
    internal_vault_petty: "Internal Vault / Petty",
    associated_bank: "Associated Bank",
    iban_reference: "Reference # / IBAN",
    initialize_treasury_account: "Initialize Treasury Account",
    ar_liquidation: "Accounts Receivable Liquidation",
    transfer_amount: "Transfer Amount",
    transaction_date: "Transaction Date",
    capital_disbursement: "Capital Disbursement",
    ap_fulfillment: "Accounts Payable Fulfillment",
    outstanding_liability: "Outstanding Liability",
    select_purchase_record: "Select Purchase Record",
    source_funding_account: "Source Funding Account",
    select_withdrawal_source: "Select Withdrawal Source",
    disbursement_amount: "Disbursement Amount",
    accounting_date: "Accounting Date",
    ledger_records: "Double-Entry Ledger Records",
    manual_ledger_allocation: "Manual Ledger Allocation",
    transaction_narrative_placeholder: "Enter transaction narrative...",
    ledger_allocations: "Ledger Allocations",
    add_line: "Add Line",
    select_account: "Select Account",
    line_description: "Line description...",
    total_debit: "Total Debit",
    total_credit: "Total Credit",
    balanced: "Balanced",
    out_of_balance: "Out of Balance",
    financial_structure: "Foundational Financial Structure",
    po_number: "PO #",
    order_items: "Order Items",
    qty_short: "Qty",
    cost: "Cost",
    no_items_added: "No items added",
    estimated_total: "Estimated Total",
    order_number: "Order #",
    placed_on: "Placed on",
    unit_cost: "Unit Cost",
    add_new_supplier: "Add New Supplier",
    quick_add_supplier_desc: "Quickly add a supplier to use in this order.",
    invoices_management: "Invoices Management",
    manage_invoices_desc: "Manage company invoices and billing",
    view_invoices_desc: "View company invoices",
    create_invoice: "Create Invoice",
    search_invoices: "Search invoices...",
    all_status: "All Status",
    overdue: "Overdue",
    loading_invoices: "Loading invoices...",
    no_invoices_criteria: "No invoices found matching your criteria.",
    edit_invoice: "Edit Invoice",
    create_new_invoice: "Create New Invoice",
    update_invoice_info: "Update invoice information",
    enter_invoice_details: "Enter the details for the new invoice",
    saving: "Saving..."
  },
  ar: {
    dashboard: "لوحة التحكم",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    welcome: "مرحباً",
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    create: "إنشاء",
    update: "تحديث",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    print: "طباعة",
    import: "استيراد",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    help: "مساعدة",
    back: "رجوع",
    not_applicable: "غير ينطبق",
    next: "التالي",
    previous: "السابق",
    close: "إغلاق",
    confirm: "تأكيد",
    view: "عرض",
    manage: "إدارة",
    new: "جديد",
    read: "مقروء",
    unread: "غير مقروء",
    mark: "تحديد",
    recent: "الأخيرة",
    latest: "الأحدث",
    generating: "جاري الإنشاء",
    generate: "إنشاء",
    details: "التفاصيل",
    download: "تحميل",
    refresh: "تحديث",
    unknown: "غير معروف",
    overview: "نظرة عامة",
    month: "شهر",
    months: "أشهر",
    total_sales: "إجمالي المبيعات",
    pending_receivables: "مستحقات معلقة",
    pending_payables: "مدفوعات معلقة",
    revenue_overview: "نظرة عامة على الإيرادات",
    recent_activity: "النشاط الأخير",
    welcome_back: "مرحباً بعودتك",
    daily_summary: "إليك ملخصك اليومي.",
    online: "متصل",
    sign_out: "تسجيل الخروج",
    active_employees: "الموظفون النشطون",
    operations: "العمليات",
    management: "الإدارة",
    finance: "المالية",
    accounting: "المحاسبة",
    hr: "الموارد البشرية",
    crm: "إدارة العملاء",
    pos: "نقاط البيع",
    reporting: "التقارير",
    analytics: "التحليلات",
    human_resources: "الموارد البشرية",
    team_directory: "دليل الفريق",
    operations_desc: "إدارة عمليات الشركة.",
    finance_desc: "الإدارة المالية والمحاسبة.",
    hr_desc: "إدارة الموظفين والرواتب.",
    employee_portal: "بوابة الموظف",
    employee_portal_desc: "الوصول إلى الوحدات والأدوات المخصصة لك.",
    your_permissions: "صلاحياتك",
    full_access: "وصول كامل",
    view_only: "عرض فقط",
    no_permissions: "لا توجد صلاحيات محددة.",
    restricted_access: "وصول مقيد",
    back_to_overview: "الرجوع للنظرة العامة",
    receivables: "الحسابات المدينة",
    payables: "الحسابات الدائنة",
    general_reports: "التقارير العامة",
    debt_management: "إدارة الديون",
    client_key: "مفتاح العميل",
    password: "كلمة المرور",
    secure_login: "تسجيل دخول آمن",
    verifying: "جاري التحقق...",
    enter_unique_key: "أدخل مفتاحك الفريد",
    login_failed: "فشل تسجيل الدخول",
    error_occurred: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    enterprise_access: "وصول المؤسسة",
    users: "المستخدمين",
    employees: "الموظفين",
    companies: "الشركات",
    email: "البريد الإلكتروني",
    role: "الدور",
    permissions: "الصلاحيات",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    invoices: "الفواتير",
    inventory: "المخزون",
    warehouses: "المستودعات",
    reports: "التقارير",
    debts: "الديون",
    payments: "المدفوعات",
    sales: "المبيعات",
    purchases: "المشتريات",
    purchasing: "المشتريات",
    warehouse: "المستودع",
    first_name: "الاسم الأول",
    last_name: "اسم العائلة",
    position: "المسمى الوظيفي",
    department: "القسم",
    hire_date: "تاريخ التعيين",
    salary: "الراتب",
    employee_number: "رقم الموظف",
    add_employee: "إضافة موظف",
    edit_employee: "تعديل موظف",
    search_employees: "البحث عن موظفين...",
    general_ledger: "دفتر الأستاذ العام",
    chart_of_accounts: "شجرة الحسابات",
    journal_entries: "قيود اليومية",
    accounts_receivable: "الحسابات المدينة",
    accounts_payable: "الحسابات الدائنة",
    cash_bank: "النقدية والبنوك",
    fixed_assets: "الأصول الثابتة",
    hr_payroll: "الموارد البشرية والرواتب",
    tax_management: "إدارة الضرائب",
    financial_reports: "التقارير المالية",
    total: "الإجمالي",
    amount: "المبلغ",
    price: "السعر",
    date: "التاريخ",
    debit: "مدين",
    credit: "دائن",
    balance: "الرصيد",
    account: "الحساب",
    transaction: "المعاملة",
    customer: "العميل",
    supplier: "المورد",
    client: "العميل",
    client_name: "اسم العميل",
    issue_date: "تاريخ الإصدار",
    due_date: "تاريخ الاستحقاق",
    vendor: "البائع",
    asset: "أصل",
    liability: "التزام",
    equity: "حقوق ملكية",
    revenue: "إيرادات",
    expense: "مصروفات",
    profit_loss: "الأرباح والخسائر",
    vat: "ضريبة القيمة المضافة",
    tax_rule: "قاعدة ضريبية",
    tax_rate: "معدل الضريبة",
    payroll: "كشف الرواتب",
    payment_method: "طريقة الدفع",
    invoice_number: "رقم الفاتورة",
    reference: "المرجع",
    subtotal: "الإجمالي الفرعي",
    tax_amount: "مبلغ الضريبة",
    total_amount: "المبلغ الإجمالي",
    paid_amount: "المبلغ المدفوع",
    balance_due: "الرصيد المستحق",
    mark_as_paid: "تحديد كمدفوع",
    post_to_gl: "ترحيل للأستاذ العام",
    unposted: "غير مرحل",
    posted: "مرحل",
    items: "الأصناف",
    item_name: "اسم الصنف",
    item_code: "كود الصنف",
    category: "الفئة",
    quantity: "الكمية",
    unit_price: "سعر الوحدة",
    stock_on_hand: "المخزون المتوفر",
    stock_adjustment: "تسوية المخزون",
    reorder_level: "حد إعادة الطلب",
    warehouse_name: "اسم المستودع",
    location: "الموقع",
    add_item: "إضافة صنف",
    edit_item: "تعديل صنف",
    moving_stock: "نقل المخزون",
    no_data: "لا توجد سجلات.",
    no_access: "تم رفض الوصول",
    operation_failed: "فشلت العملية",
    operation_successful: "تمت العملية بنجاح",
    search_placeholder: "بحث عن أي شيء...",
    select_placeholder: "اختر خياراً",
    summary: "ملخص",
    type: "النوع",
    reason: "السبب",
    notes: "ملاحظات",
    attendance: "الحضور",
    fingerprint_sync: "مزامنة البصمة",
    active_sessions: "الجلسات النشطة",
    draft: "مسودة",
    pending: "قيد الانتظار",
    paid: "تم الدفع",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    new_invoice: "فاتورة جديدة",
    accounting_modules: "وحدات المحاسبة",
    accounting_modules_desc: "إدارة نظامك المالي.",
    success: "تم بنجاح",
    error: "خطأ",
    alert: "تنبيه",
    action_required: "إجراء مطلوب",
    info: "معلومات",
    description: "الوصف",
    name: "الاسم",
    confirm_delete: "هل أنت متأكد من الحذف؟",
    institutional: "مؤسسي",
    setup: "إعداد",
    tier: "فئة",
    ledger: "سجل",
    transparency: "شفافية",
    assessment: "تقييم",
    engine: "محرك",
    compliance: "امتثال",
    governance: "حوكمة",
    hierarchy: "هيكلية",
    liquidity: "سيولة",
    capital: "رأس المال",
    inflow: "تدفق داخل",
    outflow: "تدفق خارج",
    entry: "قيد",
    disbursement: "صرف",
    fulfillment: "وفاء",
    dossier: "ملف",
    enrollment: "تسجيل",
    revision: "مراجعة",
    terminate: "إنهاء",
    biometric: "بيومتري",
    synchronization: "مزامنة",
    history: "السجل",
    filters: "تصفية",
    rule: "قاعدة",
    currency_symbol: "ج.م",
    net_vat_liability: "صافي التزام الضريبة",
    estimated_corporate_tax: "ضريبة الشركات المقدرة",
    employment_tax: "ضريبة التوظيف",
    total_tax_owed: "إجمالي الضريبة المستحقة",
    tax_breakdown: "تفصيل ضريبي دقيق",
    income_vs_expenses: "الدخل مقابل المصاريف",
    taxable_revenue: "إجمالي الإيرادات الخاضعة للضريبة",
    output_vat: "ضريبة المخرجات (المحصلة)",
    input_vat: "ضريبة المدخلات (المطالب بها)",
    deductible_expenses: "المصاريف القابلة للخصم",
    compliance_status: "حالة الامتثال",
    filing_ready: "جاهز للتقديم",
    treasury: "الخزينة",
    manufacturing: "التصنيع",
    machines: "الآلات",
    production_orders: "أوامر الإنتاج",
    bill_of_materials: "قائمة المواد",
    maintenance: "الصيانة",
    audit_trails: "سجلات التدقيق",
    entity_type: "نوع الكيان",
    old_value: "القيمة القديمة",
    new_value: "القيمة الجديدة",
    action_type: "الإجراء",
    monitor_system_changes: "مراقبة كافة تغييرات النظام والبيانات التاريخية",
    search_logs: "البحث في السجلات...",
    no_logs_found: "لم يتم العثور على سجلات تدقيق لهذه الفترة",
    account_recovery: "استعادة الحساب",
    reset_password: "إعادة تعيين كلمة المرور",
    new_secure_password: "كلمة مرور جديدة آمنة",
    password_too_short: "كلمة المرور قصيرة جداً (6 أحرف على الأقل)",
    confirm_overwrite: "تأكيد الاستبدال",
    abort: "إلغاء",
    global_report: "تقرير عالمي",
    treasury_management: "إدارة الخزينة",
    manage_vault_and_reconciliation: "إدارة خزنتك الشخصية وتسوية الوردية.",
    open_shift: "فتح وردية",
    close_shift: "إغلاق وردية",
    my_vault_status: "حالة خزنتي",
    current_balance: "الرصيد الحالي",
    opening: "الافتتاح",
    started_at: "بدأ في",
    initiate_transfer: "البدء في التحويل",
    vault_transfer: "تحويل خزينة",
    treasury_admin: "إدارة الخزائن",
    all_sessions: "جميع الجلسات",
    active_shifts: "الورديات النشطة",
    open_for_user: "فتح لمستخدم",
    conversion_rate: "سعر التحويل",
    bank_to_vault: "من البنك إلى الخزينة",
    vault_to_bank: "من الخزينة إلى البنك",
    invoice_to_vault: "من الفاتورة إلى الخزينة",
    select_user: "اختر المستخدم",
    select_currency: "اختر العملة",
    rate: "السعر",
    pending_transfers: "تحويلات معلقة",
    sheet: "كشف",
    movement: "حركة",
    protocol: "بروتوكول",
    commercial: "تجاري",
    security_logs: "الأمن والسجلات",
    "security_&_logs": "الأمن والسجلات",
    activity_log: "سجل الأنشطة",
    active_orders: "الطلبات النشطة",
    currently_in_production: "قيد الإنتاج حالياً",
    machine_health: "صحة الآلة",
    quality_pass_rate: "معدل اجتياز الجودة",
    historical_average: "المعدل التاريخي",
    maintenance_due: "استحقاق الصيانة",
    units_require_attention: "وحدات تتطلب اهتماماً",
    active_production_monitor: "مراقب الإنتاج النشط",
    real_time_stage_tracking: "تتبع المراحل في الوقت الفعلي",
    no_active_production: "لم يتم اكتشاف عمليات إنتاج نشطة",
    machine_activity: "نشاط الآلات",
    production_order_management: "واجهة إدارة أوامر الإنتاج",
    refresh_registry: "تحديث السجل",
    asset_fleet_monitoring: "لوحة مراقبة الأصول والأسطول",
    bom_configuration_center: "مركز تهيئة قائمة المواد",
    production_intelligence: "ذكاء الإنتاج وتخطيط الموارد",
    units: "الوحدات",
    operational: "تشغيلي",
    idle: "خامل",
    broken: "معطل",
    critical: "حرج",
    user_agent: "وكيل المستخدم",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    sales_invoices: "فواتير المبيعات",
    serial_number: "الرقم التسلسلي",
    condition: "الحالة",
    good: "جيد",
    fair: "متوسط",
    poor: "سيئ",
    damaged: "تالف",
    asset_history: "سجل الأصل",
    view_dossier: "عرض الملف",
    personnel_dossier: "الملف الشخصي للموظف",
    access_credentials: "بيانات الوصول",
    username: "اسم المستخدم",
    account_status: "حالة الحساب",
    asset_code: "كود الأصل",
    asset_name: "اسم الأصل",
    purchase_date: "تاريخ الشراء",
    purchase_cost: "تكلفة الشراء",
    useful_life: "العمر الافتراضي (سنوات)",
    depreciation_method: "طريقة الإهلاك",
    residual_value: "القيمة المتبقية (الخردة)",
    fixed_assets_management: "إدارة الأصول الثابتة",
    professional_asset_lifecycle: "دورة حياة الأصول الاحترافية والإهلاك الآلي",
    run_depreciation: "تشغيل الإهلاك",
    new_asset: "أصل جديد",
    total_assets: "إجمالي الأصول",
    book_value: "القيمة الدفترية",
    accumulated_depreciation: "مجمع الإهلاك",
    depreciation: "الإهلاك",
    accumulated: "المتراكم",
    straight_line: "القسط الثابت",
    declining_balance: "الرصيد المتناقص",
    pending_invoice_selection: "اختيار الفواتير المعلقة",
    target_deposit_account: "حساب الإيداع المستهدف",
    authorize_inflow: "اعتماد حركة الوارد",
    authorize_outflow: "اعتماد حركة المنصرف",
    locate_invoice: "البحث عن سجل الفاتورة",
    select_destination_account: "اختر حساب الوجهة",
    add_invoice: "إضافة فاتورة",
    purchasing_intelligence: "ذكاء المشتريات",
    supplier_invoice_workflow_desc: "يتم إنشاء فواتير الموردين خلال سير عمل المشتريات لضمان الربط المباشر مع البضائع المستلمة.",
    purchasing_workflow: "سير عمل المشتريات",
    received_goods: "البضائع المستلمة",
    system_intelligence: "ذكاء النظام",
    sales_invoice_integration_desc: "عمليات فواتير المبيعات مدمجة ضمن وحدة المبيعات والعمليات لضمان مناولة مخزنية سلسة.",
    treasury_integration_desc: "يتم إدارة سجلات الدفع ضمن وحدة النقدية والبنوك لضمان تسوية موحدة للخزينة.",
    sales_operations: "المبيعات والعمليات",
    record_payment: "تسجيل دفعة",
    receive_payment: "استلام دفعة",
    capital_inflow_entry: "قيد تدفقات نقدية داخلة",
    issue_disbursement: "صرف دفعة",
    capital_outflow_entry: "قيد تدفقات نقدية خارجة",
    enterprise_settings: "إعدادات المؤسسة",
    institutional_identity: "الهوية المؤسسية",
    branding: "الهوية البصرية",
    contact_details: "تفاصيل الاتصال",
    commit_changes: "اعتماد التغييرات",
    received_this_month: "المستلم هذا الشهر",
    new_purchase_order: "طلب شراء جديد",
    receive_goods: "استلام بضائع",
    tax_id: "الرقم الضريبي",
    website: "الموقع الإلكتروني",
    address: "العنوان",
    phone: "الهاتف",
    display_name: "اسم العرض",
    currency: "العملة",
    security_rbac: "الأمن وصلاحيات الوصول",
    system_audit_logs: "سجلات تدقيق النظام",
    treasury_liquidity_management: "إدارة الخزينة والسيولة",
    total_liquidity: "إجمالي السيولة",
    available_balance: "الرصيد المتوفر",
    institutional_account_setup: "إعداد حساب مؤسسي",
    new_treasury_unit_config: "تهيئة وحدة خزينة جديدة",
    entity_identifier: "معرف الكيان",
    liquidity_class: "فئة السيولة",
    commercial_bank: "بنك تجاري",
    internal_vault_petty: "خزينة داخلية / نقدية صغيرة",
    associated_bank: "البنك المرتبط",
    iban_reference: "رقم المرجع / IBAN",
    initialize_treasury_account: "بدء حساب الخزينة",
    ar_liquidation: "تصفية الحسابات المدينة",
    transfer_amount: "مبلغ التحويل",
    transaction_date: "تاريخ المعاملة",
    capital_disbursement: "صرف رأس المال",
    ap_fulfillment: "وفاء الحسابات الدائنة",
    outstanding_liability: "الالتزامات المستحقة",
    select_purchase_record: "اختر سجل الشراء",
    source_funding_account: "حساب التمويل المصدر",
    select_withdrawal_source: "اختر مصدر السحب",
    disbursement_amount: "مبلغ الصرف",
    accounting_date: "التاريخ المحاسبي",
    ledger_records: "سجلات دفتر الأستاذ مزدوج القيد",
    manual_ledger_allocation: "تخصيص يدوي لدفتر الأستاذ",
    transaction_narrative_placeholder: "أدخل شرح المعاملة...",
    ledger_allocations: "تخصيصات دفتر الأستاذ",
    add_line: "إضافة سطر",
    select_account: "اختر الحساب",
    line_description: "وصف السطر...",
    total_debit: "إجمالي المدين",
    total_credit: "إجمالي الدائن",
    balanced: "متوازن",
    out_of_balance: "غير متوازن",
    financial_structure: "الهيكل المالي الأساسي",
    po_number: "رقم طلب الشراء",
    order_items: "أصناف الطلب",
    qty_short: "الكمية",
    cost: "التكلفة",
    no_items_added: "لم يتم إضافة أصناف",
    estimated_total: "الإجمالي التقديري",
    order_number: "رقم الطلب",
    placed_on: "تم وضعه في",
    unit_cost: "تكلفة الوحدة",
    add_new_supplier: "إضافة مورد جديد",
    quick_add_supplier_desc: "إضافة مورد بسرعة لاستخدامه في هذا الطلب.",
    invoices_management: "إدارة الفواتير",
    manage_invoices_desc: "إدارة فواتير الشركة والفوترة",
    view_invoices_desc: "عرض فواتير الشركة",
    create_invoice: "إنشاء فاتورة",
    search_invoices: "البحث في الفواتير...",
    all_status: "كل الحالات",
    overdue: "متأخر",
    loading_invoices: "جاري تحميل الفواتير...",
    no_invoices_criteria: "لم يتم العثور على فواتير تطابق معاييرك.",
    edit_invoice: "تعديل الفاتورة",
    create_new_invoice: "إنشاء فاتورة جديدة",
    update_invoice_info: "تحديث معلومات الفاتورة",
    enter_invoice_details: "أدخل تفاصيل الفاتورة الجديدة",
    saving: "جاري الحفظ..."
  }
}

export const getTranslation = (key: keyof TranslationKeys, lang: Language) => {
  return translations[lang][key] || key
}

export const useTranslation = (lang: Language = "en") => {
  const t = (key: keyof TranslationKeys) => translations[lang][key] || key
  return { t, isRTL: lang === "ar" }
}
