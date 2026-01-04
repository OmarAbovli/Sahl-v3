"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Loader2, Copy, Check } from "lucide-react"
import { createEmployee } from "@/actions/employees"
import { motion, AnimatePresence } from "framer-motion"

export function AddEmployeeModal({ companyId }: { companyId: number }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [successData, setSuccessData] = useState<{ uniqueKey: string } | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await createEmployee({
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            position: formData.get('position') as string,
            department: formData.get('department') as string,
            companyId,
        })

        if (result.success && result.uniqueKey) {
            setSuccessData({ uniqueKey: result.uniqueKey })
        }

        setIsLoading(false)
    }

    const copyToClipboard = () => {
        if (successData) {
            navigator.clipboard.writeText(`Key: ${successData.uniqueKey}\nPass: 123456`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetForm = () => {
        setSuccessData(null)
        setOpen(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-white text-black hover:bg-amber-50 rounded-none px-6 font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] bg-slate-950 border-l border-slate-800 p-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-800">
                    <SheetTitle className="text-white text-xl font-light">New Employee</SheetTitle>
                    <SheetDescription className="text-slate-500 mt-1">
                        Create a new profile and generate access credentials.
                    </SheetDescription>
                </div>

                <AnimatePresence mode="wait">
                    {!successData ? (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            key="form"
                            onSubmit={handleSubmit}
                            className="p-6 space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">First Name</Label>
                                    <Input name="firstName" required className="bg-slate-900 border-slate-800 text-white rounded-none focus:border-amber-500/50 focus:ring-amber-500/20" placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Last Name</Label>
                                    <Input name="lastName" required className="bg-slate-900 border-slate-800 text-white rounded-none focus:border-amber-500/50 focus:ring-amber-500/20" placeholder="Doe" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Official Email</Label>
                                <Input name="email" type="email" required className="bg-slate-900 border-slate-800 text-white rounded-none focus:border-amber-500/50 focus:ring-amber-500/20" placeholder="john.doe@company.com" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Department</Label>
                                    <Input name="department" required className="bg-slate-900 border-slate-800 text-white rounded-none focus:border-amber-500/50 focus:ring-amber-500/20" placeholder="Sales" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Position</Label>
                                    <Input name="position" required className="bg-slate-900 border-slate-800 text-white rounded-none focus:border-amber-500/50 focus:ring-amber-500/20" placeholder="Manager" />
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-black hover:bg-amber-400 rounded-none h-12 font-bold tracking-wide">
                                    {isLoading ? <Loader2 className="animate-spin" /> : "CREATE PROFILE"}
                                </Button>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key="success"
                            className="p-8 flex flex-col items-center justify-center space-y-6 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Check className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white text-lg font-medium">Employee Created Successfully</h3>
                                <p className="text-slate-500 text-sm mt-2">New profile has been activated.</p>
                            </div>

                            <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-none relative group">
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Unique Access Key</div>
                                <div className="text-2xl font-mono text-amber-500 font-bold">{successData.uniqueKey}</div>

                                <div className="text-xs text-slate-500 uppercase tracking-widest mt-4 mb-1">Temporary Password</div>
                                <div className="text-lg font-mono text-white">123456</div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>

                            <Button onClick={resetForm} className="w-full" variant="outline">
                                Close & Add Another
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </SheetContent>
        </Sheet>
    )
}
