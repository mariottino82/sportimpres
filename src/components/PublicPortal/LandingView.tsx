import React, { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { MoliseMap } from '../MoliseMap';
import { PolicyModal } from './PolicyModal';
import { SPORTELLI_LIST, AREE, ORDINE_SPORTELLI, nomeBreve, SportelloInfo } from '../../data/sportelliList';
import { EVENTI_DEFAULT, MESI_IT, MESI_ESTESI_IT, EventoItem } from '../../data/portalEvents';
import { WebTvVideo } from '../../types';
import {
  Calendar,
  Phone,
  MessageCircle,
  Play,
  ArrowRight,
  MapPin,
  Clock,
  Info,
  Newspaper,
  X,
} from 'lucide-react';

interface LandingViewProps {
  onStartBooking: (params?: { userType?: 'IMPRESA' | 'ASPIRANTE'; initialSportelloId?: number; source?: string; grantTitle?: string }) => void;
  onOpenLookup?: () => void;
  onOpenWebTvModal?: (video: WebTvVideo) => void;
  onWatchVideo?: (video: WebTvVideo) => void;
  onOpenCrmShowcaseConfig?: () => void;
  onOpenCrmEventi?: () => void;
}

const TAG_STYLES: Record<string, string> = {
  EVENTO: 'bg-amber-50 text-amber-700 border-amber-200',
  WORKSHOP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BANDO: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const LandingView: React.FC<LandingViewProps> = ({
  onStartBooking,
  onOpenWebTvModal,
  onWatchVideo,
  onOpenCrmEventi,
}) => {
  const [selectedSportello, setSelectedSportello] = useState<SportelloInfo>(SPORTELLI_LIST[1]); // Campobasso default
  const [filtroArea, setFiltroArea] = useState<string>('');
  const [activeEventTab, setActiveEventTab] = useState<string>('');
  const [manifestoEvent, setManifestoEvent] = useState<EventoItem | null>(null);
  const [policyModalType, setPolicyModalType] = useState<'privacy' | 'cookies' | null>(null);
  const [webtvPreviewOpen, setWebtvPreviewOpen] = useState<boolean>(false);
  const [videos, setVideos] = useState<WebTvVideo[]>([]);
  const [eventiList, setEventiList] = useState<EventoItem[]>(EVENTI_DEFAULT);
  const [loadingEventi, setLoadingEventi] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/webtv/video')
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]));

    fetch('/api/eventi')
      .then((res) => {
        if (!res.ok) throw new Error('API non disponibile');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: EventoItem[] = data.map((d: any) => ({
            id: d.id,
            data: d.data,
            tipo: d.tipo || 'EVENTO',
            titolo: d.titolo,
            testo: d.testo,
            luogo: d.luogo || '',
            ora: d.ora || '',
            nota: d.nota || '',
            bottone: d.bottone || 'Scopri',
            link: d.link || '',
            hasManifesto: Boolean(d.manifesto_url || d.titolo?.toLowerCase().includes('manifesto')),
            manifesto_url: d.manifesto_url || '',
            attivo: d.attivo !== undefined ? d.attivo : 1,
          }));
          setEventiList(mapped);
        }
        setLoadingEventi(false);
      })
      .catch((err) => {
        console.warn('Caricamento eventi fallback:', err);
        setLoadingEventi(false);
      });
  }, []);

  const prossimiEventi = eventiList
    .filter((e) => e.attivo === undefined || e.attivo === 1)
    .sort((a, b) => a.data.localeCompare(b.data));

  const filteredEventi = prossimiEventi.filter(
    (e) => !activeEventTab || e.tipo === activeEventTab
  );

  const [tickerOffset, setTickerOffset] = useState<number>(0);
  const [enableTransition, setEnableTransition] = useState<boolean>(true);
  const [isEventTickerPaused, setIsEventTickerPaused] = useState<boolean>(false);

  useEffect(() => {
    if (prossimiEventi.length <= 1 || isEventTickerPaused) return;
    const timer = setInterval(() => {
      setEnableTransition(true);
      setTickerOffset((prev) => prev + 1);
    }, 3800);
    return () => clearInterval(timer);
  }, [prossimiEventi.length, isEventTickerPaused]);

  useEffect(() => {
    if (prossimiEventi.length <= 1) return;
    if (tickerOffset === prossimiEventi.length) {
      const snapTimer = setTimeout(() => {
        setEnableTransition(false);
        setTickerOffset(0);
      }, 550);
      return () => clearTimeout(snapTimer);
    }
  }, [tickerOffset, prossimiEventi.length]);

  const currentDisplayIndex = prossimiEventi.length > 0 ? (tickerOffset % prossimiEventi.length) : 0;
  const tickerItems = prossimiEventi.length > 1
    ? [...prossimiEventi, prossimiEventi[0]]
    : prossimiEventi;

  const handleWebTvClick = () => {
    if (videos.length > 0) {
      if (onOpenWebTvModal) onOpenWebTvModal(videos[0]);
      else if (onWatchVideo) onWatchVideo(videos[0]);
    } else {
      setWebtvPreviewOpen(true);
    }
  };

  const selectedAreaConfig = AREE[selectedSportello.area];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-0">
      {/* 1. Contact Center Hotline Bar */}
      <div
        
        className="border-b border-slate-700 px-4 sm:px-6 py-2"
        style={{ background: 'linear-gradient(90deg,#1b2537,#223047)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Contact Center</span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Hai bisogno di aiuto? Chiamaci o scrivici su WhatsApp
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto">
            <a
              href="tel:0874011011"
              className="group flex items-center gap-3 pl-1.5 pr-3 py-1 rounded-2xl bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white transition-all shadow-xs"
              title="Chiama 0874 011011"
            >
              <span className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
                <Phone className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] text-sky-300 uppercase tracking-wider font-bold">Chiama</span>
                <span className="font-mono font-bold text-sm sm:text-base tracking-tight group-hover:text-sky-300">
                  0874 011011
                </span>
              </span>
            </a>
            <a
              href="https://wa.me/390874011011?text=Buongiorno%2C%20vorrei%20informazioni%20sullo%20Sportello%20Imprese%20Molise"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 pl-1.5 pr-3 py-1 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600 text-emerald-200 transition-all shadow-xs"
              title="WhatsApp 0874 011011"
            >
              <span className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                <MessageCircle className="w-4 h-4 text-white" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">WhatsApp</span>
                <span className="font-mono font-bold text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-200">
                  0874 011011
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Prossimo Evento / News Scroll Bar (Scorrimento verticale dal basso verso l'alto) */}
      {prossimiEventi.length > 0 && (
        <a
          id="evbar"
          href="#news"
          onMouseEnter={() => setIsEventTickerPaused(true)}
          onMouseLeave={() => setIsEventTickerPaused(false)}
          className="group block bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 border-b border-sky-200/80 px-3 sm:px-6 py-2 hover:bg-sky-100/70 transition-all select-none"
          title="Scorri gli appuntamenti o clicca per visualizzare la sezione News ed Eventi"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm">
            {/* Left badge & ticker title */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>News ed Eventi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              </span>
            </div>

            {/* Dynamic Event Content Vertical Ticker (Scorrimento dal basso verso l'alto) */}
            <div className="flex-1 min-w-0 h-8 overflow-hidden relative px-1">
              <div
                className={`flex flex-col ${enableTransition ? 'transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)' : ''}`}
                style={{ transform: `translateY(-${tickerOffset * 32}px)` }}
              >
                {tickerItems.map((evento, idx) => {
                  const evDate = new Date(evento.data);
                  const isCurrent = idx === currentDisplayIndex;
                  return (
                    <div
                      key={evento.id ? `ev-${evento.id}-${idx}` : `ev-${idx}`}
                      className="h-8 flex items-center gap-2 truncate shrink-0"
                    >
                      {/* Date badge */}
                      <span className="shrink-0 px-2 py-0.5 rounded bg-white text-sky-800 border border-sky-200 text-xs font-bold font-mono shadow-2xs">
                        {evDate.getDate()} {MESI_IT[evDate.getMonth()]}
                      </span>

                      {/* Category tag */}
                      <span
                        className={`shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          TAG_STYLES[evento.tipo] || TAG_STYLES.EVENTO
                        }`}
                      >
                        {evento.tipo}
                      </span>

                      {/* Title & location */}
                      <span
                        id={isCurrent ? 'evbar-txt' : undefined}
                        className="font-semibold text-slate-800 text-xs sm:text-sm truncate group-hover:text-sky-900"
                      >
                        {evento.titolo}
                        {evento.luogo ? ` · ${evento.luogo}` : ''}
                        {evento.ora ? ` (ore ${evento.ora})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls: All Events Link */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View all events CTA */}
              <span className="text-sky-700 group-hover:text-sky-900 font-bold text-xs whitespace-nowrap ml-1 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span className="hidden sm:inline">Tutti gli eventi</span>
                <span className="sm:hidden">Eventi</span>
                <span className="text-[11px] opacity-75">({prossimiEventi.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </a>
      )}

      {/* 3. HERO Section */}
      <section
        id="prenota"
        className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-white to-slate-50 border-b border-sky-100 py-10 sm:py-16 px-4 sm:px-6"
      >
        <div className="absolute -bottom-24 left-1/2 w-[500px] h-[300px] rounded-full bg-amber-100/60 blur-3xl pointer-events-none -translate-x-1/2"></div>
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Left Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>12 Sportelli territoriali</span>
            </div>

            <div>
              <Logo size="lg" className="-ml-1 mb-3" />
              <div className="font-display font-extrabold text-sky-700 text-xl sm:text-2xl uppercase">
                Supportiamo
              </div>
              <h1 className="font-display font-black text-slate-950 uppercase text-4xl sm:text-6xl tracking-[-1.5px] leading-none">
                La tua impresa
              </h1>
              <div className="font-display font-extrabold text-sky-700 uppercase text-2xl sm:text-4xl tracking-[-0.9px] mt-1">
                O la tua idea imprenditoriale
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl">
              <strong className="text-slate-900">Sportello Imprese</strong> ti accompagna nello sviluppo della tua idea o della tua impresa sul territorio del Molise. Un servizio pubblico, qualificato e completamente gratuito.
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-sm sm:text-base text-slate-800 font-medium">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/70 transition-all duration-200 hover:bg-white hover:border-sky-300 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                <span>Fornisce informazioni sui bandi di agevolazione</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/70 transition-all duration-200 hover:bg-white hover:border-sky-300 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                <span>Promuove la cultura d'impresa</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/70 transition-all duration-200 hover:bg-white hover:border-sky-300 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Supporta i processi di innovazione</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/70 transition-all duration-200 hover:bg-white hover:border-sky-300 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>Favorisce il processo di scoperta imprenditoriale (EDP)</span>
              </div>
            </div>

            {/* Grand CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onStartBooking()}
                className="cta-blink inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl shadow-xl shadow-sky-600/30 transition-all hover:-translate-y-0.5 ring-4 ring-sky-200/60 cursor-pointer"
              >
                <Calendar className="w-6 h-6" />
                <span>Prenota un appuntamento</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500">
              <span>✓ Nessun login richiesto</span>
              <span className="text-slate-300">•</span>
              <span>✓ Prenotazione in meno di 3 minuti</span>
              <span className="text-slate-300">•</span>
              <span>✓ Promemoria PDF e supporto in presenza</span>
            </div>
          </div>

          {/* Hero Right Column: Web TV & Quick Cards */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl bg-slate-900 overflow-hidden shadow-xl border border-slate-800">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/60">
                <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </span>
                <div className="leading-tight">
                  <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Web TV ufficiale</div>
                  <div className="text-sm font-bold text-white">La Bottega delle Opportunità</div>
                </div>
              </div>

              <div
                id="webtv"
                onClick={handleWebTvClick}
                className="group relative aspect-video overflow-hidden cursor-pointer bg-slate-950"
              >
                {/* Background ambient lighting */}
                <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-purple-600/40 blur-3xl"></div>
                <div className="absolute top-1/3 -right-12 w-52 h-52 rounded-full bg-orange-500/30 blur-3xl"></div>
                <div className="absolute -bottom-16 left-1/4 w-56 h-56 rounded-full bg-sky-500/30 blur-3xl"></div>
                <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-emerald-500/25 blur-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:14px_14px]"></div>

                {/* Badge top-left & top-right */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  <span>In evidenza</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/10 backdrop-blur text-white/90 text-[10px] font-bold uppercase tracking-wider border border-white/15">
                  Puntata 1
                </div>

                {/* Video Info text */}
                <div className="absolute left-4 bottom-11 max-w-[64%] z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[.18em] text-sky-300">
                      Sportello Imprese
                    </span>
                  </div>
                  <div className="font-display font-extrabold text-white text-base sm:text-xl leading-tight">
                    12 sportelli al servizio della tua impresa
                  </div>
                  <div className="hidden sm:block text-white/70 text-[11px] mt-1 leading-snug">
                    Come funziona il servizio gratuito e come prenotare un appuntamento in meno di 3 minuti
                  </div>
                </div>

                {/* Big Center-Right Play Button */}
                <div className="absolute right-[12%] top-1/2 -translate-y-[60%] flex items-center justify-center z-10">
                  <span className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 animate-ping"></span>
                  <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 shadow-2xl shadow-black/40 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1 text-red-600 fill-red-600" />
                  </span>
                </div>

                {/* Player Bottom Bar */}
                <div className="absolute left-0 right-0 bottom-0 px-3 pb-2.5 pt-6 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="h-1 rounded-full bg-white/20 overflow-hidden mb-2">
                    <div className="h-full w-0 bg-red-500 transition-all duration-700 group-hover:w-[12%]"></div>
                  </div>
                  <div className="flex items-center justify-between text-white/80 text-[10px] font-semibold">
                    <div className="flex items-center gap-2">
                      <Play className="w-3 h-3 fill-white" />
                      <span className="font-mono">00:00 / 04:30</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1 rounded border border-white/40 text-[9px]">HD</span>
                      <span className="px-1 rounded border border-white/40 text-[9px]">CC</span>
                    </div>
                  </div>
                </div>

                {/* Preview Info Modal overlay */}
                {webtvPreviewOpen && (
                  <div
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setWebtvPreviewOpen(false);
                    }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6 gap-2 z-20"
                  >
                    <div className="text-white font-bold text-sm">Web TV: La Bottega delle Opportunità</div>
                    <div className="text-white/80 text-xs max-w-xs">
                      Riproduzione del video tutorial ufficiale sugli 12 Sportelli Imprese Molise.
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartBooking({ source: 'webtv_preview' })}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold"
                    >
                      Prenota colloquio
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Fast Selector: Impresa vs Aspirante */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onStartBooking({ userType: 'IMPRESA' })}
                className="flex flex-col text-left p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200 transition-all cursor-pointer"
              >
                <span className="flex items-center justify-between text-xs font-bold text-blue-800">
                  <span>SEI UN'IMPRESA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] text-blue-700/80 mt-0.5">
                  Per aziende, cooperative e ditte costituite
                </span>
                <span className="mt-2 text-[11px] font-bold text-sky-700">Prenota ora →</span>
              </button>

              <button
                type="button"
                onClick={() => onStartBooking({ userType: 'ASPIRANTE' })}
                className="flex flex-col text-left p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200 transition-all cursor-pointer"
              >
                <span className="flex items-center justify-between text-xs font-bold text-purple-800">
                  <span>ASPIRANTE IMPRESA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] text-purple-700/80 mt-0.5">
                  Per chi ha un'idea e vuole avviare una startup
                </span>
                <span className="mt-2 text-[11px] font-bold text-purple-700">Prenota ora →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEWS ED EVENTI SECTION (#news) */}
      <section id="news" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <Newspaper className="w-4 h-4" />
              <span>News ed Eventi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
              Prossimi appuntamenti
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              Eventi, workshop e novità sui bandi promossi dagli Sportelli Imprese sul territorio. Dati dinamici aggiornati dall&apos;area riservata.
            </p>
          </div>

          <div id="tabs" className="flex flex-wrap gap-2">
            {[
              { id: '', label: 'Tutti' },
              { id: 'EVENTO', label: 'Eventi' },
              { id: 'WORKSHOP', label: 'Workshop' },
              { id: 'BANDO', label: 'Bandi e news' },
            ].map((tab) => {
              const isActive = activeEventTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveEventTab(tab.id)}
                  className={`tab px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Event Cards Grid */}
        {loadingEventi && filteredEventi.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            Caricamento appuntamenti in corso...
          </div>
        ) : filteredEventi.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            Nessuna notizia o evento in programma in questa categoria.
          </div>
        ) : (
          <div id="eventi-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredEventi.map((evento, idx) => {
              const evDate = new Date(evento.data);
              const isClickable = Boolean(evento.hasManifesto || evento.manifesto_url);

              return (
                <article
                  key={evento.id || idx}
                  onClick={() => {
                    if (isClickable) setManifestoEvent(evento);
                  }}
                  className={`group bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col overflow-hidden ${
                    isClickable ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex gap-4 p-5 pb-3">
                    <div className="w-14 shrink-0 rounded-xl bg-sky-50 border border-sky-100 text-center py-2">
                      <div className="font-display font-black text-2xl text-sky-700 leading-none">
                        {String(evDate.getDate()).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mt-1">
                        {MESI_IT[evDate.getMonth()]}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          TAG_STYLES[evento.tipo] || TAG_STYLES.EVENTO
                        }`}
                      >
                        {evento.tipo}
                      </span>
                      <h3 className="font-display font-bold text-slate-900 text-base leading-snug mt-1.5">
                        {evento.titolo}
                      </h3>
                    </div>
                  </div>

                  <div className="px-5 pb-4 text-sm text-slate-600 flex-1">
                    {evento.testo}
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                      {evento.luogo && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          <span>{evento.luogo}</span>
                        </span>
                      )}
                      {evento.ora && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>{evento.ora}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{evento.nota || ''}</span>
                    {isClickable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700">
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>{evento.bottone || 'Vedi manifesto'} →</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (evento.link === '#sportelli') {
                            const el = document.getElementById('sportelli');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          } else if (evento.link && evento.link.startsWith('http')) {
                            window.open(evento.link, '_blank');
                          } else {
                            onStartBooking({ grantTitle: evento.titolo });
                          }
                        }}
                        className="text-xs font-bold text-sky-700 hover:text-sky-800 cursor-pointer"
                      >
                        {evento.bottone || 'Scopri'} →
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. SPORTELLI SECTION (#sportelli) */}
      <section id="sportelli" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-slate-200/70">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              <span>Presidio Capillare del Territorio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
              I 12 Sportelli di Sviluppo Italia Molise
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mt-1">
              Trova lo sportello più vicino a te. Ogni sede offre assistenza specializzata gratuita in presenza.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartBooking()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            <span>Scegli lo sportello e prenota</span>
          </button>
        </div>

        {/* Map & Detail Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>12 Sportelli sul territorio del Molise</span>
                </div>
                {/* Area filter buttons */}
                <div id="area-filter" className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFiltroArea('')}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: !filtroArea ? '#0f172a' : '#ffffff',
                      borderColor: !filtroArea ? '#0f172a' : '#e2e8f0',
                      color: !filtroArea ? '#ffffff' : '#334155',
                    }}
                  >
                    Tutte
                  </button>
                  {Object.entries(AREE).map(([k, cfg]) => {
                    const isSelected = filtroArea === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFiltroArea(k)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer inline-flex items-center"
                        style={{
                          backgroundColor: isSelected ? cfg.col : '#ffffff',
                          borderColor: isSelected ? cfg.col : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#334155',
                        }}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ backgroundColor: isSelected ? '#ffffff' : cfg.col }}
                        />
                        <span>{cfg.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The Leaflet Map Canvas */}
              <MoliseMap
                selectedSportello={selectedSportello}
                filtroArea={filtroArea}
                onSelectSportello={(s) => setSelectedSportello(s)}
              />

              <div className="px-5 pb-4 text-[11px] text-slate-500">
                Tocca uno sportello sulla mappa o un nome nell'elenco per vedere orari e prenotare.
              </div>
            </div>
          </div>

          {/* Right Column: Selected Sportello Detail Card */}
          <div className="lg:col-span-6">
            <div id="detail" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: selectedAreaConfig.col }}
                  >
                    <Info className="w-6 h-6" />
                  </span>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${selectedAreaConfig.txt}`}>
                      {selectedAreaConfig.nome} · {selectedSportello.cadenza}
                    </div>
                    <h3 className="font-display font-extrabold text-2xl text-slate-950 leading-tight">
                      {selectedSportello.nome}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 content-start gap-2.5 text-sm flex-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <Clock className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Giorni e orari</div>
                      <div className="font-bold text-slate-900">
                        {selectedSportello.giorni} · {selectedSportello.orario}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <MapPin className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Indirizzo</div>
                      <div className="font-bold text-slate-900">{selectedSportello.indirizzo}</div>
                    </div>
                  </div>

                  <a
                    href="tel:0874011011"
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-sky-50 transition-colors"
                  >
                    <Phone className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Contact Center</div>
                      <div className="font-mono font-bold text-slate-900">0874 011011</div>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <Info className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold">Assistenza</div>
                      <div className="font-bold text-slate-900">Gratuita, in presenza</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pt-1 text-[11px] text-slate-500">
                    <span>✓ Nessun login richiesto</span>
                    <span>✓ Prenotazione in meno di 3 minuti</span>
                    <span>✓ Promemoria PDF</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartBooking({ initialSportelloId: selectedSportello.id })}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-base font-bold shadow-lg shadow-sky-600/25 transition-all cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                <span>Prenota a {nomeBreve(selectedSportello.nome)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Area Groups Grid List (#sp-list) */}
        <div id="sp-list" className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(AREE) as ['IS' | 'CB' | 'CO', typeof AREE['IS']][]).map(([k, cfg]) => {
            const items = ORDINE_SPORTELLI.filter((s) => s.area === k);
            const isDimmed = Boolean(filtroArea && filtroArea !== k);

            return (
              <div
                key={k}
                className={`rounded-2xl border border-slate-200 bg-white overflow-hidden transition-opacity ${
                  isDimmed ? 'opacity-40' : ''
                }`}
              >
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: cfg.soft }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.col }}>
                    {cfg.nome}
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: cfg.col }}>
                    {items.length} sportelli
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((s) => {
                    const isSelected = s.id === selectedSportello.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedSportello(s);
                          if (window.innerWidth < 1024) {
                            const d = document.getElementById('detail');
                            if (d) d.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: isSelected ? cfg.col : cfg.soft,
                              color: isSelected ? '#ffffff' : cfg.col,
                            }}
                          >
                            <Info className="w-4 h-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-bold text-slate-900 truncate">
                              {s.nome}
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {s.giorni} · {s.orario}
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartBooking({ initialSportelloId: s.id });
                          }}
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-800 hover:underline shrink-0 px-2.5 py-1 rounded-lg hover:bg-sky-100/70 transition-colors cursor-pointer"
                          title={`Prenota appuntamento a ${nomeBreve(s.nome)}`}
                        >
                          <span>Prenota →</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CTA FINALE & CONTATTI */}
      <section id="contatti" className="px-4 sm:px-6 pb-12 scroll-mt-28">
        <div className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div>
            <h2 className="font-display font-extrabold text-white text-xl sm:text-2xl">Pronto a partire?</h2>
            <p className="text-slate-400 mt-1 text-sm">
              Prenota il tuo appuntamento gratuito in meno di 3 minuti.
            </p>
            <button
              type="button"
              onClick={() => onStartBooking()}
              className="mt-4 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-base shadow-lg shadow-sky-600/30 cursor-pointer transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>Prenota ora</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="tel:0874011011"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800 border border-slate-600 text-white hover:bg-slate-750 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-white" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] text-sky-300 uppercase tracking-wider font-bold">Chiama</span>
                <span className="font-mono font-bold text-lg">0874 011011</span>
              </span>
            </a>
            <a
              href="https://wa.me/390874011011"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600 text-white hover:bg-emerald-900/60 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] text-emerald-400 uppercase tracking-wider font-bold">WhatsApp</span>
                <span className="font-mono font-bold text-lg">0874 011011</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 7. RICH FOOTER (from HTML prototype) */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <Logo size="md" variant="dark" />
            <p className="text-[11px] text-slate-500">
              Sviluppo Italia Molise S.p.A. - Via Nazario Sauro 1, 86100 Campobasso (CB) - P.IVA 00852240704
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Contatti e Supporto</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="tel:0874011011" className="inline-flex items-center gap-2 text-white hover:underline">
                  <span className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                  </span>
                  <span className="font-mono text-sm font-bold">0874 011011</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/390874011011"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:underline"
                >
                  <span className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span className="font-mono text-sm font-bold">0874 011011</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@sviluppoitaliamolise.eu" className="inline-flex items-center gap-2 text-white hover:underline">
                  <span className="text-sm font-bold">info@sviluppoitaliamolise.eu</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Link Istituzionali</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://www.sviluppoitaliamolise.it" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Sviluppo Italia Molise
                </a>
              </li>
              <li>
                <a href="https://prfesrfse2127.regione.molise.it" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Regione Molise
                </a>
              </li>
              <li>
                <a href="https://europa.eu" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Unione Europea
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy (GDPR)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('cookies')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Informativa Cookies
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Regione Molise • Sviluppo Italia Molise S.p.A.</span>
          <span>PR Molise FESR FSE+ 2021-2027 • Privacy Policy • Cookie Policy • CUP J19B25000190009</span>
        </div>
        <div className="max-w-7xl mx-auto mt-2 text-[10px] text-slate-600">
          Mappa: confini ISTAT; rilievo elaborato da NASA SRTM e Copernicus EU-DEM (Produced using Copernicus data and information funded by the European Union).
        </div>
      </footer>

      {/* 8. MANIFESTO MODAL */}
      {manifestoEvent && (
        <div
          id="man-modal"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setManifestoEvent(null);
          }}
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                  {new Date(manifestoEvent.data).getDate()}{' '}
                  {MESI_ESTESI_IT[new Date(manifestoEvent.data).getMonth()]}{' '}
                  {new Date(manifestoEvent.data).getFullYear()} · {manifestoEvent.luogo}
                </div>
                <div className="font-display font-bold text-slate-900">{manifestoEvent.titolo}</div>
              </div>
              <button
                type="button"
                onClick={() => setManifestoEvent(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto bg-slate-100 flex-1 p-4 flex flex-col items-center justify-center">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-sm text-center">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 mb-2">{manifestoEvent.titolo}</h4>
                <p className="text-xs text-slate-600 mb-4">{manifestoEvent.testo}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {manifestoEvent.nota} • Ore {manifestoEvent.ora}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const ev = manifestoEvent;
                  setManifestoEvent(null);
                  const found = SPORTELLI_LIST.find((s) =>
                    ev.luogo && (
                      s.comune.toLowerCase().includes(ev.luogo.toLowerCase()) ||
                      ev.luogo.toLowerCase().includes(s.comune.toLowerCase())
                    )
                  );
                  onStartBooking({
                    initialSportelloId: found ? found.id : undefined,
                    grantTitle: ev.titolo
                  });
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-sm font-bold cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Prenota un appuntamento {manifestoEvent.luogo ? `a ${manifestoEvent.luogo}` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FLOATING BUTTONS (DESKTOP) */}
      <div className="hidden md:flex fixed right-5 bottom-5 flex-col gap-3 z-50">
        <a
          href="https://wa.me/390874011011"
          target="_blank"
          rel="noreferrer"
          title="WhatsApp"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
        <a
          href="tel:0874011011"
          title="Chiama"
          className="w-14 h-14 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <Phone className="w-6 h-6 text-white" />
        </a>
      </div>

      {/* 10. MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200 shadow-[0_-6px_20px_rgba(0,0,0,.08)] px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] grid grid-cols-4 gap-2">
        <a
          href="tel:0874011011"
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold py-2"
        >
          <Phone className="w-4 h-4 text-sky-400" />
          <span>Chiama</span>
        </a>
        <a
          href="https://wa.me/390874011011"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[#25D366] text-white text-[11px] font-bold py-2"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          <span>WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={() => onStartBooking()}
          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white text-sm font-bold shadow-lg shadow-sky-600/30"
        >
          <Calendar className="w-4 h-4" />
          <span>Prenota ora</span>
        </button>
      </div>

      {/* Policy Modal */}
      {policyModalType && (
        <PolicyModal
          type={policyModalType}
          onClose={() => setPolicyModalType(null)}
        />
      )}
    </div>
  );
};
