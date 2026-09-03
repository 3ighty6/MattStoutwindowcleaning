import { useState, useRef, useEffect } from 'react';
import { api } from '@appdeploy/client';
import {
  Home, Building2, Layers, Grid3X3, Droplets, HardHat,
  Sparkles, MessageCircle, X, Send,
  Menu, Paintbrush
} from 'lucide-react';
import {
  ResidentialPage, CommercialPage, ClevelandPage, MentorPage, AvonLakePage,
} from './LandingPages';
import Admin from './Admin';
import { MediaSlot, extractMedia } from './media';

type ChatMessage = { role: 'user' | 'assistant'; content: string; clips?: string[] };
const LOGO = '/resources/logo.jpg';
const SERVICES = [
  { icon: Home, title: 'Residential Window Cleaning', desc: 'We make your home shine inside and out.', img: '/resources/job2-bay-windows.jpg' },
  { icon: Building2, title: 'Commercial Window Cleaning', desc: 'Keep your business looking professional year-round.', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' },
  { icon: Layers, title: 'Interior & Exterior Glass', desc: 'Thorough cleaning for all types of glass.', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80' },
  { icon: Grid3X3, title: 'Screen Cleaning', desc: 'Dirt, dust & pollen removal for clearer views.', img: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80' },
  { icon: Droplets, title: 'Hard Water Stain Removal', desc: 'Restore glass to its original clarity.', img: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=600&q=80' },
  { icon: HardHat, title: 'Construction Cleanup', desc: 'Post-build glass and residue — we remove the mess and leave the shine.', img: '/resources/job4-glass-before-after.jpg' },
  { icon: Sparkles, title: 'Track Cleaning', desc: 'We clean the tracks others often miss.', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80' },
  { icon: Sparkles, title: 'Gutter Cleaning', desc: 'Clear clogged gutters and downspouts for proper drainage.', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
  { icon: Sparkles, title: 'Gutter Brightening', desc: 'Bright, white gutters make a big difference.', img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80' },
  { icon: Home, title: 'Roof Shingle Cleaning', desc: 'Remove algae, moss, and dirt to protect and refresh your roof.', img: '/resources/job5-roof-moss.jpg' },
  { icon: Paintbrush, title: 'Exterior Painting', desc: 'Professional exterior painting for lasting curb appeal.', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80' },
  { icon: Paintbrush, title: 'Interior Painting', desc: 'Clean, precise interior painting for every room.', img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80' },
];
const JOB_GALLERY = [
  { src: '/resources/job1-modern-exterior.jpg', label: 'Modern home exterior' },
  { src: '/resources/job1-worker-ladder.jpg', label: 'Window cleaning in progress' },
  { src: '/resources/job1-truck-spray.jpg', label: 'On-site crew' },
  { src: '/resources/job2-bay-windows.jpg', label: 'Residential windows' },
  { src: '/resources/job2-entry-windows.jpg', label: 'Entry glass cleaned' },
  { src: '/resources/job3-patio-clean.jpg', label: 'Patio power washing' },
  { src: '/resources/job3-surface-cleaner.jpg', label: 'Surface cleaner in action' },
  { src: '/resources/job4-glass-before-after.jpg', label: 'New-build glass cleanup' },
  { src: '/resources/job5-roof-moss.jpg', label: 'Roof moss removal' },
  { src: '/resources/job5-roof-blower.jpg', label: 'Roof debris clearing' },
  { src: '/resources/job5-truck-branded.jpg', label: 'Matt Stout on site' },
  { src: '/resources/job5-patio-cleanup.jpg', label: 'Cleanup after the job' },
];
const REVIEWS = [
  { name: 'Jennifer R.', loc: 'Avon Lake, OH', text: 'Our windows have never looked this good. Matt is professional, friendly and very detail oriented.' },
  { name: 'David M.', loc: 'Cleveland, OH', text: 'Professional, on time, and worth every penny. Our office building looks amazing year-round.' },
  { name: 'Sarah T.', loc: 'Mentor, OH', text: 'I highly recommend Matt Stout Window Cleaning. Great communication and top-tier results every time.' },
];
type Route = 'home' | 'residential' | 'commercial' | 'cleveland' | 'mentor' | 'avon-lake' | 'admin';
function pathToRoute(hash: string): Route {
  const h = (hash || '#/').replace(/^#\/?/, '') || '';
  if (h.startsWith('admin')) return 'admin';
  if (h.startsWith('residential')) return 'residential';
  if (h.startsWith('commercial')) return 'commercial';
  if (h.includes('cleveland')) return 'cleveland';
  if (h.includes('mentor')) return 'mentor';
  if (h.includes('avon')) return 'avon-lake';
  return 'home';
}
export default function App() {
  const [route, setRoute] = useState<Route>(() => typeof window !== 'undefined' ? pathToRoute(window.location.hash) : 'home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [introPhase, setIntroPhase] = useState<'playing' | 'fading' | 'done'>(() => {
    try { return sessionStorage.getItem('msa_intro_seen') === '1' ? 'done' : 'playing'; } catch { return 'playing'; }
  });
  const beginIntroFade = () => {
    setIntroPhase((p) => {
      if (p !== 'playing') return p;
      window.setTimeout(() => { setIntroPhase('done'); try { sessionStorage.setItem('msa_intro_seen', '1'); } catch {} }, 1100);
      return 'fading';
    });
  };
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: "Hi! I'm the Matt Stout Window Cleaning assistant. I can answer questions about our services or help you request an appointment. How can I help?" }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [formStatus, setFormStatus] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const onHash = () => setRoute(pathToRoute(window.location.hash)); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const goHome = () => { window.location.hash = ''; setRoute('home'); };
  if (route === 'residential') return <ResidentialPage logo={LOGO} onHome={goHome} onContact={goHome} />;
  if (route === 'commercial') return <CommercialPage logo={LOGO} onHome={goHome} onContact={goHome} />;
  if (route === 'cleveland') return <ClevelandPage logo={LOGO} onHome={goHome} onContact={goHome} />;
  if (route === 'mentor') return <MentorPage logo={LOGO} onHome={goHome} onContact={goHome} />;
  if (route === 'avon-lake') return <AvonLakePage logo={LOGO} onHome={goHome} onContact={goHome} />;
  if (route === 'admin') return <Admin logo={LOGO} onHome={goHome} />;
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim(); setInput(''); setMessages(prev => [...prev, { role: 'user', content: userMsg }]); setSending(true);
    try {
      const res = await api.post('/api/chat', { message: userMsg, history: messages.slice(-6) });
      const raw = String(res.data?.reply || 'Thanks — we will follow up soon.');
      const extra = [res.data?.clip, res.data?.video, res.data?.mp4].filter(Boolean) as string[];
      const parsed = extractMedia([raw, ...extra].join(' '));
      setMessages(prev => [...prev, { role: 'assistant', content: parsed.text || raw, clips: parsed.media }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble right now. Please use the contact form below.' }]);
    } finally { setSending(false); }
  };
  const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setFormStatus('Sending...');
    try { await api.post('/api/booking', data); setFormStatus('Thank you! We received your request and will be in touch soon.'); (e.target as HTMLFormElement).reset(); }
    catch { setFormStatus('Something went wrong. Please try again.'); }
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {introPhase !== 'done' && route === 'home' && (
        <div className={'fixed inset-0 z-[100] overflow-hidden bg-slate-950 transition-opacity duration-1000 ' + (introPhase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
          <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline onEnded={beginIntroFade}>
            <source src="/resources/intro-foam-intense.mp4" type="video/mp4" />
            <source src="/squeegee-intro.mp4" type="video/mp4" />
          </video>
          <div className="msa-intro-ui relative z-30 h-full flex flex-col items-center justify-center text-center px-6">
            <img src={LOGO} alt="MSA" className="h-24 sm:h-32 w-auto mb-6" />
            <p className="font-display text-2xl sm:text-4xl font-extrabold text-white mb-2">MATT STOUT</p>
            <p className="text-blue-400 text-sm tracking-[0.25em] uppercase mb-3">Window Cleaning</p>
            <button type="button" onClick={beginIntroFade} className="px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-lg">Enter Site</button>
          </div>
        </div>
      )}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2"><img src={LOGO} alt="Matt Stout" style={{height:'3.25rem'}} /><span className="font-bold text-sm">MATT STOUT</span></a>
          <div className="hidden md:flex gap-6 text-sm"><a href="#services">Services</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a></div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}><Menu size={22} /></button>
        </div>
      </nav>
      <section id="home" className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline loop><source src="/squeegee-intro.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold">CRYSTAL CLEAR<br /><span className="text-blue-400">WINDOWS.</span></h1>
          <p className="mt-4 text-slate-300">Serving Northeast Ohio</p>
          <a href="#contact" className="inline-block mt-6 px-7 py-3.5 bg-blue-600 rounded-lg font-semibold">Get Free Estimate</a>
        </div>
      </section>
      <section id="services" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-slate-900">
                <MediaSlot src={s.img} className="w-full h-full object-cover" label={s.title} />
              </div>
              <div className="p-5"><h3 className="font-semibold">{s.title}</h3><p className="text-slate-400 text-sm">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section id="gallery" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {JOB_GALLERY.map((item, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
              <MediaSlot src={item.src} className="w-full h-full object-cover" label={item.label} />
            </div>
          ))}
        </div>
      </section>
      <section id="reviews" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (<div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6"><p className="text-slate-300 mb-4">“{r.text}”</p><p className="font-semibold">{r.name}</p><p className="text-slate-500 text-sm">{r.loc}</p></div>))}
        </div>
      </section>
      <section id="contact" className="py-20">
        <form onSubmit={handleContact} className="max-w-3xl mx-auto px-4 space-y-4">
          <input name="name" required placeholder="Name" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg" />
          <input name="phone" placeholder="Phone" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg" />
          <input name="email" type="email" placeholder="Email" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg" />
          <textarea name="message" rows={4} placeholder="Message" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg" />
          <button className="w-full py-3 bg-blue-600 rounded-lg font-semibold">Send Message</button>
          {formStatus && <p className="text-blue-300 text-sm text-center">{formStatus}</p>}
        </form>
      </section>
      <footer className="py-8 text-center text-slate-500 text-sm">Matt Stout Window Cleaning · (440) 497-9424 · <a href="#/admin" className="text-blue-400">Admin</a></footer>
      <div className="fixed bottom-5 right-4 z-50">
        {chatOpen ? (
          <div className="w-80 h-96 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-3 flex justify-between border-b border-slate-800"><span>Assistant</span><button onClick={() => setChatOpen(false)}><X size={16} /></button></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  {m.content && <div className="text-sm whitespace-pre-wrap">{m.content}</div>}
                  {m.clips?.map((clip) => (
                    <video key={clip} src={clip} className="mt-2 w-full rounded-lg" autoPlay muted loop playsInline controls />
                  ))}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-800 rounded px-2" /><button onClick={sendMessage}><Send size={16} /></button></div>
          </div>
        ) : <button onClick={() => setChatOpen(true)} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center"><MessageCircle size={24} /></button>}
      </div>
    </div>
  );
}
