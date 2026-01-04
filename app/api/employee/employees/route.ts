import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "view_employees")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const employees = await sql`
      SELECT * FROM employees 
      WHERE company_id = ${user.company_id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ employees })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_employees")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (!user.company_id) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    const { employee_number, first_name, last_name, position, department, salary, hire_date } = await request.json()

    if (!employee_number || !first_name || !last_name) {
      return NextResponse.json({ error: "Employee number, first name, and last name are required" }, { status: 400 })
    }

    // Check if employee number already exists in this company
    const existing = await sql`
      SELECT id FROM employees 
      WHERE company_id = ${user.company_id} AND employee_number = ${employee_number}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Employee number already exists" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO employees (
        company_id, employee_number, first_name, last_name, 
        position, department, salary, hire_date
      )
      VALUES (
        ${user.company_id}, ${employee_number}, ${first_name}, ${last_name},
        ${position || null}, ${department || null}, ${salary ? Number.parseFloat(salary) : null}, ${hire_date || null}
      )
      RETURNING *
    `

    return NextResponse.json({ employee: result[0] })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
