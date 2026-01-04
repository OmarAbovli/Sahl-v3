import { cookies } from "next/headers"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, and, sql, or, isNull, gt } from "drizzle-orm"
import type { User } from "./auth"

export async function createSession(user: User) {
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Store session in database (you might want to create a sessions table)
  // For now, we'll use cookies with the user ID
  const cookieStore = await cookies()
  cookieStore.set(
    "session",
    JSON.stringify({
      userId: user.id,
      user_id: user.id, // Legacy compatibility
      uniqueKey: user.uniqueKey,
      role: user.role,
      companyId: user.companyId,
      company_id: user.companyId, // Legacy compatibility
      expiresAt: expiresAt.toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    },
  )
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      await destroySession()
      return null
    }

    // Get fresh user data (simplified - without complex relations for now)
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, sessionData.userId),
        eq(users.isActive, true),
        or(isNull(users.expiresAt), gt(users.expiresAt, sql`NOW()`))
      )
    })

    if (!user) {
      await destroySession()
      return null
    }

    // Return user with legacy property aliases for old API routes
    return {
      ...user,
      user_id: user.id,
      company_id: user.companyId
    } as User
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

export const getCurrentUser = getSession

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function requireAuth(allowedRoles?: string[]): Promise<User> {
  const user = await getSession()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }

  return user
}
