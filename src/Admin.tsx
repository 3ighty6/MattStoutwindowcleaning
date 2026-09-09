import { useEffect, useRef, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { Camera, LogOut, RefreshCw, Upload, X } from 'lucide-react';

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0);
const LOCAL_KEY = 'msa_cash_invoices';

type CashInvoice = {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  method: 'cash' | 'check';
  checkNumber?: string;
  notes?: string;
  status: string;
  paidInPerson: boolean;
  proofDataUrl?: string;
  createdAt: string;
};

function loadLocal(): CashInvoice[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function saveLocal(items: CashInvoice[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 80))); } catch {}
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Admin({ logo, onHome }: { logo: string; onHome: () => void }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [dash, setDash] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    amount: '',
    method: 'cash' as 'cash' | 'check',
    checkNumber: '',
    notes: '',
  });
  const [proofDataUrl, setProofDataUrl] = useState('');
  const [camOn, setCamOn] = useState(false);
  const [preview, setPreview] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const startCam = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCamOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      cameraRef.current?.click();
    }
  };

  const snapCam = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.82);
    setProofDataUrl(url);
    stopCam();
  };

  const onPickFile = async (file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setProofDataUrl(url);
  };

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
      const remote = inv.data?.items || [];
      const local = loadLocal();
      const seen = new Set(remote.map((x: any) => String(x.id)));
      setInvoices([...local.filter((x) => !seen.has(x.id)), ...remote]);
      setStripeConfigured(!!pay.data?.stripeConfigured);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
      setInvoices(loadLocal());
    }
  };

  useEffect(() => { if (signedIn) loadAll(); }, [signedIn]);
  useEffect(() => () => stopCam(), []);

  const submitCashInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setOk('');
    const amount = Number(form.amount);
    if (!form.customerName.trim()) { setErr('Customer name is required.'); return; }
    if (!amount || amount <= 0) { setErr('Enter a valid amount.'); return; }
    if (form.method === 'check' && !form.checkNumber.trim()) { setErr('Enter the check number.'); return; }
    if (!proofDataUrl) { setErr('Take or upload a photo of the cash or check.'); return; }
    setSaving(true);
    const payload: CashInvoice = {
      id: 'cash_' + Date.now(),
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim() || undefined,
      customerPhone: form.customerPhone.trim() || undefined,
      amount,
      method: form.method,
      checkNumber: form.method === 'check' ? form.checkNumber.trim() : undefined,
      notes: form.notes.trim() || undefined,
      status: 'paid',
      paidInPerson: true,
      proofDataUrl,
      createdAt: new Date().toISOString(),
    };
    try {
      await api.post('/api/admin/invoices', {
        ...payload,
        send: true,
        paymentMethod: form.method,
        proofImage: proofDataUrl,
      });
      setOk('Paid ' + form.method + ' invoice saved' + (form.customerEmail ? ' and sent to ' + form.customerEmail : '') + '.');
    } catch {
      setOk('Saved on this device. Live send endpoint was unavailable.');
    }
    const next = [payload, ...loadLocal()];
    saveLocal(next);
    setInvoices((prev) => [payload, ...prev]);
    setForm({ customerName: '', customerEmail: '', customerPhone: '', amount: '', method: 'cash', checkNumber: '', notes: '' });
    setProofDataUrl('');
    setSaving(false);
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6 gap-3">
        <div className="min-w-0"><img src={logo} alt="" className="h-8 inline mr-2" /><span className="truncate">{userEmail}</span></div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={loadAll}><RefreshCw size={16} /></button>
          <button type="button" onClick={onHome}>Website</button>
          <button type="button" onClick={async () => { await auth.signOut(); setSignedIn(false); }}><LogOut size={16} /></button>
        </div>
      </div>
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      {ok && <p className="text-emerald-400 text-sm mb-3">{ok}</p>}
      <p className="text-sm mb-4">{stripeConfigured ? 'Stripe connected' : 'Stripe not connected'} · card payments stay on Stripe. This form is cash / check only.</p>
      {dash && <p className="text-2xl font-bold mb-6">Revenue {money(dash.totals?.jobRevenue || 0)}</p>}

      <section className="max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-8">
        <h2 className="font-semibold text-lg mb-1">Paid in person</h2>
        <p className="text-slate-400 text-sm mb-4">Record a cash or check invoice as paid. Photo of the payment is required — take it now or upload it now.</p>
        <form onSubmit={submitCashInvoice} className="space-y-3">
          <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Customer name" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="Email (to send receipt)" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />
            <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />
          </div>
          <input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />
          <div className="flex gap-2">
            {(['cash', 'check'] as const).map((m) => (
              <button type="button" key={m} onClick={() => setForm({ ...form, method: m })} className={'flex-1 py-2 rounded-lg border capitalize ' + (form.method === m ? 'bg-blue-600 border-blue-500' : 'bg-slate-950 border-slate-700')}>
                {m}
              </button>
            ))}
          </div>
          {form.method === 'check' && (
            <input required value={form.checkNumber} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} placeholder="Check number" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />
          )}
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Job / notes" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg" />

          <div className="border border-slate-700 rounded-xl p-3">
            <p className="text-sm font-medium mb-2">Payment photo</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={startCam} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 rounded-lg text-sm"><Camera size={16} /> Take photo</button>
              <button type="button" onClick={() => uploadRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 rounded-lg text-sm"><Upload size={16} /> Upload</button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
            <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
            {camOn && (
              <div className="mb-3">
                <video ref={videoRef} playsInline muted className="w-full max-h-64 rounded-lg bg-black object-cover" />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={snapCam} className="flex-1 py-2 bg-blue-600 rounded-lg text-sm">Capture</button>
                  <button type="button" onClick={stopCam} className="px-3 py-2 bg-slate-800 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            )}
            {proofDataUrl && (
              <div className="relative">
                <img src={proofDataUrl} alt="Payment proof" className="w-full max-h-56 object-contain rounded-lg bg-slate-950 cursor-zoom-in" onClick={() => setPreview(proofDataUrl)} />
                <button type="button" onClick={() => setProofDataUrl('')} className="absolute top-2 right-2 bg-black/70 rounded-full p-1"><X size={14} /></button>
              </div>
            )}
          </div>

          <button disabled={saving} className="w-full py-3 bg-blue-600 rounded-lg font-semibold disabled:opacity-60">
            {saving ? 'Saving…' : 'Save paid ' + form.method + ' invoice'}
          </button>
        </form>
      </section>

      <h2 className="font-semibold mb-2">Bookings</h2>
      {bookings.length === 0 && <p className="text-slate-500 text-sm mb-4">No bookings yet.</p>}
      {bookings.map((b) => <div key={b.id} className="text-sm border-b border-slate-800 py-2">{b.name} · {b.status}</div>)}

      <h2 className="font-semibold mt-6 mb-2">Invoices</h2>
      {invoices.length === 0 && <p className="text-slate-500 text-sm">No invoices yet.</p>}
      {invoices.map((inv) => (
        <div key={inv.id} className="text-sm border-b border-slate-800 py-3 flex gap-3 items-start">
          {inv.proofDataUrl || inv.proofImage ? (
            <img src={inv.proofDataUrl || inv.proofImage} alt="" className="w-14 h-14 object-cover rounded-md border border-slate-700 cursor-zoom-in" onClick={() => setPreview(inv.proofDataUrl || inv.proofImage)} />
          ) : null}
          <div className="min-w-0">
            <div>{inv.customerName} · {money(inv.amount)} · {inv.status}</div>
            <div className="text-slate-500 text-xs">
              {(inv.method || inv.paymentMethod || 'card')}
              {inv.checkNumber ? ' #' + inv.checkNumber : ''}
              {inv.paidInPerson ? ' · in person' : ''}
              {inv.createdAt ? ' · ' + new Date(inv.createdAt).toLocaleString() : ''}
            </div>
          </div>
        </div>
      ))}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview('')}>
          <img src={preview} alt="Payment" className="max-w-full max-h-[90vh] rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
