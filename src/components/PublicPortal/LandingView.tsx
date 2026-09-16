import React, { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { MoliseMap } from '../MoliseMap';
import { Sportello, WebTvVideo } from '../../types';
import { HeroShowcaseWidget } from './HeroShowcaseWidget';
import { PolicyModal } from './PolicyModal';
import {
  Calendar,
  Phone,
  MessageCircle,
  Play,
  ArrowRight,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  HelpCircle,
  Share2,
  ExternalLink
} from 'lucide-react';

interface LandingViewProps {
  onStartBooking: (params?: { userType?: 'IMPRESA' | 'ASPIRANTE'; initialSportelloId?: number; source?: string; grantTitle?: string }) => void;
  onOpenLookup: () => void;
  onOpenWebTvModal?: (video: WebTvVideo) => void;
  onWatchVideo?: (video: WebTvVideo) => void;
  onOpenCrmShowcaseConfig?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartBooking,
  onOpenLookup,
  onOpenWebTvModal,
  onWatchVideo,
  onOpenCrmShowcaseConfig
}) => {
  const handleVideoClick = onOpenWebTvModal || onWatchVideo || (() => {});
  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [videos, setVideos] = useState<WebTvVideo[]>([]);
  const [activeRubrica, setActiveRubrica] = useState<string>('Tutte');
  const [selectedSportello, setSelectedSportello] = useState<Sportello | null>(null);
  const [policyModalType, setPolicyModalType] = useState<'privacy' | 'cookies' | null>(null);

  useEffect(() => {
    fetch('/api/sportelli')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSportelli(list);
        if (list.length > 0) setSelectedSportello(list[0]);
      })
      .catch((err) => {
        console.error(err);
        setSportelli([]);
      });

    fetch('/api/webtv/video')
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setVideos([]);
      });
  }, []);

  const rubriche = [
    'Tutte',
    'Storie d\'impresa',
    'Scadenze della settimana',
    'Pillole sui bandi',
    'Protagonisti del Molise'
  ];

  const filteredVideos = activeRubrica === 'Tutte'
    ? videos
    : videos.filter((v) => v.rubrica === activeRubrica);

  const featuredVideo = videos.length > 0 ? videos[0] : null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* Top Contact Hotline Bar */}
      <div className="bg-slate-900 text-slate-300 py-2 sm:py-2 px-3 sm:px-4 text-xs border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Mobile & Desktop Contact Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3.5 w-full md:w-auto">
            {/* Label */}
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] sm:text-xs uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Contact Center</span>
            </div>

            {/* Action buttons: on mobile two balanced cards, on larger screens clean pills */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Phone */}
              <a
                href="tel:0874011011"
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 active:bg-slate-700 border border-slate-700/80 text-white hover:text-sky-300 font-bold transition-all text-xs shadow-xs"
                title="Chiama il Contact Center 0874 011011"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-3 h-3 text-sky-400" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-1 text-left sm:text-center leading-tight">
                  <span className="text-[10px] text-slate-400 sm:hidden uppercase tracking-wider font-medium">Chiama</span>
                  <span className="font-mono tracking-tight font-bold">0874 011011</span>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/390874011011?text=Buongiorno%2C%20vorrei%20informazioni%20sullo%20Sportello%20Imprese%20Molise"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 sm:py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 active:bg-emerald-900/70 border border-emerald-700/60 text-emerald-300 hover:text-emerald-200 font-bold transition-all text-xs shadow-xs"
                title="Invia messaggio WhatsApp al 0874 011011"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-1 text-left sm:text-center leading-tight">
                  <span className="text-[10px] text-emerald-400/80 sm:hidden uppercase tracking-wider font-medium">WhatsApp</span>
                  <span className="font-mono tracking-tight font-bold">0874 011011</span>
                </div>
              </a>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400/60"></span>
            <span> Programma Molise FESR FSE+</span>
          </div>
        </div>
      </div>

      {/* Hero Section styled after the official poster */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-white to-slate-50 border-b border-sky-100 py-10 sm:py-16 px-4 sm:px-6">
        {/* Decorative pastel backdrop curves */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-sky-200/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-sky-200 shadow-xs text-xs font-semibold text-sky-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{sportelli.length > 0 ? `${sportelli.length} Sportelli territoriali` : 'Sportelli territoriali'}</span>
            </div>

            <div className="space-y-2">
              <Logo size="lg" />
              <div className="pt-2">
                <span className="text-sky-600 text-lg sm:text-xl font-bold tracking-wide uppercase block font-display">
                  SUPPORTIAMO
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 uppercase tracking-tight leading-none font-display">
                  LA TUA IMPRESA
                </h1>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sky-700 uppercase tracking-tight block font-display mt-1">
                  O LA TUA IDEA IMPRENDITORIALE
                </span>
              </div>
            </div>

            <p className="text-slate-700 text-base sm:text-lg max-w-2xl leading-relaxed">
              <strong>Sportello Imprese</strong> ti accompagna nello sviluppo della tua idea o della tua impresa sul territorio del Molise. Un servizio pubblico, qualificato e completamente gratuito.
            </p>

            {/* Poster 4 Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-xs sm:text-sm text-slate-800 font-medium pt-1">
              <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                <span>Fornisce informazioni sui bandi di agevolazione</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                <span>Promuove la cultura d'impresa</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Supporta i processi di innovazione</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>Favorisce il processo di scoperta imprenditoriale (EDP)</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onStartBooking()}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-base shadow-lg shadow-sky-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-5 h-5 text-sky-200" />
                <span>Prenota un appuntamento</span>
                <ArrowRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
              <span>Nessun login richiesto</span>
              <span>•</span>
              <span>Prenotazione in meno di 3 minuti</span>
              <span>•</span>
              <span>Promemoria PDF e supporto in presenza o videocall</span>
            </div>
          </div>

          {/* Right Column: Dynamic Hero Showcase (Carousel / Web TV / Contenuti Digitali) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <HeroShowcaseWidget
              onStartBooking={onStartBooking}
              onOpenWebTvModal={onOpenWebTvModal}
              onWatchVideo={onWatchVideo}
              videos={videos}
              onOpenCrmShowcaseConfig={onOpenCrmShowcaseConfig}
            />

            {/* Quick Fast Selector: Impresa vs Aspirante (Direct Jump to S1) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onStartBooking({ userType: 'IMPRESA' })}
                className="flex flex-col text-left p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200 transition-all group"
              >
                <span className="text-xs uppercase font-extrabold text-blue-900 group-hover:text-blue-950 flex items-center justify-between">
                  <span>Sei un'Impresa</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-[11px] text-blue-700 mt-1 leading-tight">
                  Per aziende, cooperative e ditte costituite
                </span>
              </button>

              <button
                onClick={() => onStartBooking({ userType: 'ASPIRANTE' })}
                className="flex flex-col text-left p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200 transition-all group"
              >
                <span className="text-xs uppercase font-extrabold text-purple-900 group-hover:text-purple-950 flex items-center justify-between">
                  <span>Aspirante Impresa</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-[11px] text-purple-700 mt-1 leading-tight">
                  Per chi ha un'idea e vuole avviare una startup
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 12 Physical Desks Territorial Network Section */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Presidio Capillare del Territorio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
              {sportelli.length > 0 ? `I ${sportelli.length} Sportelli di Sviluppo Italia Molise` : 'Gli Sportelli di Sviluppo Italia Molise'}
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              Trova lo sportello più vicino a te. Ogni sede offre assistenza specializzata gratuita in presenza o in videocall.
            </p>
          </div>

          <button
            onClick={() => onStartBooking()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Scegli lo sportello e prenota</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive Molise Visual Map */}
          <div className="lg:col-span-7">
            <MoliseMap
              sportelli={sportelli}
              selectedSportelloId={selectedSportello?.id}
              onSelectSportello={(s) => setSelectedSportello(s)}
            />
          </div>

          {/* Selected Desk Detail Card */}
          <div className="lg:col-span-5 flex flex-col">
            {selectedSportello ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                      {selectedSportello.cadenza}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedSportello.comune}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {selectedSportello.nome}
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-700 mt-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <span>{selectedSportello.indirizzo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{selectedSportello.giorni}: ore {selectedSportello.orario}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{selectedSportello.telefono}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={() => onStartBooking({ initialSportelloId: selectedSportello.id })}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Prenota a {selectedSportello.comune.replace(' (sede SIM)', '')}</span>
                  </button>
                  <a
                    href={`https://maps.google.com/?q=${selectedSportello.lat},${selectedSportello.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Apri in Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center text-slate-400 text-sm">
                Seleziona uno sportello dalla mappa
              </div>
            )}
          </div>
        </div>

        {/* Quick Desks Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sportelli.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSportello(s)}
              className={`text-left p-3 rounded-xl border transition-all text-xs ${
                selectedSportello?.id === s.id
                  ? 'bg-sky-50 border-sky-400 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900 truncate">{s.comune}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">{s.giorni}</div>
              <div className="text-[10px] text-sky-700 font-semibold mt-1">{s.orario}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Web TV Video Gallery Section (Capitolo 9) - Mostrata solo se sono presenti elementi video */}
      {videos.length > 0 && (
        <section className="py-12 px-4 sm:px-6 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
                  <Play className="w-3.5 h-3.5 fill-red-400" />
                  <span>Web TV Territoriale</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  La Bottega delle Opportunità
                </h2>
                <p className="text-sm text-slate-400 max-w-2xl mt-1">
                  "L'ho fatto io. Ora tocca a te." Ascolta le storie degli imprenditori molisani, scopri le pillole sui bandi e non perdere le scadenze.
                </p>
              </div>

              {/* Rubrics Filter */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {rubriche.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRubrica(r)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      activeRubrica === r
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Videos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-slate-800/80 rounded-xl border border-slate-700 overflow-hidden flex flex-col justify-between group hover:border-slate-500 transition-all"
                >
                  <div>
                    <div
                      onClick={() => handleVideoClick(video)}
                      className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden"
                    >
                      <img
                        src={`https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80`}
                        alt={video.titolo}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded">
                        {video.rubrica}
                      </span>
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-sm text-white line-clamp-2 mb-1.5 group-hover:text-sky-300 transition-colors">
                        {video.titolo}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {video.descrizione}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onStartBooking({ source: `webtv_${video.id}` })}
                      className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-sky-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Prenota colloquio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <Logo size="md" variant="dark" />
           
            <p className="text-[11px] text-slate-500">
              Sviluppo Italia Molise S.p.A. - Via Vico 4, 86100 Campobasso (CB) - P.IVA 00852240704
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Contatti e Supporto</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Contact Center: <a href="tel:0874011011" className="text-white hover:underline">0874 011011</a></li>
              <li>WhatsApp: <a href="https://wa.me/390874011011" className="text-emerald-400 hover:underline">0874 011011</a></li>
             
             
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Link Istituzionali</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="https://www.sviluppoitaliamolise.it" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Sviluppo Italia Molise</a></li>
              <li><a href="https://prfesrfse2127.regione.molise.it/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Regione Molise</a></li>
              <li><a href="https://europa.eu" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Unione Europea</a></li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                >
                  <span>Privacy Policy (GDPR)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('cookies')}
                  className="hover:text-white transition-colors cursor-pointer text-left inline-flex items-center gap-1.5"
                >
                  <span>Informativa Cookies</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Privacy & Cookie Policy Modal */}
      {policyModalType && (
        <PolicyModal
          type={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}
    </div>
  );
};
