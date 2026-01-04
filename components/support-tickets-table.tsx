"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, MessageSquare } from "lucide-react"
import type { SupportTicket } from "@/lib/database"

export function SupportTicketsTable() {
  const [tickets, setTickets] = useState<(SupportTicket & { creator_email?: string; company_name?: string })[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/super-admin/support-tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    }
  }

  const updateTicketStatus = async (ticketId: number, status: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/super-admin/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status })
        }
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const viewTicket = (ticket: SupportTicket & { creator_email?: string; company_name?: string }) => {
    setSelectedTicket(ticket)
    setShowTicketDialog(true)
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive"
      case "in_progress":
        return "default"
      case "closed":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (tickets.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No support tickets found.</div>
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>{ticket.company_name || "N/A"}</TableCell>
                <TableCell>{ticket.creator_email || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => viewTicket(ticket)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Ticket #{selectedTicket?.id}
            </DialogTitle>
            <DialogDescription>Review and manage support ticket</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <p className="text-sm text-muted-foreground">{selectedTicket.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <div className="mt-1">
                    <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Update Status</label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
