import React, { useState, useEffect } from 'react';
import { InstitutionalBanner, InstitutionalLogosStrip, Logo } from './components/Logo';
import { LandingView } from './components/PublicPortal/LandingView';
import { BookingWizard } from './components/PublicPortal/BookingWizard';
import { LookupModal } from './components/PublicPortal/LookupModal';
import { WebTvModal } from './components/PublicPortal/WebTvModal';
import { PolicyModal } from './components/PublicPortal/PolicyModal';
import { AdminDashboard } from './components/Crm/AdminDashboard';
import { CrmLoginView } from './components/Crm/CrmLoginView';
import { WebTvVideo, CrmOperator } from './types';
import {
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'public' | 'booking' | 'admin'>('public');

  // Authenticated CRM Operator Session
  const [crmUser, setCrmUser] = useState<CrmOperator | null>(() => {
    try {
      const saved = localStorage.getItem('crm_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Booking pre-selection states
  const [initialSportelloId, setInitialSportelloId] = useState<string | undefined>(undefined);
  const [initialComune, setInitialComune] = useState<string | undefined>(undefined);
  const [initialGrantTitle, setInitialGrantTitle] = useState<string | undefined>(undefined);

  // Modals
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [selectedWebTvVideo, setSelectedWebTvVideo] = useState<WebTvVideo | null>(null);
  const [policyModalType, setPolicyModalType] = useState<'privacy' | 'cookies' | null>(null);
  const [adminInitialTab, setAdminInitialTab] = useState<string>('cruscotto');
  const [adminInitialSubTab, setAdminInitialSubTab] = useState<string | undefined>(undefined);

  // Parse URL query params on load (e.g. ?source=qrcode&comune=Isernia or ?admin=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    const tabParam = params.get('tab');
    const subtabParam = params.get('subtab');
    const comuneParam = params.get('comune');
    const sportelloParam = params.get('sportello');
    const bandoParam = params.get('bando');

    if (adminParam === 'true') {
      if (tabParam) setAdminInitialTab(tabParam);
      if (subtabParam) setAdminInitialSubTab(subtabParam);
      setMode('admin');
    } else if (comuneParam || sportelloParam || bandoParam) {
      if (comuneParam) setInitialComune(comuneParam);
      if (sportelloParam) setInitialSportelloId(sportelloParam);
      if (bandoParam) setInitialGrantTitle(bandoParam);
      setMode('booking');
    }
  }, []);

  const handleStartBooking = (
    sportelloOrParams?: string | { userType?: 'IMPRESA' | 'ASPIRANTE'; initialSportelloId?: number; source?: string; grantTitle?: string },
    comune?: string,
    grantTitle?: string
  ) => {
    if (typeof sportelloOrParams === 'object' && sportelloOrParams !== null) {
      if (sportelloOrParams.initialSportelloId) setInitialSportelloId(String(sportelloOrParams.initialSportelloId));
      if (sportelloOrParams.grantTitle) setInitialGrantTitle(sportelloOrParams.grantTitle);
    } else if (typeof sportelloOrParams === 'string') {
      setInitialSportelloId(sportelloOrParams);
    }
    if (comune) setInitialComune(comune);
    if (grantTitle) setInitialGrantTitle(grantTitle);
    setMode('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenShowcaseConfig = () => {
    setAdminInitialTab('comunicazione');
    setAdminInitialSubTab('vetrina');
    setMode('admin');
  };

  const handleOpenCrmEventi = () => {
    setAdminInitialTab('eventi');
    setAdminInitialSubTab('eventi');
    setMode('admin');
  };

  const handleWatchVideo = (video: WebTvVideo) => {
    setSelectedWebTvVideo(video);
  };

  const handleBookFromVideo = (video: WebTvVideo) => {
    setSelectedWebTvVideo(null);
    handleStartBooking(undefined, undefined, video.bando_titolo || video.titolo);
  };

  const handleCrmLoginSuccess = (operator: CrmOperator) => {
    setCrmUser(operator);
    localStorage.setItem('crm_auth_session', JSON.stringify(operator));
    setMode('admin');
  };

  const handleCrmLogout = () => {
    setCrmUser(null);
    localStorage.removeItem('crm_auth_session');
    setMode('public');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white w-full max-w-full overflow-x-clip">
      
      {/* Header Sticky Group: Institutional Banner + Navigation Bar permanently fixed on scroll */}
      <div className={mode !== 'admin' ? "sticky top-0 z-50 w-full bg-white shadow-xs" : "w-full"}>
        {/* 1. Institutional Banner at top */}
        <InstitutionalBanner />

        {/* 2. Header (Rendered in Public & Booking modes) */}
        {mode !== 'admin' && (
          <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs w-full min-w-0">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-end md:justify-between gap-3 min-w-0">
            
            {/* Desktop Navigation Links (when on public landing) */}
            {mode === 'public' && (
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
                <a
                  href="#news"
                  className="hover:text-sky-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>News ed Eventi</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold">
                    NUOVO
                  </span>
                </a>
                <a href="#sportelli" className="hover:text-sky-700 transition-colors">
                  Sportelli
                </a>
                <a href="#contatti" className="hover:text-sky-700 transition-colors">
                  Contatti
                </a>
              </nav>
            )}

            {/* Navigation Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Mobile News Jump Button */}
              {mode === 'public' && (
                <a
                  href="#news"
                  className="md:hidden px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold transition-colors"
                >
                  News
                </a>
              )}

              {/* Book Appointment CTA (when on public landing) */}
              {mode === 'public' && (
                <button
                  onClick={() => handleStartBooking()}
                  className="cta-blink animate-lampeggio flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-600/25 transition-all shrink-0 cursor-pointer whitespace-nowrap"
                  title="Prenota subito un appuntamento"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Prenota Ora</span>
                </button>
              )}

              {/* Exit Booking to Home */}
              {mode === 'booking' && (
                <button
                  onClick={() => setMode('public')}
                  className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0"
                >
                  <span className="hidden sm:inline">Torna alla </span>Home
                </button>
              )}

              {/* Backoffice / CRM button */}
              <button
                onClick={() => setMode('admin')}
                className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 ${
                  crmUser
                    ? 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100'
                    : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-950'
                }`}
                title={
                  crmUser
                    ? `Accesso CRM attivo come ${crmUser.nome} ${crmUser.cognome} (${crmUser.ruolo})`
                    : 'Accesso riservato previo inserimento credenziali'
                }
                aria-label="Area Riservata CRM"
              >
                {crmUser ? (
                  <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span className="hidden md:inline">
                  {crmUser ? `CRM (${crmUser.username})` : 'Area CRM'}
                </span>
              </button>
            </div>

          </div>
        </header>
      )}
      </div>

      {/* 3. Main Body */}
      <div className="flex-1">
        {mode === 'public' && (
          <LandingView
            onStartBooking={handleStartBooking}
            onWatchVideo={handleWatchVideo}
            onOpenWebTvModal={handleWatchVideo}
            onOpenLookup={() => setShowLookupModal(true)}
            onOpenCrmShowcaseConfig={handleOpenShowcaseConfig}
            onOpenCrmEventi={handleOpenCrmEventi}
          />
        )}

        {mode === 'booking' && (
          <BookingWizard
            initialSportelloId={initialSportelloId}
            initialComune={initialComune}
            initialGrantTitle={initialGrantTitle}
            onCancel={() => setMode('public')}
          />
        )}

        {mode === 'admin' && (
          crmUser ? (
            <AdminDashboard
              currentUser={crmUser}
              onLogout={handleCrmLogout}
              onExitCrm={() => setMode('public')}
              initialTab={adminInitialTab}
              initialSubTab={adminInitialSubTab}
            />
          ) : (
            <CrmLoginView
              onLoginSuccess={handleCrmLoginSuccess}
              onExitCrm={() => setMode('public')}
            />
          )
        )}
      </div>

      {/* 4. Public Footer (Rendered in Public & Booking modes) */}
      {mode !== 'admin' && (
        <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 pb-20 md:pb-0">
          {/* Bottom Bar with Official Institutional Logos */}
          <div className="bg-slate-950 py-6 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Iniziativa promossa e finanziata da:
                </span>
                <InstitutionalLogosStrip variant="dark" size="xs" />
              </div>
              {mode === 'booking' && (
                <div className="flex flex-col items-start md:items-end text-[11px] text-slate-400 gap-1">
                  <p>© {new Date().getFullYear()} Regione Molise • Sviluppo Italia Molise S.p.A.</p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span>PR Molise FESR FSE+ 2021-2027</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPolicyModalType('privacy')}
                      className="hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPolicyModalType('cookies')}
                      className="hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      Cookie Policy
                    </button>
                    <span>•</span>
                    <span>CUP J19B25000190009</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* Lookup / Search modal */}
      <LookupModal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
      />

      {/* Web TV Player Modal */}
      <WebTvModal
        video={selectedWebTvVideo}
        onClose={() => setSelectedWebTvVideo(null)}
        onBookForVideo={handleBookFromVideo}
      />

      {/* Privacy & Cookie Policy Modal */}
      {policyModalType && (
        <PolicyModal
          type={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}

    </div>
  );
}
