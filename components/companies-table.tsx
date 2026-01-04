"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Company } from "@/lib/database"

interface CompaniesTableProps {
  companies: Company[]
  onRefresh: () => void
}

export function CompaniesTable({ companies, onRefresh }: CompaniesTableProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleStatus = async (companyId: number, isActive: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}`, {
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
      console.error("Error updating company:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No companies found. Create your first company to get started.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.display_name}</TableCell>
              <TableCell>
                <Badge variant={company.is_active ? "default" : "secondary"}>
                  {company.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(company.id, company.is_active)}
                      disabled={isLoading}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {company.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
