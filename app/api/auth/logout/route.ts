import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { destroySession } from "@/lib/session"

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
