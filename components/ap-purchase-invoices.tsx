import React, { useEffect, useState } from 'react';

function Table({ children }: { children: React.ReactNode }) { return <table className="min-w-full border">{children}</table>; }
function TableHead({ children }: { children: React.ReactNode }) { return <thead className="bg-gray-100">{children}</thead>; }
function TableRow({ children, ...props }: any) { return <tr {...props}>{children}</tr>; }
function TableCell({ children, ...props }: any) { return <td className="border px-2 py-1" {...props}>{children}</td>; }
function TableBody({ children }: { children: React.ReactNode }) { return <tbody>{children}</tbody>; }

interface Supplier { id: number; name: string; }
interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  issue_date: string;
  due_date: string;
  total: number;
  status: string;
}

interface PurchaseInvoiceFormProps {
  invoice?: PurchaseInvoice;
  onSubmit: (data: Partial<PurchaseInvoice>) => void;
  onCancel: () => void;
  suppliers: Supplier[];
  error?: string;
}

function PurchaseInvoiceForm({ invoice, onSubmit, onCancel, suppliers, error }: PurchaseInvoiceFormProps) {
  const [form, setForm] = useState<Partial<PurchaseInvoice>>(invoice || {});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const validate = () => {
    if (!form.invoice_number || !form.supplier_id || !form.issue_date || !form.total) {
      setFormError('All required fields must be filled.');
      return false;
    }
    setFormError(undefined);
    return true;
  };
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit(form);
      }}
      className="mb-4"
    >
      {formError && <div className="mb-2 text-red-600">{formError}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      <div className="mb-2">
        <label>Invoice # <input required value={form.invoice_number || ''} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} /></label>
      </div>
      <div className="mb-2">
        <label>Supplier <select required value={form.supplier_id || ''} onChange={e => setForm(f => ({ ...f, supplier_id: Number(e.target.value) }))}>
          <option value="">Select supplier</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label>
      </div>
      <div className="mb-2">
        <label>Issue Date <input required type="date" value={form.issue_date || ''} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></label>
      </div>
      <div className="mb-2">
        <label>Due Date <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></label>
      </div>
      <div className="mb-2">
        <label>Total <input required type="number" step="0.01" value={form.total || ''} onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))} /></label>
      </div>
      <div className="mb-2">
        <label>Status <input value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} /></label>
      </div>
      <button type="submit" className="mr-2 px-4 py-2 bg-green-600 text-white rounded">Save</button>
      <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
    </form>
  );
}

export default function PurchaseInvoices() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<PurchaseInvoice | undefined>(undefined);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [canManage, setCanManage] = useState(true); // TODO: fetch from session/permissions

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => setSuppliers(data))
      .catch(() => setSuppliers([]));
    fetch('/api/ap/purchase-invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    setEditInvoice(undefined);
    setShowForm(true);
  };
  const handleEdit = (inv: PurchaseInvoice) => {
    setEditInvoice(inv);
    setShowForm(true);
  };
  const handleSubmit = async (data: Partial<PurchaseInvoice>) => {
    setError(undefined);
    try {
      if (editInvoice) {
        const res = await fetch(`/api/ap/purchase-invoices/${editInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update invoice');
      } else {
        const res = await fetch('/api/ap/purchase-invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create invoice');
      }
      setShowForm(false);
      setEditInvoice(undefined);
      setLoading(true);
      fetch('/api/ap/purchase-invoices')
        .then(res => res.json())
        .then(data => setInvoices(data))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(e.message);
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this invoice?')) return;
    setError(undefined);
    try {
      const res = await fetch(`/api/ap/purchase-invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      setLoading(true);
      fetch('/api/ap/purchase-invoices')
        .then(res => res.json())
        .then(data => setInvoices(data))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Purchase Invoices</h2>
      {showForm ? (
        <PurchaseInvoiceForm
          invoice={editInvoice}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          suppliers={suppliers}
          error={error}
        />
      ) : (
        <>
          {canManage && <button className="mb-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreate}>Create Invoice</button>}
          {error && <div className="mb-2 text-red-600">{error}</div>}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7}>No invoices found.</TableCell></TableRow>
              ) : (
                invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number}</TableCell>
                    <TableCell>{suppliers.find(s => s.id === inv.supplier_id)?.name || inv.supplier_id}</TableCell>
                    <TableCell>{inv.issue_date}</TableCell>
                    <TableCell>{inv.due_date}</TableCell>
                    <TableCell>{inv.total}</TableCell>
                    <TableCell>{inv.status}</TableCell>
                    <TableCell>
                      {canManage && <>
                        <button className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEdit(inv)}>Edit</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(inv.id)}>Delete</button>
                      </>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
