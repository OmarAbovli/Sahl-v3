import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

const sql = neon(process.env.DATABASE_URL)

export { sql }

export interface User {
  id: number
  unique_key: string
  email: string
  company_id?: number
  role: "super_admin" | "company_admin" | "employee"
  permissions: Record<string, boolean>
  expires_at?: string
  is_active: boolean
  last_login?: string
}

export interface Company {
  id: number
  name: string
  display_name: string
  created_at: string
  is_active: boolean
}

export interface Employee {
  id: number
  company_id: number
  user_id?: number
  employee_number: string
  first_name: string
  last_name: string
  position?: string
  department?: string
  salary?: number
  hire_date?: string
  warehouse_id?: number
  is_active: boolean
}

export interface Warehouse {
  id: number
  company_id: number
  name: string
  location?: string
  manager_id?: number
  is_active: boolean
}

export interface Invoice {
  id: number
  company_id: number
  invoice_number: string
  client_name?: string
  amount: number
  status: "pending" | "paid" | "overdue"
  issue_date: string
  due_date: string
  created_by?: number
}

export interface InventoryItem {
  id: number
  company_id: number
  warehouse_id: number
  item_name: string
  item_code?: string
  quantity: number
  unit_price?: number
  category?: string
}

export interface SupportTicket {
  id: number
  company_id: number
  created_by: number
  subject: string
  message: string
  status: "open" | "in_progress" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
}

export interface Debt {
  id: number
  company_id: number
  debtor_name: string
  debtor_type: "individual" | "company"
  debtor_contact?: string
  invoice_id?: number
  original_amount: number
  remaining_amount: number
  sale_date: string
  due_date?: string
  last_payment_date?: string
  last_payment_amount: number
  status: "active" | "paid" | "overdue" | "written_off"
  notes?: string
  created_by?: number
  created_at: string
}

export interface DebtPayment {
  id: number
  company_id: number
  debt_id: number
  payment_amount: number
  payment_date: string
  payment_method?: string
  reference_number?: string
  notes?: string
  recorded_by?: number
  created_at: string
}
