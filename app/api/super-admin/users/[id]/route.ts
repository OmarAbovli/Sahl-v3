import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["super_admin"])
    const userId = Number(params.id)
    if (!userId) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `
    if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ user: users[0] })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["super_admin"])
    const userId = Number(params.id)
    if (!userId) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    const body = await request.json()
    const fields: string[] = []
    const values: any[] = []
    if (body.email !== undefined) {
      fields.push("email = ",)
      values.push(body.email)
    }
    if (body.role !== undefined) {
      fields.push("role = ")
      values.push(body.role)
    }
    if (body.permissions !== undefined) {
      fields.push("permissions = ")
      values.push(JSON.stringify(body.permissions))
    }
    if (body.is_active !== undefined) {
      fields.push("is_active = ")
      values.push(body.is_active)
    }
    if (body.expires_at !== undefined) {
      fields.push("expires_at = ")
      values.push(body.expires_at)
    }
    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    // Build SQL update statement
    const setClause = fields.map((f, i) => `${f} $${i + 1}`).join(", ")
    const result = await sql.unsafe(
      `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, unique_key, email, role, company_id, permissions, expires_at, is_active, created_at`,
      ...values,
      userId
    )
    if (result.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true, user: result[0] })
  } catch (error) {
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["super_admin"])
    const userId = Number(params.id)
    if (!userId) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    // Soft delete: set is_active = false
    const result = await sql`
      UPDATE users SET is_active = false WHERE id = ${userId} RETURNING id
    `
    if (result.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 })
  }
} 