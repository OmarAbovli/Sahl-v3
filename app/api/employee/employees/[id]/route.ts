import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"
import { checkPermission } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_employees")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const employeeId = Number.parseInt(params.id)
    const { employee_number, first_name, last_name, position, department, salary, hire_date } = await request.json()

    // Verify the employee belongs to the user's company
    const employeeCheck = await sql`
      SELECT id FROM employees 
      WHERE id = ${employeeId} AND company_id = ${user.company_id}
    `

    if (employeeCheck.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const result = await sql`
      UPDATE employees 
      SET 
        employee_number = ${employee_number},
        first_name = ${first_name},
        last_name = ${last_name},
        position = ${position || null},
        department = ${department || null},
        salary = ${salary ? Number.parseFloat(salary) : null},
        hire_date = ${hire_date || null},
        updated_at = NOW()
      WHERE id = ${employeeId}
      RETURNING *
    `

    return NextResponse.json({ employee: result[0] })
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(["employee", "company_admin"])

    if (!checkPermission(user, "manage_employees")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const employeeId = Number.parseInt(params.id)

    // Verify the employee belongs to the user's company
    const employeeCheck = await sql`
      SELECT id FROM employees 
      WHERE id = ${employeeId} AND company_id = ${user.company_id}
    `

    if (employeeCheck.length === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    await sql`
      DELETE FROM employees WHERE id = ${employeeId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
