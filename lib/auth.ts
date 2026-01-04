import bcrypt from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, and, sql, or, isNull, gt } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"

export type User = InferSelectModel<typeof users>

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateUniqueKey(companyName: string, role: string): Promise<string> {
  const rolePrefix = role === "company_admin" ? "admin" : role === "employee" ? "emp" : "super"
  const randomNumber = Math.floor(100 + Math.random() * 900) // 3-digit random number

  let uniqueKey = `${companyName}${rolePrefix}${randomNumber}`

  // Ensure uniqueness
  let attempts = 0
  while (attempts < 10) {
    const existing = await db.query.users.findFirst({
      where: eq(users.uniqueKey, uniqueKey)
    })

    if (!existing) {
      return uniqueKey
    }

    // Generate new random number if key exists
    const newRandomNumber = Math.floor(100 + Math.random() * 900)
    uniqueKey = `${companyName}${rolePrefix}${newRandomNumber}`
    attempts++
  }

  throw new Error("Unable to generate unique key after multiple attempts")
}

// Update the authenticateUser function to add better debugging
export async function authenticateUser(uniqueKey: string, password: string): Promise<User | null> {
  try {
    console.log(`Attempting to authenticate user with key: ${uniqueKey}`)

    // Check for user existence and active status
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.uniqueKey, uniqueKey),
        eq(users.isActive, true),
        or(isNull(users.expiresAt), gt(users.expiresAt, sql`NOW()`))
      )
    });

    if (!user) {
      // Let's also check if the user exists but doesn't meet the criteria
      const anyUser = await db.query.users.findFirst({
        where: eq(users.uniqueKey, uniqueKey)
      })

      if (anyUser) {
        console.log(`User exists but failed criteria check:`, {
          isActive: anyUser.isActive,
          expiresAt: anyUser.expiresAt,
          isExpired: anyUser.expiresAt ? new Date(anyUser.expiresAt) <= new Date() : false,
        })
      } else {
        console.log(`No user found with unique_key: ${uniqueKey}`)
      }

      return null
    }

    console.log(`Verifying password for user: ${user.email}`)

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    console.log(`Password verification result: ${isValidPassword}`)

    if (!isValidPassword) {
      return null
    }

    // Update last login
    await db.update(users)
      .set({ lastLogin: sql`NOW()` })
      .where(eq(users.id, user.id));

    console.log(`Authentication successful for user: ${user.email}`)

    // Remove password hash from returned user
    const { passwordHash, ...userWithoutPassword } = user
    return userWithoutPassword as User
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

export function checkPermission(user: User, permission: string): boolean {
  if (user.role === "super_admin") {
    return true
  }

  if (user.role === "company_admin") {
    // Company admins have most permissions within their company
    const adminPermissions = [
      "view_employees",
      "manage_employees",
      "view_invoices",
      "manage_invoices",
      "view_inventory",
      "manage_inventory",
      "view_warehouses",
      "manage_warehouses",
      "view_reports",
      "contact_support",
    ]
    return adminPermissions.includes(permission)
  }

  // For employees, check custom permissions
  return (user.permissions as Record<string, boolean>)?.[permission] === true
}
