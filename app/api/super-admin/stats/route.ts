import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    await requireAuth(["super_admin"])

    const [companiesResult, usersResult, activeUsersResult, expiringSoonResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM companies WHERE is_active = true`,
      sql`SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'`,
      sql`SELECT COUNT(*) as count FROM users WHERE is_active = true AND role != 'super_admin'`,
      sql`
        SELECT COUNT(*) as count FROM users 
        WHERE expires_at IS NOT NULL 
        AND expires_at > NOW() 
        AND expires_at <= NOW() + INTERVAL '30 days'
        AND role != 'super_admin'
      `,
    ])

    const stats = {
      totalCompanies: Number.parseInt(companiesResult[0].count),
      totalUsers: Number.parseInt(usersResult[0].count),
      activeUsers: Number.parseInt(activeUsersResult[0].count),
      expiringSoon: Number.parseInt(expiringSoonResult[0].count),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 })
  }
}
