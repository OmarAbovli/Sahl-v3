import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { createSession } from "@/lib/session"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { uniqueKey, password } = await request.json()

    console.log("Login attempt:", { uniqueKey, passwordLength: password?.length })

    if (!uniqueKey || !password) {
      return NextResponse.json({ error: "Unique key and password are required" }, { status: 400 })
    }

    // First, let's check if the user exists at all
    const userCheck = await db.query.users.findFirst({
      where: eq(users.uniqueKey, uniqueKey)
    });

    console.log("User check result:", {
      found: !!userCheck,
      user: userCheck ? {
        uniqueKey: userCheck.uniqueKey,
        email: userCheck.email,
        role: userCheck.role,
        isActive: userCheck.isActive,
        expiresAt: userCheck.expiresAt,
        hasPasswordHash: !!userCheck.passwordHash,
      }
        : null,
    })

    if (!userCheck) {
      return NextResponse.json(
        {
          error: "User not found",
          debug: "No user exists with this unique key",
        },
        { status: 401 },
      )
    }

    // Check if user is active
    if (!userCheck.isActive) {
      return NextResponse.json(
        {
          error: "Account is inactive",
          debug: "User account is deactivated",
        },
        { status: 401 },
      )
    }

    // Check if user is expired
    if (userCheck.expiresAt && new Date(userCheck.expiresAt) <= new Date()) {
      return NextResponse.json(
        {
          error: "Account has expired",
          debug: `Account expired on ${userCheck.expiresAt}`,
        },
        { status: 401 },
      )
    }

    // Now try to authenticate
    const user = await authenticateUser(uniqueKey, password)

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid password",
          debug: "Password verification failed",
        },
        { status: 401 },
      )
    }

    await createSession(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uniqueKey: user.uniqueKey,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        debug: error.message,
      },
      { status: 500 },
    )
  }
}
