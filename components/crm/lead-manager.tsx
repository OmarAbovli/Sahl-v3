"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Phone, Mail, Building, User, Calendar, MoreHorizontal } from "lucide-react"
import { createLead, updateLeadStatus } from "@/actions/crm"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface LeadManagerProps {
    initialLeads: any[]
    companyId: number
}

export function LeadManager({ initialLeads, companyId }: LeadManagerProps) {
    const [leads, setLeads] = useState(initialLeads)
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const filteredLeads = leads.filter(lead =>
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            companyId,
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string,
            phone: formData.get("phone") as string,
            companyName: formData.get("companyName") as string,
            source: formData.get("source") as string,
            status: "new",
            notes: formData.get("notes") as string,
        }

        const result = await createLead(data)

        if (result.success) {
            toast({ title: "Success", description: "Lead created successfully" })
            setIsAddOpen(false)
            // Ideally re-fetch or optimistically update. For now basic.
            window.location.reload()
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
        }
        setLoading(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800'
            case 'contacted': return 'bg-yellow-100 text-yellow-800'
            case 'qualified': return 'bg-green-100 text-green-800'
            case 'lost': return 'bg-red-100 text-red-800'
            case 'converted': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
                    <p className="text-muted-foreground">Manage your potential customers and sales opportunities</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#0f172a] hover:bg-[#0f172a]/90">
                            <Plus className="mr-2 h-4 w-4" /> Add Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateLead} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input name="firstName" required placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input name="lastName" required placeholder="Doe" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input name="companyName" placeholder="Acme Corp" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input name="email" type="email" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input name="phone" placeholder="+1 234 567 890" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Source</Label>
                                <Select name="source">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="referral">Referral</SelectItem>
                                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                                        <SelectItem value="cold_call">Cold Call</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea name="notes" placeholder="Initial notes..." />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating..." : "Create Lead"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search leads..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <a href={`/company-admin/crm/leads/${lead.id}`} className="block">
                                                <div className="font-medium hover:underline text-blue-600">{lead.firstName} {lead.lastName}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {lead.email || "-"}
                                                </div>
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                {lead.companyName || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(lead.status)}>
                                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize text-sm text-muted-foreground">
                                            {lead.source?.replace('_', ' ') || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No leads found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
