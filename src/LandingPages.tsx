import type { ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';

type LandingProps = {
  logo: string;
  onHome: () => void;
  onContact: () => void;
};

const sharedTrust = ['Fully insured', 'Streak-free guarantee', 'Free estimates', 'Serving Northeast Ohio'];

function Shell({ logo, onHome, title, subtitle, children }: LandingProps & { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button type="button" onClick={onHome} className="flex items-center gap-2 text-left">
            <img src={logo} alt="Matt Stout Window Cleaning" className="h-10 w-auto" />
            <span className="font-semibold text-sm hidden sm:block">Matt Stout Window Cleaning</span>
          </button>
          <button type="button" onClick={onHome} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
            <ArrowLeft size={16} /> Home
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-2">Northeast Ohio</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{title}</h1>
        <p className="text-slate-300 text-lg mb-8">{subtitle}</p>
        {children}
        <div className="mt-12 flex flex-wrap gap-3">
          {sharedTrust.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5">
              <CheckCircle2 size={14} className="text-blue-400" /> {t}
            </span>
          ))}
        </div>
        <div className="mt-10">
          <button type="button" onClick={onHome} className="inline-block px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition">Get Free Estimate</button>
        </div>
      </main>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>Matt Stout Window Cleaning · (440) 497-9424 · Serving Northeast Ohio</p>
      </footer>
    </div>
  );
}

export function ResidentialPage(props: LandingProps) {
  return (
    <Shell {...props} title="Residential Window Cleaning in Northeast Ohio" subtitle="We make your home shine inside and out — streak-free glass, clean screens, and careful attention to tracks and frames.">
      <div className="space-y-4 text-slate-300">
        <p>Homeowners across Cleveland, Mentor, Avon Lake, and surrounding communities trust Matt Stout Window Cleaning for clear, professional results.</p>
        <h2 className="text-xl font-bold text-white pt-4">What&apos;s included</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Interior and exterior window cleaning</li>
          <li>Screen cleaning and track detailing</li>
          <li>Hard water stain treatment when needed</li>
          <li>Respect for your home — fully insured crew</li>
        </ul>
      </div>
    </Shell>
  );
}

export function CommercialPage(props: LandingProps) {
  return (
    <Shell {...props} title="Commercial Window Cleaning in Northeast Ohio" subtitle="Keep storefronts, offices, and commercial buildings looking professional year-round.">
      <div className="space-y-4 text-slate-300">
        <p>Reliable commercial window cleaning for retail storefronts, offices, and multi-unit buildings across Northeast Ohio.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Storefront and retail glass</li>
          <li>Office buildings and lobbies</li>
          <li>Recurring maintenance routes</li>
          <li>Post-construction glass cleanup</li>
        </ul>
      </div>
    </Shell>
  );
}

function CityPage({ city, nearby, ...props }: LandingProps & { city: string; nearby: string[] }) {
  return (
    <Shell {...props} title={`Window Cleaning in ${city}, OH`} subtitle={`Professional residential and commercial window cleaning for ${city} and nearby communities.`}>
      <div className="space-y-4 text-slate-300">
        <p className="flex items-start gap-2"><MapPin className="text-blue-400 shrink-0 mt-1" size={18} /><span>Matt Stout Window Cleaning proudly serves {city} and surrounding Northeast Ohio.</span></p>
        <p>Nearby: {nearby.join(' · ')}</p>
      </div>
    </Shell>
  );
}

export function ClevelandPage(props: LandingProps) {
  return <CityPage {...props} city="Cleveland" nearby={['Lakewood', 'Westlake', 'Parma', 'Euclid', 'Shaker Heights', 'Cleveland Heights']} />;
}
export function MentorPage(props: LandingProps) {
  return <CityPage {...props} city="Mentor" nearby={['Willoughby', 'Painesville', 'Eastlake', 'Kirtland', 'Mentor-on-the-Lake']} />;
}
export function AvonLakePage(props: LandingProps) {
  return <CityPage {...props} city="Avon Lake" nearby={['Avon', 'Bay Village', 'Westlake', 'North Ridgeville', 'Sheffield Lake']} />;
}
