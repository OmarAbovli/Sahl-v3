"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Key, Copy, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { User, Company } from "@/lib/database"

interface UsersTableProps {
  users: (User & { company_name?: string })[]
  companies: Company[]
  onRefresh: () => void
}

export function UsersTable({ users, companies, onRefresh }: UsersTableProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const showUserKey = (user: User) => {
    setSelectedUser(user)
    setShowKeyDialog(true)
    setCopied(false)
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "company_admin":
        return "default"
      case "employee":
        return "secondary"
      default:
        return "outline"
    }
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const expirationDate = new Date(expiresAt)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expirationDate <= thirtyDaysFromNow
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found. Create your first user to get started.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unique Key</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono font-medium">{user.unique_key}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.company_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {user.expires_at && isExpiringSoon(user.expires_at) && (
                      <Badge variant="destructive" className="text-xs">
                        Expiring Soon
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.expires_at ? new Date(user.expires_at).toLocaleDateString() : "Never"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => showUserKey(user)}>
                        <Key className="mr-2 h-4 w-4" />
                        Show Key
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        disabled={isLoading}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        {user.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Login Credentials</DialogTitle>
            <DialogDescription>Share these credentials with the user for login</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">Email:</div>
              </div>
              <div className="text-sm font-medium">{selectedUser?.email}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">Unique Key:</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(selectedUser?.unique_key || "")}
                  className="h-6 px-2"
                >
                  {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="text-lg font-mono font-bold">{selectedUser?.unique_key}</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            The user will need this unique key along with their password to log in.
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
