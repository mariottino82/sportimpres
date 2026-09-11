import React, { useState, useEffect } from 'react';
import { CrmRole, HeroShowcaseConfig, CarouselSlide, DigitalContentItem, WebTvVideo } from '../../types';
import {
  Sliders,
  Tv,
  Image as ImageIcon,
  Sparkles,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  ExternalLink,
  Play,
  Calendar,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Eye,
  Info,
  Layers
} from 'lucide-react';

interface HeroShowcaseManagerProps {
  role: CrmRole;
  onNavigateToPublicPortal?: () => void;
}

// Preset high-quality images for easy selection
const PRESET_IMAGES = [
  {
    label: 'PMI & Innovazione Digitale',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Startup & Giovani Imprenditori',
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Artigianato & Territorio Molise',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Studio Web TV & Broadcast',
    url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Agroalimentare & Borghi',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80'
  },
  {
    label: 'Tecnologia & Transizione Green',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80'
  }
];

export const HeroShowcaseManager: React.FC<HeroShowcaseManagerProps> = ({
  role,
  onNavigateToPublicPortal
}) => {
  const isAuthorized = role === 'ADMIN' || role === 'COMUNICAZIONE' || role === 'COORDINATORE';

  const [config, setConfig] = useState<HeroShowcaseConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [videos, setVideos] = useState<WebTvVideo[]>([]);

  // Editing state for Carousel Slide Modal
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [isNewSlide, setIsNewSlide] = useState<boolean>(false);

  // Editing state for Digital Item Modal
  const [editingDigitalItem, setEditingDigitalItem] = useState<DigitalContentItem | null>(null);
  const [isNewDigitalItem, setIsNewDigitalItem] = useState<boolean>(false);

  // Load current configuration and Web TV videos
  useEffect(() => {
    fetchConfig();
    fetchVideos();
  }, []);

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/hero-showcase')
      .then((res) => res.json())
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.error('Errore caricamento configurazione vetrina:', err))
      .finally(() => setLoading(false));
  };

  const fetchVideos = () => {
    fetch('/api/webtv/video')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setVideos(data);
      })
      .catch((err) => console.error('Errore caricamento video Web TV:', err));
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/hero-showcase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Errore durante il salvataggio della configurazione');
      }
    } catch (err: any) {
      alert('Errore di connessione: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Carousel handlers
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (!config) return;
    const slides = [...config.carouselSlides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const temp = slides[index];
    slides[index] = slides[targetIdx];
    slides[targetIdx] = temp;

    setConfig({ ...config, carouselSlides: slides });
  };

  const handleDeleteSlide = (id: string) => {
    if (!config) return;
    if (config.carouselSlides.length <= 1) {
      alert('È necessario mantenere almeno una slide nel carousel.');
      return;
    }
    if (confirm('Confermi l\'eliminazione di questa slide dal carousel?')) {
      setConfig({
        ...config,
        carouselSlides: config.carouselSlides.filter((s) => s.id !== id)
      });
    }
  };

  const handleOpenAddSlide = () => {
    setIsNewSlide(true);
    setEditingSlide({
      id: 'slide-' + Date.now(),
      title: 'Nuova Opportunità Territoriale',
      subtitle: 'Descrizione dell\'agevolazione o dell\'iniziativa promossa dagli sportelli',
      tag: 'BANDO 2026',
      tagColor: 'emerald',
      imageUrl: PRESET_IMAGES[0].url,
      ctaText: 'Prenota Orientamento',
      ctaAction: 'booking',
      grantTitle: ''
    });
  };

  const handleSaveSlideModal = () => {
    if (!config || !editingSlide) return;
    let updatedSlides = [...config.carouselSlides];

    if (isNewSlide) {
      updatedSlides.push(editingSlide);
    } else {
      updatedSlides = updatedSlides.map((s) => (s.id === editingSlide.id ? editingSlide : s));
    }

    setConfig({ ...config, carouselSlides: updatedSlides });
    setEditingSlide(null);
  };

  // Digital items handlers
  const handleDeleteDigitalItem = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      digitalContentConfig: {
        ...config.digitalContentConfig,
        items: config.digitalContentConfig.items.filter((i) => i.id !== id)
      }
    });
  };

  const handleOpenAddDigitalItem = () => {
    setIsNewDigitalItem(true);
    setEditingDigitalItem({
      id: 'item-' + Date.now(),
      title: 'Nuova Risorsa Digitale',
      category: 'DOCUMENTAZIONE',
      description: 'Descrizione della guida, del podcast o della scadenza',
      type: 'guide',
      link: 'https://sviluppoitaliamolise.it',
      dateBadge: 'Novità'
    });
  };

  const handleSaveDigitalItemModal = () => {
    if (!config || !editingDigitalItem) return;
    let updatedItems = [...config.digitalContentConfig.items];

    if (isNewDigitalItem) {
      updatedItems.push(editingDigitalItem);
    } else {
      updatedItems = updatedItems.map((i) => (i.id === editingDigitalItem.id ? editingDigitalItem : i));
    }

    setConfig({
      ...config,
      digitalContentConfig: {
        ...config.digitalContentConfig,
        items: updatedItems
      }
    });
    setEditingDigitalItem(null);
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 font-display">
          Accesso Riservato ad Amministrazione e Comunicazione
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          Questa sezione di gestione dei contenuti della vetrina pubblica è accessibile esclusivamente agli utenti con ruolo <strong>ADMIN</strong> o <strong>COMUNICAZIONE</strong>.
        </p>
      </div>
    );
  }

  if (loading || !config) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mb-3" />
        <span className="text-sm font-semibold">Caricamento configurazione vetrina in corso...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              Canali di Comunicazione • Sezione Riservata Admin & Comunicazione
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Ruolo: {role}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display mt-0.5">
            Personalizzazione Vetrina Hero del Portale Pubblico
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Scegli e gestisci i contenuti multimediali mostrati nel box principale della homepage: puoi optare per uno slider di <strong>immagini con effetto carousel</strong>, per il collegamento diretto al canale streaming della <strong>Web TV ufficiale</strong>, oppure per un <strong>hub di contenuti digitali</strong> (guide, podcast e scadenze).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Salvataggio...' : 'Salva Modifiche Vetrina'}</span>
          </button>

          {onNavigateToPublicPortal && (
            <button
              onClick={onNavigateToPublicPortal}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Vedi come appare sul portale pubblico"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Anteprima Live</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configurazione salvata con successo! La vetrina nella homepage del portale pubblico è stata aggiornata in tempo reale.</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
            Pubblicato
          </span>
        </div>
      )}

      {/* 1. SELETTORE MODALITÀ CONTENUTO (CAROUSEL / WEB TV / DIGITALE) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              1. Selezione del Tipo di Contenuto per il Box Hero
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Determina quale componente visuale apparirà ai cittadini nella colonna destra della Hero del portale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Option A: Carousel Immagini */}
          <div
            onClick={() => setConfig({ ...config, activeMode: 'carousel' })}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.activeMode === 'carousel'
                ? 'border-sky-600 bg-sky-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.activeMode === 'carousel' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                {config.activeMode === 'carousel' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                    Attivo sul portale
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Immagini con Effetto Carousel
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Slider scorrevole con immagini ad alta risoluzione, slogan promozionali, badge tematici e pulsanti CTA collegati ai bandi.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>{config.carouselSlides.length} slide configurate</span>
              <span className="text-sky-700">Autoplay {config.autoplayIntervalSeconds || 5}s</span>
            </div>
          </div>

          {/* Option B: Web TV Ufficiale */}
          <div
            onClick={() => setConfig({ ...config, activeMode: 'webtv' })}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.activeMode === 'webtv'
                ? 'border-red-600 bg-red-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.activeMode === 'webtv' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Tv className="w-5 h-5" />
                </div>
                {config.activeMode === 'webtv' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    Attivo sul portale
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Web TV Ufficiale Molise
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Player multimediale del format "La Bottega delle Opportunità" con badge ON AIR, anteprima video e apertura del player integrato.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>{videos.length} video disponibili</span>
              <span className="text-red-700">Canale YouTube Ufficiale</span>
            </div>
          </div>

          {/* Option C: Hub Risorse Digitali */}
          <div
            onClick={() => setConfig({ ...config, activeMode: 'digital' })}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              config.activeMode === 'digital'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.activeMode === 'digital' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                {config.activeMode === 'digital' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Attivo sul portale
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Hub Contenuti Digitali & Flash
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Bacheca interattiva con schede informative rapide: dossier e guide PDF scaricabili, pillole audio podcast e scadenze imminenti.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>{config.digitalContentConfig?.items?.length || 0} elementi digitali</span>
              <span className="text-indigo-700">Notiziario Live</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SPECIFIC EDITOR PANEL BASED ON ACTIVE MODE */}

      {/* ======================= CAROUSEL SETTINGS ======================= */}
      {config.activeMode === 'carousel' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Gestione Slide del Carousel</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggiungi, modifica o riordina le slide promozionali visualizzate con transizione automatica.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Autoplay seconds */}
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span>Intervallo:</span>
                <select
                  value={config.autoplayIntervalSeconds || 5}
                  onChange={(e) => setConfig({ ...config, autoplayIntervalSeconds: Number(e.target.value) })}
                  className="bg-white font-bold text-sky-800 border border-slate-200 rounded px-1.5 py-0.5 text-xs"
                >
                  <option value={3}>3 secondi</option>
                  <option value={5}>5 secondi (consigliato)</option>
                  <option value={7}>7 secondi</option>
                  <option value={10}>10 secondi</option>
                </select>
              </div>

              <button
                onClick={handleOpenAddSlide}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Slide</span>
              </button>
            </div>
          </div>

          {/* Slides List */}
          <div className="space-y-3">
            {config.carouselSlides.map((slide, index) => (
              <div
                key={slide.id || index}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 shadow-2xs relative">
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1 rounded font-mono">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                        {slide.tag}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Azione: {slide.ctaAction}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 mt-0.5 truncate max-w-md">
                      {slide.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleMoveSlide(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                    title="Sposta su"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSlide(index, 'down')}
                    disabled={index === config.carouselSlides.length - 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                    title="Sposta giù"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsNewSlide(false);
                      setEditingSlide(slide);
                    }}
                    className="p-1.5 rounded-lg text-sky-600 hover:text-sky-800 hover:bg-sky-50 cursor-pointer"
                    title="Modifica slide"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                    title="Elimina slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= WEB TV SETTINGS ======================= */}
      {config.activeMode === 'webtv' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-600" />
              <span>Configurazione Vetrina Web TV Ufficiale</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalizza il video in evidenza e i testi mostrati nel player principale del format "La Bottega delle Opportunità".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Seleziona Video in Primo Piano:
              </label>
              <select
                value={config.webtvConfig?.selectedVideoId || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webtvConfig: {
                      ...config.webtvConfig,
                      selectedVideoId: e.target.value ? Number(e.target.value) : null
                    }
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
              >
                <option value="">Ultimo Video Caricato (Predefinito)</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.rubrica}] {v.titolo}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Puoi caricare altri video nella tab "Web TV Ufficiale" del CRM.
              </span>
            </div>

            {/* Header Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Testo Badge di Stato:
              </label>
              <input
                type="text"
                value={config.webtvConfig?.badge || 'ON AIR'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webtvConfig: { ...config.webtvConfig, badge: e.target.value }
                  })
                }
                placeholder="es. ON AIR, IN PRIMO PIANO, SPECIALE BANDI"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Titolo/Sottotitolo Canale:
              </label>
              <input
                type="text"
                value={config.webtvConfig?.subtitle || 'La Bottega delle Opportunità'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webtvConfig: { ...config.webtvConfig, subtitle: e.target.value }
                  })
                }
                placeholder="es. La Bottega delle Opportunità"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
              />
            </div>

            {/* CTA button text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Testo del Pulsante di Prenotazione:
              </label>
              <input
                type="text"
                value={config.webtvConfig?.ctaText || 'Prenota un appuntamento per questo bando'}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    webtvConfig: { ...config.webtvConfig, ctaText: e.target.value }
                  })
                }
                placeholder="es. Prenota un appuntamento per questo bando"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================= DIGITAL CONTENT SETTINGS ======================= */}
      {config.activeMode === 'digital' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Gestione Schede Contenuti Digitali</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura le schede di approfondimento (guide pratiche, puntate podcast e avvisi di scadenza).
              </p>
            </div>

            <button
              onClick={handleOpenAddDigitalItem}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Contenuto</span>
            </button>
          </div>

          {/* General header config for digital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titolo Bacheca Digitale:
              </label>
              <input
                type="text"
                value={config.digitalContentConfig?.title || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    digitalContentConfig: {
                      ...config.digitalContentConfig,
                      title: e.target.value
                    }
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Badge di Notifica:
              </label>
              <input
                type="text"
                value={config.digitalContentConfig?.badge || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    digitalContentConfig: {
                      ...config.digitalContentConfig,
                      badge: e.target.value
                    }
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3">
            {config.digitalContentConfig?.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Tipo: {item.type}
                    </span>
                    {item.dateBadge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        {item.dateBadge}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setIsNewDigitalItem(false);
                      setEditingDigitalItem(item);
                    }}
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    title="Modifica contenuto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDigitalItem(item.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Elimina contenuto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT CAROUSEL SLIDE                                */}
      {/* ========================================================= */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>{isNewSlide ? 'Nuova Slide per il Carousel' : 'Modifica Slide Carousel'}</span>
              </h3>
              <button
                onClick={() => setEditingSlide(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Annulla
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titolo Slide (Headline):</label>
                <input
                  type="text"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-sky-500"
                  placeholder="es. Bandi FESR Molise: Transizione Digitale & Green"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sottotitolo / Didascalia:</label>
                <textarea
                  value={editingSlide.subtitle}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                  placeholder="Descrivi l'opportunità o il beneficio per l'utente..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Testo Badge / Tag:</label>
                  <input
                    type="text"
                    value={editingSlide.tag}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tag: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                    placeholder="es. BANDO ATTIVO 2026"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Colore Badge:</label>
                  <select
                    value={editingSlide.tagColor || 'emerald'}
                    onChange={(e) => setEditingSlide({ ...editingSlide, tagColor: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                  >
                    <option value="emerald">Verde Smeraldo (Bandi attivi)</option>
                    <option value="blue">Blu Istituzionale</option>
                    <option value="purple">Viola (Aspiranti / EDP)</option>
                    <option value="amber">Ambra (Avvisi & Scadenze)</option>
                    <option value="red">Rosso (Web TV & Streaming)</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Immagine:</label>
                <input
                  type="text"
                  value={editingSlide.imageUrl}
                  onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500 mb-2"
                  placeholder="https://..."
                />
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Oppure scegli da una foto consigliata:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setEditingSlide({ ...editingSlide, imageUrl: preset.url })}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-sky-500 bg-slate-50 flex items-center gap-1.5 text-left text-[10px] font-medium text-slate-700 transition-colors"
                    >
                      <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded object-cover shrink-0" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Action & Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Azione al Click (CTA):</label>
                  <select
                    value={editingSlide.ctaAction}
                    onChange={(e) => setEditingSlide({ ...editingSlide, ctaAction: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                  >
                    <option value="booking">Prenotazione Appuntamento (Generale)</option>
                    <option value="booking_impresa">Prenotazione Diretta per Imprese</option>
                    <option value="booking_aspirante">Prenotazione per Aspiranti Imprenditori</option>
                    <option value="webtv_modal">Apri Video Web TV Ufficiale</option>
                    <option value="external_link">Collegamento a Link Esterno</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Testo Pulsante CTA:</label>
                  <input
                    type="text"
                    value={editingSlide.ctaText}
                    onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                    placeholder="es. Prenota Orientamento"
                  />
                </div>
              </div>

              {editingSlide.ctaAction === 'external_link' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Esterno di Destinazione:</label>
                  <input
                    type="text"
                    value={editingSlide.externalLink || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, externalLink: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-sky-500"
                    placeholder="https://sviluppoitaliamolise.it/..."
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingSlide(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveSlideModal}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Conferma Slide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT DIGITAL ITEM                                  */}
      {/* ========================================================= */}
      {editingDigitalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{isNewDigitalItem ? 'Nuovo Contenuto Digitale' : 'Modifica Contenuto Digitale'}</span>
              </h3>
              <button
                onClick={() => setEditingDigitalItem(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Annulla
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titolo:</label>
                <input
                  type="text"
                  value={editingDigitalItem.title}
                  onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria:</label>
                  <input
                    type="text"
                    value={editingDigitalItem.category}
                    onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, category: e.target.value })}
                    placeholder="DOCUMENTAZIONE, PODCAST, SCADENZA"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipologia Icona:</label>
                  <select
                    value={editingDigitalItem.type}
                    onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  >
                    <option value="guide">Guida / Documento PDF</option>
                    <option value="podcast">Podcast / Audio</option>
                    <option value="deadline">Avviso Scadenza Bando</option>
                    <option value="link">Link Generico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrizione:</label>
                <textarea
                  value={editingDigitalItem.description}
                  onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Temporale:</label>
                  <input
                    type="text"
                    value={editingDigitalItem.dateBadge || ''}
                    onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, dateBadge: e.target.value })}
                    placeholder="es. Oggi, 14 giorni, Ep. 4"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link o Azione:</label>
                  <input
                    type="text"
                    value={editingDigitalItem.link}
                    onChange={(e) => setEditingDigitalItem({ ...editingDigitalItem, link: e.target.value })}
                    placeholder="#prenota oppure https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingDigitalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveDigitalItemModal}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Conferma Contenuto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
