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
  import: string
  settings: string
  profile: string
  help: string
  back: string
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
  due_date: string
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
}

const translations: Record<Language, TranslationKeys> = {
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
    import: "Import",
    settings: "Settings",
    profile: "Profile",
    help: "Help",
    back: "Back",
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
    due_date: "Due Date",
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
    account_recovery: "Account Recovery",
    reset_password: "Reset Password",
    new_secure_password: "New Secure Password",
    password_too_short: "Password is too short (min 6 characters)",
    confirm_overwrite: "Confirm Overwrite",
    abort: "Abort"
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
    import: "استيراد",
    settings: "الإعدادات",
    profile: "الملف الشخصي",
    help: "مساعدة",
    back: "رجوع",
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
    recent: "حديث",
    latest: "الأحدث",
    generating: "جاري الإنشاء",
    generate: "إنشاء",
    details: "التفاصيل",
    download: "تحميل",
    refresh: "تحديث",
    overview: "نظرة عامة",
    month: "شهر",
    months: "أشهر",
    total_sales: "إجمالي المبيعات",
    pending_receivables: "مقبوضات معلقة",
    pending_payables: "مدفوعات معلقة",
    revenue_overview: "نظرة عامة على الإيرادات",
    recent_activity: "النشاط الأخير",
    welcome_back: "مرحباً بك من جديد",
    daily_summary: "هذا هو ملخصك اليومي.",
    online: "متصل",
    sign_out: "تسجيل الخروج",
    active_employees: "الموظفين النشطين",
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
    hr_desc: "إدارة الأفراد والرواتب.",
    employee_portal: "بوابة الموظف",
    employee_portal_desc: "الوصول إلى الوحدات والأدوات المخصصة لك.",
    your_permissions: "صلاحياتك",
    full_access: "وصول كامل",
    view_only: "عرض فقط",
    no_permissions: "لا توجد صلاحيات محددة.",
    restricted_access: "وصول مقيد",
    back_to_overview: "العودة للنظرة العامة",
    receivables: "المقبوضات",
    payables: "المدفوعات",
    general_reports: "التقارير العامة",
    debt_management: "إدارة الديون",
    client_key: "مفتاح العميل",
    password: "كلمة المرور",
    secure_login: "دخول آمن",
    verifying: "جاري التحقق...",
    enter_unique_key: "أدخل مفتاحك الفريد",
    login_failed: "فشل تسجيل الدخول",
    error_occurred: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    enterprise_access: "وصول المؤسسة",
    users: "المستخدمون",
    employees: "الموظفون",
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
    warehouse: "مستودع",
    first_name: "الاسم الأول",
    last_name: "الاسم الأخير",
    position: "المسمى الوظيفي",
    department: "القسم",
    hire_date: "تاريخ التعيين",
    salary: "الراتب",
    employee_number: "رقم الموظف",
    add_employee: "إضافة موظف",
    edit_employee: "تعديل موظف",
    search_employees: "بحث الموظفين...",
    general_ledger: "دفتر الأستاذ العام",
    chart_of_accounts: "دليل الحسابات",
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
    account: "حساب",
    transaction: "معاملة",
    customer: "عميل",
    supplier: "مورد",
    vendor: "بائع",
    asset: "أصل",
    liability: "التزام",
    equity: "حقوق الملكية",
    revenue: "إيراد",
    expense: "مصروف",
    profit_loss: "الأرباح والخسائر",
    vat: "القيمة المضافة",
    tax_rule: "قاعدة ضريبية",
    tax_rate: "معدل الضريبة",
    payroll: "كشف الرواتب",
    due_date: "تاريخ الاستحقاق",
    payment_method: "طريقة الدفع",
    invoice_number: "رقم الفاتورة",
    reference: "مرجع",
    subtotal: "الإجمالي الفرعي",
    tax_amount: "مبلغ الضريبة",
    total_amount: "الإجمالي الكلي",
    paid_amount: "المبلغ المدفوع",
    balance_due: "الرصيد المستحق",
    mark_as_paid: "تحديد كمدفوع",
    post_to_gl: "ترحيل للحسابات",
    items: "العناصر",
    item_name: "اسم العنصر",
    item_code: "كود العنصر",
    category: "الفئة",
    quantity: "الكمية",
    unit_price: "سعر الوحدة",
    stock_on_hand: "المخزون المتوفر",
    stock_adjustment: "تعديل المخزون",
    reorder_level: "مستوى إعادة الطلب",
    warehouse_name: "اسم المستودع",
    location: "الموقع",
    add_item: "إضافة عنصر",
    edit_item: "تعديل عنصر",
    moving_stock: "حركة المخزون",
    no_data: "لم يتم العثور على سجلات.",
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
    paid: "مدفوع",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    new_invoice: "فاتورة جديدة",
    accounting_modules: "وحدات المحاسبة",
    accounting_modules_desc: "إدارة النظام المالي الخاص بك.",
    success: "نجاح",
    error: "خطأ",
    alert: "تنبيه",
    action_required: "إجراء مطلوب",
    info: "معلومات",
    description: "الوصف",
    name: "الاسم",
    confirm_delete: "هل أنت متأكد أنك تريد الحذف؟",
    institutional: "مؤسسي",
    setup: "إعداد",
    tier: "طبقة",
    ledger: "سجل",
    transparency: "شفافية",
    assessment: "تقييم",
    engine: "محرك",
    compliance: "امتثال",
    governance: "حوكمة",
    hierarchy: "هيكل",
    liquidity: "سيولة",
    capital: "رأس مال",
    inflow: "تدفق وراد",
    outflow: "تدفق صادر",
    entry: "قيد",
    disbursement: "صرف",
    fulfillment: "تلبية",
    dossier: "ملف",
    enrollment: "تسجيل",
    revision: "مراجعة",
    terminate: "إنهاء",
    biometric: "بيومتري",
    synchronization: "مزامنة",
    history: "التاريخ",
    filters: "تصفية",
    rule: "قاعدة",
    currency_symbol: "ج.م",
    net_vat_liability: "إجمالي ضريبة القيمة المضافة",
    estimated_corporate_tax: "ضريبة دخل الشركات (تقديرية)",
    employment_tax: "ضريبة كسب العمل",
    total_tax_owed: "إجمالي الضرائب المستحقة",
    tax_breakdown: "تفاصيل التحليل الضريبي",
    income_vs_expenses: "الدخل مقابل المصروفات القابلة للخصم",
    taxable_revenue: "إجمالي الإيرادات الخاضعة للضريبة",
    output_vat: "ضريبة المخرجات (المحصلة)",
    input_vat: "ضريبة المدخلات (المخصومة)",
    deductible_expenses: "المصروفات التشغيلية المخصومة",
    compliance_status: "حالة الامتثال الضريبي",
    filing_ready: "جاهز لتقديم الإقرار",
    account_recovery: "استرداد الحساب",
    reset_password: "إعادة تعيين كلمة المرور",
    new_secure_password: "كلمة مرور آمنة جديدة",
    password_too_short: "كلمة المرور قصيرة جداً (6 أحرف على الأقل)",
    confirm_overwrite: "تأكيد الاستبدال",
    abort: "إجهاض"
  }
}

export function getTranslation(key: keyof TranslationKeys, language: Language = "en"): string {
  return translations[language][key] || translations.en[key] || key
}

export function t(key: keyof TranslationKeys, language?: Language): string {
  return getTranslation(key, language)
}

export default translations
