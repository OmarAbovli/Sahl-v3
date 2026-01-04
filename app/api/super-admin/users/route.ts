import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { hashPassword, generateUniqueKey } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    await requireAuth(["super_admin"])

    const users = await sql`
      SELECT u.*, c.display_name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.role != 'super_admin'
      ORDER BY u.created_at DESC
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["super_admin"])

    const { email, password, role, companyId, expiresAt, permissions } = await request.json()

    console.log("Creating user with data:", { email, role, companyId, expiresAt })

    if (!email || !password || !role || !companyId) {
      return NextResponse.json({ error: "Email, password, role, and company are required" }, { status: 400 })
    }

    // Get company name for unique key generation
    const company = await sql`
      SELECT name FROM companies WHERE id = ${companyId}
    `

    if (company.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 })
    }

    console.log("Found company:", company[0])

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Generate unique key and hash password
    const uniqueKey = await generateUniqueKey(company[0].name, role)
    const passwordHash = await hashPassword(password)

    console.log("Generated unique key:", uniqueKey)

    const result = await sql`
      INSERT INTO users (
        unique_key, email, password_hash, company_id, role, 
        permissions, expires_at, is_active
      )
      VALUES (
        ${uniqueKey}, ${email}, ${passwordHash}, ${companyId}, ${role},
        ${JSON.stringify(permissions || {})}, ${expiresAt || null}, true
      )
      RETURNING id, unique_key, email, role, company_id, permissions, expires_at, is_active, created_at
    `

    console.log("User created successfully:", result[0])

    // Remove password hash from response
    const user = result[0]

    return NextResponse.json({
      success: true,
      user,
      uniqueKey, // Make sure to return the unique key
      message: `User created successfully. Unique key: ${uniqueKey}`,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 })
  }
}
