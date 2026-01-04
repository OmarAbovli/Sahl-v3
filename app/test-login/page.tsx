"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestLoginPage() {
  const [uniqueKey, setUniqueKey] = useState("superadmin001")
  const [password, setPassword] = useState("password")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testAuth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueKey, password }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const testRealLogin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueKey, password }),
      })
      const data = await response.json()
      setResult({ ...data, endpoint: "real_login" })
    } catch (error) {
      setResult({ error: error.message, endpoint: "real_login" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unique Key</label>
              <Input value={uniqueKey} onChange={(e) => setUniqueKey(e.target.value)} placeholder="superadmin001" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={testAuth} disabled={isLoading}>
                Test Auth Debug
              </Button>
              <Button onClick={testRealLogin} disabled={isLoading} variant="outline">
                Test Real Login
              </Button>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Unique Key:</strong> superadmin001
              </p>
              <p>
                <strong>Password:</strong> password
              </p>
              <p className="text-muted-foreground">
                After running the database script, use these simpler credentials to test.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
