"use client"

import { useState, useEffect, useTransition } from "react"
import { motion } from "framer-motion"
import {
    Building,
    Mail,
    Phone,
    Globe,
    MapPin,
    DollarSign,
    Save,
    CreditCard,
    Upload,
    Shield,
    History
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { getCompanySettings, updateCompanySettings } from "@/actions/settings"
import { useTranslation } from "@/hooks/use-translation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesPermissionsManager } from "@/components/roles-permissions-manager"

interface CompanySettingsProps {
    user: any
}

export function CompanySettings({ user }: CompanySettingsProps) {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        displayName: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        logoUrl: "",
        currency: "EGP",
        taxId: ""
    })

    useEffect(() => {
        if (user?.companyId) {
            loadSettings()
        }
    }, [user?.companyId])

    async function loadSettings() {
        setIsLoading(true)
        const res = await getCompanySettings(user.companyId)
        if (res.success && res.data) {
            setFormData({
                displayName: res.data.displayName || "",
                address: res.data.address || "",
                phone: res.data.phone || "",
                email: res.data.email || "",
                website: res.data.website || "",
                logoUrl: res.data.logoUrl || "",
                currency: res.data.currency || "EGP",
                taxId: res.data.taxId || ""
            })
        } else {
            toast.error("Failed to load settings")
        }
        setIsLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCompanySettings(user.companyId, formData)
            if (res.success) {
                toast.success("Settings updated successfully")
            } else {
                toast.error("Failed to update settings")
            }
        })
    }

    if (isLoading) {
        return <div className="p-8 text-slate-400">Loading settings...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight">Enterprise Settings</h2>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Sahl ERP Core Configuration</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-none h-12">
                    <TabsTrigger value="profile" className="rounded-none px-8 data-[state=active]:bg-slate-800 data-[state=active]:text-amber-500 uppercase text-[10px] font-bold tracking-widest">
                        <Building className="h-3 w-3 mr-2" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-none px-8 data-[state=active]:bg-slate-800 data-[state=active]:text-amber-500 uppercase text-[10px] font-bold tracking-widest">
                        <Shield className="h-3 w-3 mr-2" /> Security & RBAC
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="rounded-none px-8 data-[state=active]:bg-slate-800 data-[state=active]:text-amber-500 uppercase text-[10px] font-bold tracking-widest">
                        <History className="h-3 w-3 mr-2" /> Audit Trail
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-8">
                    <div className="flex justify-between items-center bg-slate-900/40 p-6 border border-slate-800">
                        <div>
                            <h3 className="text-lg font-light text-white">Institutional Identity</h3>
                            <p className="text-slate-500 text-xs">Update your organization's legal and visual profile</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 rounded-none shadow-xl shadow-amber-600/10"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Commit Changes
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Branding Card */}
                        <Card className="md:col-span-1 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Branding</CardTitle>
                                <CardDescription className="text-slate-500">Logo and visual identity</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-lg hover:border-amber-500/50 transition-colors bg-slate-950/50">
                                    {formData.logoUrl ? (
                                        <img src={formData.logoUrl} alt="Logo" className="h-24 w-auto object-contain mb-4" />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
                                            <Upload className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div className="w-full">
                                        <Label className="text-xs text-slate-500 mb-1 block">Logo URL</Label>
                                        <Input
                                            name="logoUrl"
                                            value={formData.logoUrl}
                                            onChange={handleChange}
                                            className="bg-slate-950 border-slate-800 text-xs h-8"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* General Info Card */}
                        <Card className="md:col-span-2 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">General Information</CardTitle>
                                <CardDescription className="text-slate-500">Basic details about your organization</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-slate-300">Company Name (Display)</Label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="displayName"
                                                value={formData.displayName}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Tax ID / VAT Number</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="taxId"
                                                value={formData.taxId}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Default Currency</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs">{t('currency_symbol')}</div>
                                            <Input
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info Card */}
                        <Card className="md:col-span-3 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Contact Details</CardTitle>
                                <CardDescription className="text-slate-500">Public contact information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Website</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="website"
                                                value={formData.website}
                                                onChange={handleChange}
                                                className="pl-9 bg-slate-950 border-slate-800 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <Label className="text-slate-300">Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="pl-9 bg-slate-950 border-slate-800 text-white min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <RolesPermissionsManager companyId={user.companyId} />
                </TabsContent>

                <TabsContent value="audit">
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 bg-slate-900/20 text-center space-y-4">
                        <History className="h-12 w-12 text-slate-800 mb-2" />
                        <h4 className="text-slate-400 font-light">System Audit Logs</h4>
                        <p className="text-slate-600 text-xs max-w-md">Detailed tracking of all administrative actions will be available in the next version of Sahl ERP Pro.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
