"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, CheckCircle } from "lucide-react"
import type { Company } from "@/lib/database"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  onSuccess: () => void
}

const EMPLOYEE_PERMISSIONS = [
  { id: "view_employees", label: "View Employees" },
  { id: "manage_employees", label: "Manage Employees" },
  { id: "view_invoices", label: "View Invoices" },
  { id: "manage_invoices", label: "Manage Invoices" },
  { id: "view_inventory", label: "View Inventory" },
  { id: "manage_inventory", label: "Manage Inventory" },
  { id: "view_warehouses", label: "View Warehouses" },
  { id: "manage_warehouses", label: "Manage Warehouses" },
  { id: "view_reports", label: "View Reports" },
  // Accounting modules (full list)
  { id: "view_general_ledger", label: "View General Ledger" },
  { id: "manage_general_ledger", label: "Manage General Ledger" },
  { id: "view_accounts_receivable", label: "View Accounts Receivable" },
  { id: "manage_accounts_receivable", label: "Manage Accounts Receivable" },
  { id: "view_accounts_payable", label: "View Accounts Payable" },
  { id: "manage_accounts_payable", label: "Manage Accounts Payable" },
  { id: "view_purchasing", label: "View Purchases" },
  { id: "manage_purchasing", label: "Manage Purchases" },
  { id: "view_sales", label: "View Sales" },
  { id: "manage_sales", label: "Manage Sales" },
  { id: "view_hr_payroll", label: "View HR & Payroll" },
  { id: "manage_hr_payroll", label: "Manage HR & Payroll" },
  { id: "view_cash_bank", label: "View Cash & Bank" },
  { id: "manage_cash_bank", label: "Manage Cash & Bank" },
  { id: "view_fixed_assets", label: "View Fixed Assets" },
  { id: "manage_fixed_assets", label: "Manage Fixed Assets" },
  { id: "view_tax_management", label: "View Tax Management" },
  { id: "manage_tax_management", label: "Manage Tax Management" },
  { id: "view_financial_reports", label: "View Financial Reports" },
  { id: "manage_financial_reports", label: "Manage Financial Reports" },
  { id: "view_roles_permissions", label: "View Roles & Permissions" },
  { id: "manage_roles_permissions", label: "Manage Roles & Permissions" },
]

export function CreateUserDialog({ open, onOpenChange, companies, onSuccess }: CreateUserDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"company_admin" | "employee">("employee")
  const [companyId, setCompanyId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [createdUser, setCreatedUser] = useState<{ uniqueKey: string; email: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionId]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
          companyId: Number.parseInt(companyId),
          expiresAt: expiresAt || null,
          permissions: role === "employee" ? permissions : {},
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Show the created user info instead of closing immediately
        setCreatedUser({
          uniqueKey: data.uniqueKey,
          email: data.user.email,
        })
        onSuccess()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (error) {
      setError("An error occurred while creating the user")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleClose = () => {
    setEmail("")
    setPassword("")
    setRole("employee")
    setCompanyId("")
    setExpiresAt("")
    setPermissions({})
    setError("")
    setCreatedUser(null)
    setCopied(false)
    onOpenChange(false)
  }

  // If user was created successfully, show the success screen
  if (createdUser) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              The user account has been created. Share these credentials with the user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Save these credentials now. The unique key won't be shown again.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">Email</Label>
                </div>
                <div className="font-mono text-sm">{createdUser.email}</div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">Unique Key</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdUser.uniqueKey)}
                    className="h-6 px-2"
                  >
                    {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="font-mono text-lg font-bold">{createdUser.uniqueKey}</div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">Password</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(password)} className="h-6 px-2">
                    {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="font-mono text-sm">{password}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              The user will need both the <strong>unique key</strong> and <strong>password</strong> to log in.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Regular form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Create a new user account with specific role and permissions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: "company_admin" | "employee") => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            {role === "employee" && (
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 p-4 border rounded-md">
                  {EMPLOYEE_PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={permissions[permission.id] || false}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <Label htmlFor={permission.id} className="text-sm">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
