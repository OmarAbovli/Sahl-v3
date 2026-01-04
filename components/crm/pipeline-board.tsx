"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, DollarSign, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { updateDealStage } from "@/actions/crm"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface Deal {
    id: number
    title: string
    value: number
    stage: string
    companyName?: string // from Lead or Customer relationship if fetched
    expectedCloseDate?: string
    lead?: { firstName: string, lastName: string, companyName: string }
    customer?: { name: string }
}

interface PipelineBoardProps {
    initialDeals: Deal[]
    companyId: number
}

const STAGES = [
    { id: "prospecting", title: "Prospecting", color: "bg-blue-500/10 border-blue-500/20" },
    { id: "proposal", title: "Proposal", color: "bg-yellow-500/10 border-yellow-500/20" },
    { id: "negotiation", title: "Negotiation", color: "bg-orange-500/10 border-orange-500/20" },
    { id: "won", title: "Closed Won", color: "bg-green-500/10 border-green-500/20" },
    { id: "lost", title: "Closed Lost", color: "bg-red-500/10 border-red-500/20" },
]

export function PipelineBoard({ initialDeals, companyId }: PipelineBoardProps) {
    const [deals, setDeals] = useState(initialDeals)
    const { toast } = useToast()

    // Group deals by stage
    const columns = STAGES.reduce((acc, stage) => {
        acc[stage.id] = deals.filter(deal => deal.stage === stage.id)
        return acc
    }, {} as Record<string, Deal[]>)

    const onDragEnd = async (result: any) => {
        if (!result.destination) return

        const { source, destination, draggableId } = result
        const dealId = parseInt(draggableId)

        if (source.droppableId !== destination.droppableId) {
            // Optimistic update
            const newStage = destination.droppableId
            const updatedDeals = deals.map(d =>
                d.id === dealId ? { ...d, stage: newStage } : d
            )
            setDeals(updatedDeals)

            // Server update
            const res = await updateDealStage(dealId, newStage)
            if (!res.success) {
                toast({ title: "Error", description: "Failed to move deal", variant: "destructive" })
                // Revert
                setDeals(deals)
            } else {
                toast({ title: "Updated", description: `Deal moved to ${STAGES.find(s => s.id === newStage)?.title}` })
            }
        }
    }

    const getTotalValue = (stageDeals: Deal[]) => {
        return stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0)
    }

    return (
        <div className="h-[calc(100vh-200px)] overflow-x-auto pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 min-w-max h-full">
                    {STAGES.map((stage) => (
                        <div key={stage.id} className="w-[320px] flex flex-col gap-4">
                            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${stage.color}`}>
                                <div className="flex justify-between items-center font-semibold">
                                    <span>{stage.title}</span>
                                    <Badge variant="secondary">{columns[stage.id]?.length || 0}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    {formatCurrency(getTotalValue(columns[stage.id] || []))}
                                </div>
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="flex-1 flex flex-col gap-3 min-h-[150px]"
                                    >
                                        {columns[stage.id]?.map((deal, index) => (
                                            <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                                                {(provided) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                                    >
                                                        <CardContent className="p-4 space-y-3">
                                                            <div>
                                                                <h4 className="font-medium line-clamp-2">{deal.title}</h4>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {deal.lead?.companyName || deal.customer?.name || "Unknown Company"}
                                                                </p>
                                                            </div>

                                                            <div className="flex justify-between items-center text-sm">
                                                                <div className="flex items-center text-green-600 font-medium">
                                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                                    {Number(deal.value).toLocaleString()}
                                                                </div>
                                                                {deal.expectedCloseDate && (
                                                                    <div className="flex items-center text-muted-foreground">
                                                                        <Calendar className="h-3 w-3 mr-1" />
                                                                        {format(new Date(deal.expectedCloseDate), "MMM d")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <Button variant="ghost" className="w-full border border-dashed text-muted-foreground">
                                            <Plus className="mr-2 h-4 w-4" /> Add Deal
                                        </Button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    )
}
