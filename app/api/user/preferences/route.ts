import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const user = await requireAuth()

    const preferences = await sql`
      SELECT * FROM user_preferences WHERE user_id = ${user.id}
    `

    if (preferences.length === 0) {
      // Create default preferences
      const defaultPrefs = await sql`
        INSERT INTO user_preferences (user_id, language, ai_insights_enabled)
        VALUES (${user.id}, 'en', true)
        RETURNING *
      `
      return NextResponse.json({ preferences: defaultPrefs[0] })
    }

    return NextResponse.json({ preferences: preferences[0] })
  } catch (error) {
    console.error("Error fetching user preferences:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const updates = await request.json()

    const allowedFields = [
      "language",
      "timezone",
      "date_format",
      "currency_format",
      "theme",
      "ai_insights_enabled",
      "email_notifications",
      "preferences",
    ]

    const updateFields = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Build dynamic update query
    const setClause = Object.keys(updateFields)
      .map((key) => `${key} = $${Object.keys(updateFields).indexOf(key) + 2}`)
      .join(", ")

    const values = [user.id, ...Object.values(updateFields)]

    const result = await sql`
      UPDATE user_preferences 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE user_id = ${user.id}
      RETURNING *
    `

    if (result.length === 0) {
      // Create if doesn't exist
      const created = await sql`
        INSERT INTO user_preferences (user_id, ${sql.unsafe(Object.keys(updateFields).join(", "))})
        VALUES (${user.id}, ${sql.unsafe(
          Object.values(updateFields)
            .map(() => "?")
            .join(", "),
        )})
        RETURNING *
      `
      return NextResponse.json({ preferences: created[0] })
    }

    return NextResponse.json({ preferences: result[0] })
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
