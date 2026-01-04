"use client"

import { useState, useEffect, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Edit,
  Search,
  Trash2,
  Loader2,
  User as UserIcon,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  Building,
  DollarSign,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import { getRoles } from "@/actions/permissions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getEmployees, updateEmployee, deleteEmployee, createEmployee, adminResetPassword } from "@/actions/employees"
import { DataExportModal } from "@/components/data-export-modal"

interface EmployeesManagementProps {
  user: any
  canManage: boolean
}

export function EmployeesManagement({ user, canManage }: EmployeesManagementProps) {
  const { t, isRTL } = useTranslation()
  const [employees, setEmployees] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [resettingPasswordUser, setResettingPasswordUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    position: "",
    department: "",
    salary: "",
    email: "",
    roleId: "",
  })

  useEffect(() => {
    fetchEmployees()
    fetchRolesList()
    // eslint-disable-next-line
  }, [user.companyId])

  async function loadData() {
    setIsLoading(true)
    const res = await getRoles(user.companyId)
    if (res.success) setRoles(res.data || [])
  }

  async function fetchRolesList() {
    const res = await getRoles(user.companyId)
    if (res.success) setRoles(res.data || [])
  }

  const fetchEmployees = async () => {
    setIsLoading(true)
    const companyId = user.companyId
    try {
      const res = await getEmployees(companyId)
      if (res.success) {
        setEmployees(res.data || [])
      } else {
        toast.error(t('operation_failed'))
      }
    } catch (error) {
      toast.error(t('error_occurred'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        let res
        if (editingEmployee) {
          res = await updateEmployee(editingEmployee.id, formData)
        } else {
          res = await createEmployee({
            ...formData,
            companyId: user.companyId
          })
        }

        if (res.success) {
          toast.success(t('operation_successful'))
          setIsDialogOpen(false)
          fetchEmployees()
        } else {
          toast.error(res.error)
        }
      } catch (err) {
        toast.error(t('operation_failed'))
      }
    })
  }

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee)
    setFormData({
      employeeNumber: employee.employeeNumber || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      position: employee.position || "",
      department: employee.department || "",
      salary: employee.salary?.toString() || "",
      email: employee.user?.email || "",
      roleId: employee.user?.userRoles?.[0]?.roleId?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('password_too_short'))
      return
    }
    startTransition(async () => {
      const res = await adminResetPassword(resettingPasswordUser.userId, newPassword)
      if (res.success) {
        toast.success(t('operation_successful'))
        setResettingPasswordUser(null)
        setNewPassword("")
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm_delete'))) return
    startTransition(async () => {
      const res = await deleteEmployee(id)
      if (res.success) {
        toast.success(t('operation_successful'))
        fetchEmployees()
      } else {
        toast.error(res.error)
      }
    })
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight">{t('employees')}</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">{t('hr')}</p>
        </div>
        <div className="flex items-center gap-3">
          <DataExportModal
            model="hr_employees"
            title={t('employees')}
            companyId={user.companyId}
          />
          {canManage && (
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-none h-11 px-8 shadow-xl shadow-amber-600/10 transition-all font-bold uppercase tracking-widest text-[10px]"
              onClick={() => { setEditingEmployee(null); setFormData({ employeeNumber: "", firstName: "", lastName: "", position: "", department: "", salary: "", email: "", roleId: "" }); setIsDialogOpen(true); }}
            >
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('add')} {t('employees')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserIcon className="h-12 w-12 text-white" />
          </div>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Headcount</p>
          <h3 className="text-3xl font-light text-white">{employees.length}</h3>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Building className="h-12 w-12 text-white" />
          </div>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Departments</p>
          <h3 className="text-3xl font-light text-white">{Array.from(new Set(employees.map(e => e.department))).length}</h3>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="h-12 w-12 text-white" />
          </div>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Monthly Payroll</p>
          <h3 className="text-3xl font-light text-emerald-500 font-mono">{t('currency_symbol')} {employees.reduce((acc, e) => acc + (parseFloat(e.salary) || 0), 0).toLocaleString()}</h3>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="h-12 w-12 text-white" />
          </div>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Admin Control</p>
          <h3 className="text-3xl font-light text-amber-500">{employees.filter(e => e.user?.userRoles?.[0]?.role?.name === 'Admin').length}</h3>
        </div>
      </div>

      <div className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800 p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-hover:text-amber-500 transition-colors", isRTL ? "right-4" : "left-4")} />
          <Input
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("bg-slate-900 border-slate-800 rounded-none h-12 text-xs uppercase tracking-widest font-bold focus:border-amber-500/50 transition-all", isRTL ? "pr-12" : "pl-12")}
          />
        </div>
        <Button variant="ghost" className="text-slate-500 hover:text-white h-12 uppercase tracking-widest text-[10px] font-black border border-slate-800 rounded-none px-6">
          <Filter className="h-4 w-4 mr-2" /> {t('filters')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-none bg-slate-900/30 border border-slate-800 animate-pulse" />
          ))
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={emp.id}
              className="group bg-slate-950/40 backdrop-blur-xl border border-slate-800 p-8 rounded-none relative hover:border-amber-500/30 transition-all duration-500 shadow-3xl"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <Badge variant="outline" className="border-slate-800 text-slate-500 text-[8px] font-bold uppercase tracking-tighter px-2 rounded-none">#{emp.employeeNumber}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-950 border-slate-800 text-slate-300 shadow-2xl rounded-none">
                    <DropdownMenuItem className="cursor-pointer focus:bg-amber-500 focus:text-black uppercase text-[10px] font-bold tracking-widest" onClick={() => handleEdit(emp)}>
                      <Edit className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")} /> {t('edit')} Info
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer focus:bg-amber-500 focus:text-black uppercase text-[10px] font-bold tracking-widest" onClick={() => setResettingPasswordUser(emp)}>
                      <ShieldCheck className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")} /> {t('reset_password')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-rose-400 focus:bg-rose-500 focus:text-white uppercase text-[10px] font-bold tracking-widest" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")} /> {t('terminate')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group/avatar">
                  <div className="h-20 w-20 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center p-1 group-hover/avatar:border-amber-500/50 transition-all duration-700">
                    <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-amber-500 shadow-2xl">
                      <UserIcon className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-light text-white tracking-tight leading-none">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">{emp.position}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                    <Building className="h-3 w-3" /> {t('department')}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{emp.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                    <Briefcase className="h-3 w-3" /> {t('role')}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                    <span className="uppercase tracking-widest">{emp.position}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-800" />
                    <span className="text-amber-500/80 font-bold uppercase tracking-tighter">
                      {emp.user?.userRoles?.[0]?.role?.name || "No Role Assigned"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                    <Mail className="h-3 w-3" /> {t('email')}
                  </div>
                  <span className="text-xs text-slate-400 font-mono truncate max-w-[150px]">{emp.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                    <DollarSign className="h-3 w-3" /> {t('salary')}
                  </div>
                  <span className="text-xs text-emerald-500 font-mono font-bold">{t('currency_symbol')} {parseFloat(emp.salary || '0').toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-8">
                <Button variant="outline" className="w-full border-slate-800 rounded-none h-10 text-[9px] uppercase font-black hover:bg-slate-900 group/btn">
                  View Complete Dossier <ArrowRight className={cn("h-3 w-3 transition-transform group-hover/btn:translate-x-1", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center border border-slate-800 bg-slate-950/20">
            <UserIcon className="h-16 w-16 mx-auto text-slate-800 mb-6 opacity-20" />
            <p className="text-slate-600 italic text-sm">No personnel records found in current scope.</p>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-xl p-0 overflow-hidden rounded-none shadow-3xl">
          <div className="h-1 bg-amber-500 w-full shadow-lg shadow-amber-500/20"></div>
          <DialogHeader className="p-10 pb-4">
            <DialogTitle className="text-3xl font-light tracking-tight">
              {editingEmployee ? "Personnel Dossier Revision" : "Personnel Enrollment"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 uppercase tracking-[0.3em] font-bold text-[10px] mt-2">
              Enterprise Human Resource Management Engine
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('employee_number')}</Label>
                <Input
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  placeholder="EMP-000"
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none font-mono"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="corporate.email@domain.com"
                  disabled={!!editingEmployee}
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none text-xs"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('name')} ({t('first_name')})</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('name')} ({t('last_name')})</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('position')}</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Director of Operations"
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none text-sm"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('department')}</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Global Strategy"
                  className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-12 rounded-none text-sm"
                />
              </div>
              <div className="space-y-3 col-span-full">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('salary')}</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-xs">{t('currency_symbol')}</span>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="bg-slate-900 border-slate-800 focus:border-amber-500/50 h-14 pl-12 rounded-none font-mono text-xl text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 col-span-full">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">Enterprise Access Level (Role)</Label>
                <Select
                  value={formData.roleId}
                  onValueChange={(val) => setFormData({ ...formData, roleId: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-none focus:ring-amber-500/20">
                    <SelectValue placeholder="Select Professional Role Template" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-none">
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()} className="focus:bg-amber-500/10 focus:text-amber-500 rounded-none">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-10 flex border-t border-white/5 gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500 uppercase font-black text-[10px] px-8 h-12 rounded-none hover:bg-slate-900">
                Cancel
              </Button>
              <Button type="submit" className="bg-white text-black hover:bg-amber-50 h-12 px-12 rounded-none uppercase tracking-[0.2em] text-[10px] font-bold shadow-2xl transition-all" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Authorized Personnel Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!resettingPasswordUser} onOpenChange={() => setResettingPasswordUser(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md p-0 overflow-hidden rounded-none">
          <div className="h-1 bg-rose-500 w-full"></div>
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-light">{t('account_recovery')}</DialogTitle>
            <DialogDescription className="text-slate-500 uppercase tracking-widest font-bold text-[9px] mt-2">
              {t('reset_password')} {resettingPasswordUser?.firstName} {resettingPasswordUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-slate-600">{t('new_secure_password')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border-slate-800 focus:border-rose-500/50 h-12 rounded-none font-mono"
              />
              <p className="text-[9px] text-slate-500 italic">{t('password_too_short')}</p>
            </div>

            <DialogFooter className="pt-6 border-t border-white/5">
              <Button variant="ghost" onClick={() => setResettingPasswordUser(null)} className="text-slate-500 uppercase font-black text-[10px] rounded-none">
                {t('abort')}
              </Button>
              <Button onClick={handleResetPassword} className="bg-rose-600 hover:bg-rose-700 text-white h-11 px-8 rounded-none uppercase tracking-widest text-[10px] font-bold" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('confirm_overwrite')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
