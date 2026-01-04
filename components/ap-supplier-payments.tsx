import React, { useEffect, useState } from 'react';

function Table({ children }: { children: React.ReactNode }) { return <table className="min-w-full border">{children}</table>; }
function TableHead({ children }: { children: React.ReactNode }) { return <thead className="bg-gray-100">{children}</thead>; }
function TableRow({ children, ...props }: any) { return <tr {...props}>{children}</tr>; }
function TableCell({ children, ...props }: any) { return <td className="border px-2 py-1" {...props}>{children}</td>; }
function TableBody({ children }: { children: React.ReactNode }) { return <tbody>{children}</tbody>; }

interface Supplier { id: number; name: string; }
interface PurchaseInvoice { id: number; invoice_number: string; }
interface SupplierPayment {
  id: number;
  supplier_id: number;
  invoice_id: number | null;
  amount: number;
  payment_date: string;
  method: string;
  reference: string;
  created_by: number;
  created_at: string;
}

interface SupplierPaymentFormProps {
  payment?: SupplierPayment;
  onSubmit: (data: Partial<SupplierPayment>) => void;
  onCancel: () => void;
  suppliers: Supplier[];
  invoices: PurchaseInvoice[];
  error?: string;
}

function SupplierPaymentForm({ payment, onSubmit, onCancel, suppliers, invoices, error }: SupplierPaymentFormProps) {
  const [form, setForm] = useState<Partial<SupplierPayment>>(payment || {});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const validate = () => {
    if (!form.supplier_id || !form.amount || !form.payment_date) {
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
        <label>Supplier <select required value={form.supplier_id || ''} onChange={e => setForm(f => ({ ...f, supplier_id: Number(e.target.value) }))}>
          <option value="">Select supplier</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label>
      </div>
      <div className="mb-2">
        <label>Invoice <select value={form.invoice_id || ''} onChange={e => setForm(f => ({ ...f, invoice_id: Number(e.target.value) }))}>
          <option value="">(Optional) Link to invoice</option>
          {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>)}
        </select></label>
      </div>
      <div className="mb-2">
        <label>Amount <input required type="number" step="0.01" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} /></label>
      </div>
      <div className="mb-2">
        <label>Payment Date <input required type="date" value={form.payment_date || ''} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} /></label>
      </div>
      <div className="mb-2">
        <label>Method <input value={form.method || ''} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} /></label>
      </div>
      <div className="mb-2">
        <label>Reference <input value={form.reference || ''} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} /></label>
      </div>
      <button type="submit" className="mr-2 px-4 py-2 bg-green-600 text-white rounded">Save</button>
      <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-400 text-white rounded">Cancel</button>
    </form>
  );
}

export default function SupplierPayments() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState<SupplierPayment | undefined>(undefined);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
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
      .catch(() => setInvoices([]));
    fetch('/api/ap/supplier-payments')
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    setEditPayment(undefined);
    setShowForm(true);
  };
  const handleEdit = (pay: SupplierPayment) => {
    setEditPayment(pay);
    setShowForm(true);
  };
  const handleSubmit = async (data: Partial<SupplierPayment>) => {
    setError(undefined);
    try {
      if (editPayment) {
        const res = await fetch(`/api/ap/supplier-payments/${editPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update payment');
      } else {
        const res = await fetch('/api/ap/supplier-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create payment');
      }
      setShowForm(false);
      setEditPayment(undefined);
      setLoading(true);
      fetch('/api/ap/supplier-payments')
        .then(res => res.json())
        .then(data => setPayments(data))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(e.message);
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this payment?')) return;
    setError(undefined);
    try {
      const res = await fetch(`/api/ap/supplier-payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
      setLoading(true);
      fetch('/api/ap/supplier-payments')
        .then(res => res.json())
        .then(data => setPayments(data))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Supplier Payments</h2>
      {showForm ? (
        <SupplierPaymentForm
          payment={editPayment}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          suppliers={suppliers}
          invoices={invoices}
          error={error}
        />
      ) : (
        <>
          {canManage && <button className="mb-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreate}>Record Payment</button>}
          {error && <div className="mb-2 text-red-600">{error}</div>}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Supplier</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7}>No payments found.</TableCell></TableRow>
              ) : (
                payments.map(pay => (
                  <TableRow key={pay.id}>
                    <TableCell>{suppliers.find(s => s.id === pay.supplier_id)?.name || pay.supplier_id}</TableCell>
                    <TableCell>{invoices.find(inv => inv.id === pay.invoice_id)?.invoice_number || '-'}</TableCell>
                    <TableCell>{pay.amount}</TableCell>
                    <TableCell>{pay.payment_date}</TableCell>
                    <TableCell>{pay.method}</TableCell>
                    <TableCell>{pay.reference}</TableCell>
                    <TableCell>
                      {canManage && <>
                        <button className="mr-2 px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEdit(pay)}>Edit</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(pay.id)}>Delete</button>
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
