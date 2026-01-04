"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"
import {
  Percent,
  Calculator,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  Building2,
  DollarSign,
  ChevronRight,
  MoreVertical,
  Download,
  Filter,
  RefreshCcw,
  Clock,
  Briefcase
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner";
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { getTaxSummary } from "@/actions/tax"
import { DataExportModal } from "@/components/data-export-modal"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { ChartTooltip } from "@/components/ui/chart"

interface TaxManagementProps {
  user: any;
  canManage: boolean;
  canView: boolean;
}

export function TaxManagement({ user, canManage, canView }: TaxManagementProps) {
  const { t, isRTL } = useTranslation()
  const [activeTab, setActiveTab] = useState("assessment");
  const [loading, setLoading] = useState(true);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [taxRules, setTaxRules] = useState<any[]>([
    { id: 1, name: "VAT Standard", rate: 15, type: "VAT", is_active: true },
    { id: 2, name: "Service Tax", rate: 5, type: "Service", is_active: true },
  ]);
  const [products, setProducts] = useState<any[]>([
    { id: 1, name: "Product A", tax_rule_id: 1, base_price: 15.00 },
    { id: 2, name: "Product B", tax_rule_id: 2, base_price: 25.00 },
  ]);

  useEffect(() => {
    if (canView && user.companyId) {
      loadData()
    }
  }, [user.companyId, canView])

  async function loadData() {
    setLoading(true)
    const res = await getTaxSummary(user.companyId)
    if (res.success) {
      setTaxSummary(res.data)
    } else {
      toast.error(t('operation_failed'))
    }
    setLoading(false)
  }

  if (!canView) return <div className="p-12 text-center text-slate-500 italic">{t('no_access')}</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">{t('tax_management')}</h1>
          <p className="text-slate-400 text-sm">{t('compliance')}</p>
        </div>
        <div className="flex gap-2">
          <DataExportModal
            model="sales_invoices"
            title={t('tax_assessment')}
            companyId={user.companyId}
          />
          <Button variant="ghost" className="border-slate-800 text-slate-400 hover:text-white rounded-none">
            <RefreshCcw className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('refresh')}
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-none border-none shadow-xl shadow-amber-600/10 font-bold uppercase tracking-widest text-[10px] h-11 px-8">
            <Plus className="h-4 w-4 mr-2" /> {t('add')} {t('rule')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <TabsList className="bg-transparent h-auto p-0 gap-10">
            <TabsTrigger value="assessment" className="bg-transparent p-0 rounded-none h-11 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-slate-500 font-bold text-xs uppercase tracking-widest leading-none mb-[-2px]">{t('assessment')}</TabsTrigger>
            <TabsTrigger value="rules" className="bg-transparent p-0 rounded-none h-11 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-slate-500 font-bold text-xs uppercase tracking-widest leading-none mb-[-2px]">{t('rule')}</TabsTrigger>
            <TabsTrigger value="reports" className="bg-transparent p-0 rounded-none h-11 border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-slate-500 font-bold text-xs uppercase tracking-widest leading-none mb-[-2px]">{t('reports')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rules" className="space-y-10 focus-visible:ring-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {taxRules.map((rule, idx) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-950/40 border-slate-800 rounded-none group hover:border-amber-500/30 transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Percent className="h-12 w-12" />
                  </div>
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
                        <Percent className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 uppercase text-[8px] font-bold tracking-widest px-2 py-1 rounded-none">Active</Badge>
                    </div>
                    <CardTitle className="text-xl font-light text-white mt-4">{rule.name}</CardTitle>
                    <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{rule.type} Regulatory Tier</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-4">
                    <div className="space-y-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">Standard Rate</span>
                        <span className="text-3xl font-light text-white font-mono">{rule.rate}%</span>
                      </div>
                      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                        <Button variant="link" className="text-amber-500 p-0 text-[10px] uppercase font-bold tracking-widest hover:text-amber-400 no-underline">
                          {t('edit')} Hierarchy <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                        <MoreVertical className="h-4 w-4 text-slate-700 cursor-pointer" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="focus-visible:ring-0 outline-none">
          {loading ? (
            <div className="flex items-center justify-center p-24">
              <RefreshCcw className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-950/40 border-slate-800 rounded-none p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-emerald-500/20 text-emerald-500">Real-time</Badge>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t('net_vat_liability')}</p>
                    <h3 className="text-2xl font-light text-white mt-1">{t('currency_symbol')} {taxSummary?.vat.net.toLocaleString()}</h3>
                  </div>
                </Card>
                <Card className="bg-slate-950/40 border-slate-800 rounded-none p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-blue-500/20 text-blue-500">{taxSummary?.corporate.rate}% {t('tax_rate')}</Badge>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t('estimated_corporate_tax')}</p>
                    <h3 className="text-2xl font-light text-white mt-1">{t('currency_symbol')} {taxSummary?.corporate.estimatedTax.toLocaleString()}</h3>
                  </div>
                </Card>
                <Card className="bg-slate-950/40 border-slate-800 rounded-none p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-amber-500/20 text-amber-500">{t('payroll')} 10%</Badge>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t('employment_tax')}</p>
                    <h3 className="text-2xl font-light text-white mt-1">{t('currency_symbol')} {taxSummary?.payroll.estimatedTax.toLocaleString()}</h3>
                  </div>
                </Card>
                <Card className="bg-slate-900 border-amber-500/30 rounded-none p-6 space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Percent className="h-12 w-12" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <Calculator className="h-5 w-5 text-amber-500" />
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-amber-500/70 text-[10px] uppercase font-black tracking-[0.2em]">{t('total_tax_owed')}</p>
                    <h3 className="text-3xl font-light text-white mt-1 font-mono tracking-tighter">
                      {t('currency_symbol')} {taxSummary?.totalLiability.toLocaleString()}
                    </h3>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-slate-950/40 border-slate-800 rounded-none overflow-hidden h-full">
                  <CardHeader className="border-b border-white/5 p-8">
                    <CardTitle className="text-xl font-light text-white">{t('tax_breakdown')}</CardTitle>
                    <CardDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t('income_vs_expenses')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="p-8 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-xs text-slate-400">{t('taxable_revenue')}</span>
                              <span className="text-lg font-mono text-white">{t('currency_symbol')} {taxSummary?.corporate.taxableProfit.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-900 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                className="h-full bg-emerald-500/50"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">{t('output_vat')}</p>
                              <p className="text-lg font-light text-white">{t('currency_symbol')} {taxSummary?.vat.collected.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">{t('input_vat')}</p>
                              <p className="text-lg font-light text-white">{t('currency_symbol')} {taxSummary?.vat.paid.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">{t('deductible_expenses')}</p>
                              <p className="text-lg font-light text-white">{t('currency_symbol')} {taxSummary?.payroll.totalBasic.toLocaleString()}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">{t('tier')}</p>
                              <p className="text-lg font-light text-amber-500">Tier A</p>
                            </div>
                          </div>
                        </div>

                        <div className="h-64 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'VAT', value: Math.abs(taxSummary?.vat.net) },
                                  { name: 'Corporate', value: taxSummary?.corporate.estimatedTax },
                                  { name: 'Payroll', value: taxSummary?.payroll.estimatedTax }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#3b82f6" />
                                <Cell fill="#f59e0b" />
                              </Pie>
                              <ChartTooltip
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '0px' }}
                                itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Total Share</span>
                            <span className="text-xs font-mono text-white">100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-600/5 border-amber-500/20 rounded-none p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-light text-white">{t('compliance_status')}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Your enterprise tax calculations are automatically aggregated based on verified sales invoices and purchase records.
                      </p>
                    </div>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-3 text-xs text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>All Sales Invoices Processed</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>VAT Reconciliation Complete</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span>Next Filing Due: 30 Days</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-none h-12 uppercase tracking-widest text-[10px] font-bold mt-8">
                    {t('generate')} {t('filing_ready')}
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="focus-visible:ring-0 outline-none shadow-3xl">
          <Card className="bg-slate-950/40 border-slate-800 rounded-none overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-light text-white">{t('transparency')}</h4>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t('reports')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-widest h-10 px-6 rounded-none"><Download className="h-3 w-3 mr-2" /> PDF</Button>
                <Button variant="outline" className="border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-widest h-10 px-6 rounded-none"><Download className="h-3 w-3 mr-2" /> Excel</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/30">
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em] h-14 border-b border-white/5">
                    <th className="px-10 text-left">Filing Period</th>
                    <th className="text-left">Classification</th>
                    <th className="text-right">Tax Liability</th>
                    <th className="text-right px-10">Verification State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {[
                    { period: "May 2024", type: "VAT", total: "1,200.00", filed: false },
                    { period: "April 2024", type: "Service Tax", total: "950.00", filed: true },
                    { period: "March 2024", type: "VAT", total: "2,100.00", filed: true },
                  ].map((r, i) => (
                    <tr key={i} className="group hover:bg-slate-900/40 transition-colors h-20">
                      <td className="px-10">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-slate-200 font-medium">{r.period}</span>
                        </div>
                      </td>
                      <td className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{r.type} Enrollment</td>
                      <td className="text-right font-mono text-white">{t('currency_symbol')}{r.total}</td>
                      <td className="text-right px-10">
                        {r.filed ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-none text-[8px] uppercase tracking-widest h-6 px-3">Filed & Secured</Badge>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Badge className="bg-rose-500/10 text-rose-500 border-none rounded-none text-[8px] uppercase tracking-widest h-6 px-3">Pending Action</Badge>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-7 rounded-none px-4 text-[9px] uppercase font-black">Submit</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
