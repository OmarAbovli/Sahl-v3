"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/actions/hr";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Assuming shadcn table exists or revert to standard

interface HRPayrollManagementProps {
  user: any;
  canManage: boolean;
  canView: boolean;
}

export function HRPayrollManagement({ user, canManage, canView }: HRPayrollManagementProps) {
  const { t, isRTL } = useTranslation();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // Details View State
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]); // Placeholder for now
  const [debts, setDebts] = useState<any[]>([]); // Placeholder for now

  useEffect(() => {
    if (canView && user.companyId) {
      loadEmployees();
    }
  }, [canView, user.companyId]);

  async function loadEmployees() {
    setLoading(true);
    const res = await getEmployees(user.companyId);
    if (res.success && res.employees) {
      // Map camelCase to snake_case if needed by UI or just use camelCase in UI
      // Let's switch UI to camelCase to be modern
      setEmployees(res.employees);
    } else {
      toast.error("Failed to load employees");
    }
    setLoading(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createEmployee({ ...form, companyId: user.companyId });
      if (res.success && res.employee) {
        toast.success("Employee Added");
        setEmployees([res.employee, ...employees]);
        setShowAdd(false);
        setForm({});
      } else {
        toast.error(res.error || "Failed");
      }
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateEmployee(editing.id, form);
      if (res.success && res.employee) {
        toast.success("Employee Updated");
        setEmployees(employees.map(emp => emp.id === editing.id ? res.employee : emp));
        setEditing(null);
        setForm({});
      } else {
        toast.error(res.error || "Failed");
      }
    });
  }

  async function handleDelete(emp: any) {
    if (!confirm("Delete employee?")) return;
    const res = await deleteEmployee(emp.id);
    if (res.success) {
      toast.success("Employee Deleted");
      setEmployees(employees.filter(e => e.id !== emp.id));
    } else {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>HR & Payroll Management</CardTitle>
            {canManage && !editing && (
              <Button onClick={() => setShowAdd(!showAdd)} className="bg-amber-600 hover:bg-amber-700">
                {showAdd ? "Cancel" : "Add Employee"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4 mb-6 p-4 border border-slate-800 rounded bg-slate-950/50">
              <Input className="bg-slate-900 border-slate-800" name="employee_number" placeholder="Employee Number" onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="first_name" placeholder="First Name" onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="last_name" placeholder="Last Name" onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="position" placeholder="Position" onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="department" placeholder="Department" onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="salary" placeholder="Salary" type="number" onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="hire_date" placeholder="Hire Date (YYYY-MM-DD)" type="date" onChange={handleInput} />
              <Button type="submit" className="col-span-2 bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>Save Employee</Button>
            </form>
          )}

          {editing && (
            <form onSubmit={handleEdit} className="grid grid-cols-2 gap-4 mb-6 p-4 border border-slate-800 rounded bg-slate-950/50">
              <Input className="bg-slate-900 border-slate-800" name="employee_number" placeholder="Employee Number" defaultValue={editing.employeeNumber} onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="first_name" placeholder="First Name" defaultValue={editing.firstName} onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="last_name" placeholder="Last Name" defaultValue={editing.lastName} onChange={handleInput} required />
              <Input className="bg-slate-900 border-slate-800" name="position" placeholder="Position" defaultValue={editing.position} onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="department" placeholder="Department" defaultValue={editing.department} onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="salary" placeholder="Salary" type="number" defaultValue={editing.salary} onChange={handleInput} />
              <Input className="bg-slate-900 border-slate-800" name="hire_date" placeholder="Hire Date" type="date" defaultValue={editing.hireDate ? new Date(editing.hireDate).toISOString().slice(0, 10) : ''} onChange={handleInput} />
              <div className="col-span-2 flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>Update</Button>
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300" onClick={() => { setEditing(null); setForm({}); }}>Cancel</Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-md border border-slate-800">
            <table className="min-w-full text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Position</th>
                  <th className="text-left p-3 font-medium">Department</th>
                  <th className="text-left p-3 font-medium">Salary</th>
                  <th className="text-left p-3 font-medium">Hire Date</th>
                  {canManage && <th className="text-left p-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-slate-500">No employees found.</td></tr>
                ) : employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                    <td className="p-3">{emp.employeeNumber}</td>
                    <td className="p-3">{emp.firstName} {emp.lastName}</td>
                    <td className="p-3">{emp.position}</td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3 font-mono text-emerald-500">{t('currency_symbol')} {Number(emp.salary).toLocaleString()}</td>
                    <td className="p-3">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : ''}</td>
                    {canManage && (
                      <td className="p-3 flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 border-slate-700" onClick={() => { setEditing(emp); setForm(emp); }}>Edit</Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleDelete(emp)}>Delete</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}