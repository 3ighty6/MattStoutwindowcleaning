import { useEffect, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { LogOut, RefreshCw } from 'lucide-react';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function Admin({ logo, onHome }: { logo: string; onHome: () => void }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [err, setErr] = useState('');
  const [dash, setDash] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (auth.isSignedIn()) {
          const u = await auth.getUser();
          setSignedIn(!!u);
          setUserEmail(u?.email || '');
        }
      } finally { setReady(true); }
    })();
  }, []);

  const loadAll = async () => {
    try {
      const [d, b, inv, pay] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/bookings'),
        api.get('/api/admin/invoices'),
        api.get('/api/admin/pay/status'),
      ]);
      setDash(d.data);
      setBookings(b.data?.items || []);
      setInvoices(inv.data?.items || []);
      setStripeConfigured(!!pay.data?.stripeConfigured);
    } catch (e: any) { setErr(e?.message || 'Failed to load'); }
  };

  useEffect(() => { if (signedIn) loadAll(); }, [signedIn]);

  if (!ready) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading admin…</div>;
  if (!signedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
          <img src={logo} alt="MSA" className="h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Owner Admin</h1>
          {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
          <button type="button" onClick={async () => { const res = await auth.signIn({ scope: 'openid email profile offline_access' }); setSignedIn(true); setUserEmail(res.user.email || ''); }} className="w-full py-3 bg-blue-600 rounded-lg">Sign in as owner</button>
          <button type="button" onClick={onHome} className="mt-4 text-sm text-slate-400">Back to website</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div><img src={logo} alt="" className="h-8 inline mr-2" />{userEmail}</div>
        <div className="flex gap-2">
          <button type="button" onClick={loadAll}><RefreshCw size={16} /></button>
          <button type="button" onClick={onHome}>Website</button>
          <button type="button" onClick={async () => { await auth.signOut(); setSignedIn(false); }}><LogOut size={16} /></button>
        </div>
      </div>
      {err && <p className="text-red-400">{err}</p>}
      <p className="text-sm mb-4">{stripeConfigured ? 'Stripe connected' : 'Stripe not connected'}</p>
      {dash && <p className="text-2xl font-bold mb-4">Revenue {money(dash.totals?.jobRevenue || 0)}</p>}
      <h2 className="font-semibold mb-2">Bookings</h2>
      {bookings.map(b => <div key={b.id} className="text-sm border-b border-slate-800 py-2">{b.name} · {b.status}</div>)}
      <h2 className="font-semibold mt-6 mb-2">Invoices</h2>
      {invoices.map(inv => <div key={inv.id} className="text-sm border-b border-slate-800 py-2">{inv.customerName} · {money(inv.amount)} · {inv.status}</div>)}
    </div>
  );
}
