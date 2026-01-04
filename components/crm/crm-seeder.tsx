"use client"

import { useEffect } from "react"
import { seedBasePermissions } from "@/actions/permissions"

export function CRMSeeder() {
    useEffect(() => {
        // Trigger seeding once on mount
        seedBasePermissions().then(res => {
            if (res.success) console.log("CRM Permissions seeded")
        })
    }, [])

    return null
}
