import React, { useEffect, useState } from 'react';

function Table({ children }: { children: React.ReactNode }) { return <table className="min-w-full border">{children}</table>; }
function TableHead({ children }: { children: React.ReactNode }) { return <thead className="bg-gray-100">{children}</thead>; }
function TableRow({ children, ...props }: any) { return <tr {...props}>{children}</tr>; }
function TableCell({ children, ...props }: any) { return <td className="border px-2 py-1" {...props}>{children}</td>; }
function TableBody({ children }: { children: React.ReactNode }) { return <tbody>{children}</tbody>; }

interface CustomerPayment {
  id: number;
  customer_id: number;
  invoice_id: number | null;
  amount: number;
  payment_date: string;
  method: string;
  reference: string;
  created_by: number;
  created_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
}
interface Customer {
  id: number;
  name: string;
}

interface CustomerPaymentFormProps {
  payment?: CustomerPayment;
  onSubmit: (data: Partial<CustomerPayment>) => void;
  onCancel: () => void;
  customers: Customer[];
  invoices: Invoice[];
  error?: string;
}

function CustomerPaymentForm({ payment, onSubmit, onCancel, customers, invoices, error }: CustomerPaymentFormProps) {
  const [form, setForm] = useState<Partial<CustomerPayment>>(payment || {});
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const validate = () => {
    if (!form.customer_id || !form.amount || !form.payment_date) {
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
        <label>Customer <select required value={form.customer_id || ''} onChange={e => setForm(f => ({ ...f, customer_id: Number(e.target.value) }))}>
          <option value="">Select customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

export default function CustomerPayments() {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState<CustomerPayment | undefined>(undefined);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [canManage, setCanManage] = useState(true); // TODO: fetch from session/permissions

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(() => setCustomers([]));
    fetch('/api/ar/sales-invoices')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(() => setInvoices([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/ar/customer-payments')
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(() => alert('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    setEditPayment(undefined);
    setShowForm(true);
  };
  const handleEdit = (pay: CustomerPayment) => {
    setEditPayment(pay);
    setShowForm(true);
  };
  const handleSubmit = async (data: Partial<CustomerPayment>) => {
    setError(undefined);
    try {
      if (editPayment) {
        const res = await fetch(`/api/ar/customer-payments/${editPayment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update payment');
      } else {
        const res = await fetch('/api/ar/customer-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create payment');
      }
      setShowForm(false);
      setEditPayment(undefined);
      setLoading(true);
      fetch('/api/ar/customer-payments')
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
      const res = await fetch(`/api/ar/customer-payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
      setLoading(true);
      fetch('/api/ar/customer-payments')
        .then(res => res.json())
        .then(data => setPayments(data))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Customer Payments</h2>
      {showForm ? (
        <CustomerPaymentForm
          payment={editPayment}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          customers={customers}
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
                <TableCell>Customer</TableCell>
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
                    <TableCell>{customers.find(c => c.id === pay.customer_id)?.name || pay.customer_id}</TableCell>
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
