"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { CreditCard, AlertTriangle, CheckCircle, Clock, Plus, Eye, Search } from "lucide-react"
import type { Debt, DebtPayment } from "@/lib/database"

import { useTranslation } from "@/hooks/use-translation"

interface DebtManagementProps {
  user: any
  canManage: boolean
}

interface DebtStats {
  total_debts: number
  active_debt: number
  overdue_debt: number
  paid_debt: number
}

export function DebtManagement({ user, canManage }: DebtManagementProps) {
  const { t, isRTL } = useTranslation()
  const [debts, setDebts] = useState<Debt[]>([])
  const [stats, setStats] = useState<DebtStats>({
    total_debts: 0,
    active_debt: 0,
    overdue_debt: 0,
    paid_debt: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isPaymentHistoryDialogOpen, setIsPaymentHistoryDialogOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([])

  // Form states
  const [paymentFormData, setPaymentFormData] = useState({
    payment_amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "",
    reference_number: "",
    notes: "",
  })

  const [error, setError] = useState("")

  useEffect(() => {
    fetchDebts()
  }, [statusFilter])

  const fetchDebts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/employee/debts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDebts(data.debts || [])
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error("Error fetching debts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPaymentHistory = async (debtId: number) => {
    try {
      const response = await fetch(`/api/employee/debts/${debtId}/payments`)
      if (response.ok) {
        const data = await response.json()
        setPaymentHistory(data.payments || [])
      }
    } catch (error) {
      console.error("Error fetching payment history:", error)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebt) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/employee/debts/${selectedDebt.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentFormData,
          payment_amount: Number.parseFloat(paymentFormData.payment_amount),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchDebts()
        setIsPaymentDialogOpen(false)
        setPaymentFormData({
          payment_amount: "",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: "",
          reference_number: "",
          notes: "",
        })
        alert(data.message)
      } else {
        setError(data.error || "Failed to record payment")
      }
    } catch (error) {
      setError("An error occurred while recording the payment")
    } finally {
      setIsLoading(false)
    }
  }

  const openPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt)
    setPaymentFormData({
      ...paymentFormData,
      payment_amount: debt.remaining_amount.toString(),
    })
    setIsPaymentDialogOpen(true)
  }

  const openPaymentHistory = async (debt: Debt) => {
    setSelectedDebt(debt)
    await fetchPaymentHistory(debt.id)
    setIsPaymentHistoryDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "paid":
        return <Badge variant="secondary">Paid</Badge>
      case "written_off":
        return <Badge variant="outline">Written Off</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredDebts = debts.filter(
    (debt) =>
      debt.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (debt.debtor_contact && debt.debtor_contact.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_debts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Debt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{t('currency_symbol')}{Number(stats.active_debt || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Debt</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{t('currency_symbol')}{Number(stats.overdue_debt || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Debt</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{t('currency_symbol')}{Number(stats.paid_debt || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Management</CardTitle>
          <CardDescription>Track and manage outstanding debts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search debtors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Debts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading debts...</div>
          ) : filteredDebts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No debts found matching your search." : "No debts found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debtor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Original Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.debtor_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{debt.debtor_type === "company" ? "Company" : "Individual"}</Badge>
                      </TableCell>
                      <TableCell>{debt.debtor_contact || "N/A"}</TableCell>
                      <TableCell>{t('currency_symbol')}{Number(debt.original_amount).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">{t('currency_symbol')}{Number(debt.remaining_amount).toFixed(2)}</TableCell>
                      <TableCell>{new Date(debt.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell>{debt.due_date ? new Date(debt.due_date).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        {debt.last_payment_date ? (
                          <div>
                            <div>{new Date(debt.last_payment_date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('currency_symbol')} {Number(debt.last_payment_amount).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          "No payments"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(debt.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openPaymentHistory(debt)}>
                            <Eye className="h-3 w-3 mr-1" />
                            History
                          </Button>
                          {canManage && debt.status !== "paid" && (
                            <Button variant="default" size="sm" onClick={() => openPaymentDialog(debt)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for {selectedDebt?.debtor_name}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Debt Information</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span>{t('currency_symbol')} {Number(selectedDebt?.original_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Amount:</span>
                    <span className="font-medium">{t('currency_symbol')} {Number(selectedDebt?.remaining_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_amount">Payment Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  min="0.01"
                  max={selectedDebt?.remaining_amount}
                  step="0.01"
                  value={paymentFormData.payment_amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={paymentFormData.payment_method}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={paymentFormData.reference_number}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference_number: e.target.value })}
                  placeholder="Check number, transaction ID, etc."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment_notes">Notes (Optional)</Label>
                <Textarea
                  id="payment_notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Additional notes about the payment"
                  rows={2}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isPaymentHistoryDialogOpen} onOpenChange={setIsPaymentHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>Payment history for {selectedDebt?.debtor_name}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments recorded</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{t('currency_symbol')} {Number(payment.payment_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {payment.payment_method ? (
                          <Badge variant="outline">{payment.payment_method.replace("_", " ").toUpperCase()}</Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{payment.reference_number || "N/A"}</TableCell>
                      <TableCell>{payment.recorded_by_email || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPaymentHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
