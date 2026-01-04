import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { uniqueKey, password } = await request.json()

    // Step 1: Check if user exists
    const users = await sql`
      SELECT * FROM users WHERE unique_key = ${uniqueKey}
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        step: "user_lookup",
        message: "User not found",
        debug: { uniqueKey },
      })
    }

    const user = users[0]

    // Step 2: Check user status
    const isActive = user.is_active
    const isExpired = user.expires_at ? new Date(user.expires_at) <= new Date() : false

    if (!isActive) {
      return NextResponse.json({
        success: false,
        step: "user_status",
        message: "User is inactive",
        debug: { isActive, isExpired },
      })
    }

    if (isExpired) {
      return NextResponse.json({
        success: false,
        step: "user_status",
        message: "User is expired",
        debug: { isActive, isExpired, expiresAt: user.expires_at },
      })
    }

    // Step 3: Test password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    return NextResponse.json({
      success: passwordMatch,
      step: "password_verification",
      message: passwordMatch ? "Authentication successful" : "Password mismatch",
      debug: {
        uniqueKey: user.unique_key,
        email: user.email,
        role: user.role,
        isActive,
        isExpired,
        passwordMatch,
        passwordHashLength: user.password_hash?.length || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      step: "error",
      message: error.message,
      debug: { error: error.toString() },
    })
  }
}
