import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { WebTvVideo, CrmRole } from '../../types';
import { MOLISE_COMUNI } from '../../data/moliseComuni';
import { Logo, InstitutionalLogosStrip } from '../Logo';
import {
  QrCode,
  Tv,
  Plus,
  Printer,
  Download,
  ExternalLink,
  Eye,
  CheckCircle,
  Share2,
  Calendar,
  Tag,
  Sliders,
  Sparkles,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { HeroShowcaseManager } from './HeroShowcaseManager';

interface QrCodeWebTvViewProps {
  role: CrmRole;
  initialSubTab?: 'qrcode' | 'webtv' | 'vetrina';
  onNavigateToPublicPortal?: () => void;
}

interface CartelloPosterProps {
  selectedComune: string;
  qrType: string;
  qrCodeUrl: string;
  isPrint?: boolean;
}

const CartelloPosterA4: React.FC<CartelloPosterProps> = ({
  selectedComune,
  qrType,
  qrCodeUrl,
  isPrint = false
}) => {
  return (
    <div
      className={
        isPrint
          ? "w-full h-full flex flex-col items-center justify-between text-center bg-white text-slate-900"
          : "bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-md flex flex-col items-center text-center space-y-4 w-full"
      }
    >
      {/* 1. Striscia Ufficiale Loghi Istituzionali */}
      <div className={`w-full ${isPrint ? 'pb-4 border-b border-slate-200' : 'pb-3 border-b border-slate-100'} flex justify-center`}>
        <InstitutionalLogosStrip size={isPrint ? 'sm' : 'xs'} />
      </div>

      {/* 2. Logo Ufficiale Sportello Imprese */}
      <div className={isPrint ? 'py-3' : 'py-2'}>
        <Logo size={isPrint ? 'xl' : 'lg'} showSubtitle />
      </div>

      {/* 3. Indicazione Territoriale */}
      <p className={`${isPrint ? 'text-base font-medium max-w-md' : 'text-xs max-w-xs'} text-slate-700 leading-relaxed`}>
        {qrType === 'webtv' ? (
          <>Punto informativo e canale Web TV <strong>La Bottega delle Opportunità</strong></>
        ) : qrType === 'locandina' ? (
          <>Punto informativo e di orientamento per imprese e aspiranti imprenditori del territorio di <strong>{selectedComune}</strong></>
        ) : (
          <>Punto informativo e di orientamento per imprese e aspiranti imprenditori del Comune di <strong>{selectedComune}</strong></>
        )}
      </p>

      {/* 4. Quadro QR Code */}
      <div className={`${isPrint ? 'p-5 shadow-sm border-2 border-slate-300 rounded-3xl' : 'p-4 shadow-md border border-slate-200 rounded-2xl'} bg-white`}>
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt={`QR Code Sportello Imprese - ${selectedComune}`}
            className={isPrint ? "w-64 h-64 mx-auto object-contain" : "w-48 h-48 mx-auto object-contain"}
          />
        ) : (
          <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
            Generazione in corso...
          </div>
        )}
      </div>

      {/* 5. Invito all'Azione */}
      <div className="space-y-1">
        <span className={`font-black text-slate-950 uppercase tracking-wide block ${isPrint ? 'text-lg' : 'text-sm'}`}>
          INQUADRA CON LO SMARTPHONE
        </span>
        <span className={`text-slate-600 block ${isPrint ? 'text-sm' : 'text-[11px]'}`}>
          Prenota un colloquio gratuito con gli esperti di Sviluppo Italia Molise
        </span>
      </div>

      {/* 6. Footer Ufficiale Programma e Finanziamento */}
      <div className={`w-full flex flex-col items-center gap-1 ${isPrint ? 'pt-4 border-t border-slate-200' : 'pt-2'}`}>
        <span className={`font-bold text-slate-400 uppercase tracking-widest ${isPrint ? 'text-xs' : 'text-[9px]'}`}>
          PR MOLISE FESR FSE+ 2021-2027
        </span>
        {isPrint && (
          <span className="text-[10px] text-slate-400">
            Azione 1.4.2 • CUP J19B25000190009
          </span>
        )}
      </div>
    </div>
  );
};

export const QrCodeWebTvView: React.FC<QrCodeWebTvViewProps> = ({
  role,
  initialSubTab,
  onNavigateToPublicPortal
}) => {
  const isAuthorizedToManage = role === 'ADMIN' || role === 'COMUNICAZIONE' || role === 'COORDINATORE';
  const [activeSubTab, setActiveSubTab] = useState<'qrcode' | 'webtv' | 'vetrina'>(
    initialSubTab || 'qrcode'
  );
  const [videos, setVideos] = useState<WebTvVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Code generator state
  const [selectedComune, setSelectedComune] = useState('Campobasso');
  const [qrType, setQrType] = useState('comune'); // 'comune' | 'locandina' | 'webtv'
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Add Video state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<WebTvVideo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [newVideo, setNewVideo] = useState({
    titolo: '',
    descrizione: '',
    youtube_id: '',
    rubrica: 'Bandi in 2 Minuti',
    bando_id: '',
    bando_titolo: ''
  });

  const fetchVideos = () => {
    setLoading(true);
    fetch('/api/webtv/video')
      .then((res) => res.json())
      .then((data) => {
        setVideos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setVideos([]);
        setLoading(false);
      });
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsDeletingVideo(true);
    try {
      const res = await fetch(`/api/crm/webtv/${videoToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Errore durante la cancellazione del video');
      }
      setVideoToDelete(null);
      fetchVideos();
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Update QR Code URL when comune or type changes (using local high-res generator)
  useEffect(() => {
    const origin = window.location.origin;
    let target = `${origin}/?source=qrcode&comune=${encodeURIComponent(selectedComune)}`;
    if (qrType === 'webtv') {
      target = `${origin}/?source=qrcode_webtv`;
    } else if (qrType === 'locandina') {
      target = `${origin}/?source=locandina_ufficiale&comune=${encodeURIComponent(selectedComune)}`;
    }
    
    QRCode.toDataURL(target, {
      width: 600,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => {
        console.error('Error generating QR code:', err);
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(target)}`;
        setQrCodeUrl(qrApi);
      });
  }, [selectedComune, qrType]);

  // Ascolta eventi di stampa del browser per isolare il cartello
  useEffect(() => {
    if (activeSubTab !== 'qrcode') return;

    const handleBeforePrint = () => {
      document.body.classList.add('printing-cartello-a4');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-cartello-a4');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-cartello-a4');
    };
  }, [activeSubTab]);

  const handlePrintCartello = () => {
    document.body.classList.add('printing-cartello-a4');

    const cleanup = () => {
      document.body.classList.remove('printing-cartello-a4');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2500);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 50);
    });
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QRCode_Sportello_Imprese_${selectedComune.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/webtv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVideo)
      });
      if (!res.ok) throw new Error('Errore aggiunta video');
      setShowAddVideo(false);
      fetchVideos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Canali di Comunicazione e Divulgazione
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            QR Code Territoriali e Gestione Web TV
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Genera codici QR personalizzati per i 136 Comuni del Molise e gestisci i contenuti video de "La Bottega delle Opportunità".
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeSubTab === 'webtv' && (
            <button
              onClick={() => setShowAddVideo(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nuovo Video Web TV</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none w-full min-w-0">
        <button
          onClick={() => setActiveSubTab('qrcode')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'qrcode'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Generatore QR Code Territoriali</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webtv')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'webtv'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tv className="w-4 h-4 shrink-0" />
          <span>Web TV "La Bottega delle Opportunità" ({videos.length})</span>
        </button>

        {(role === 'ADMIN' || role === 'COMUNICAZIONE' || role === 'COORDINATORE') && (
          <button
            onClick={() => setActiveSubTab('vetrina')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap ${
              activeSubTab === 'vetrina'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Vetrina Hero (Carousel / Web TV / Digitale)</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 ml-1">
              Admin & Com
            </span>
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: QR CODE TERRITORIALI
         ========================================================================= */}
      {activeSubTab === 'qrcode' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase text-xs">
              Configura e Genera QR Code
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipologia Destinazione</label>
              <select
                value={qrType}
                onChange={(e) => setQrType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="comune">Prenotazione Diretta con Preselezione Comune</option>
                <option value="locandina">Locandina Istituzionale Sportello Territoriale</option>
                <option value="webtv">Canale Web TV "La Bottega delle Opportunità"</option>
              </select>
            </div>

            {qrType !== 'webtv' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleziona Comune (136 Comuni del Molise)</label>
                <select
                  value={selectedComune}
                  onChange={(e) => setSelectedComune(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                >
                  {MOLISE_COMUNI.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Inquadrando il QR Code, il cittadino troverà il comune di <strong>{selectedComune}</strong> già impostato con il relativo sportello territoriale competente.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrintCartello}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Stampa Cartello Ufficiale A4</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-600" />
                <span>Scarica QR Code (PNG)</span>
              </button>
            </div>
          </div>

          {/* Printable Preview Poster (On Screen) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <CartelloPosterA4
              selectedComune={selectedComune}
              qrType={qrType}
              qrCodeUrl={qrCodeUrl}
            />
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: GESTIONE WEB TV
         ========================================================================= */}
      {activeSubTab === 'webtv' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-black relative group">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.youtube_id || 'dQw4w9WgXcQ'}`}
                      title={v.titolo}
                      className="w-full h-full border-0 pointer-events-none"
                    />
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {v.rubrica}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(v.data_pubblicazione).toLocaleDateString('it-IT')}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug">
                      {v.titolo}
                    </h4>

                    <p className="text-slate-600 line-clamp-2 text-[11px]">
                      {v.descrizione}
                    </p>

                    {v.bando_titolo && (
                      <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-sky-800 font-semibold truncate">
                        Bando: {v.bando_titolo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 hover:text-sky-900 font-bold inline-flex items-center gap-1"
                  >
                    <span>Vedi su YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isAuthorizedToManage && (
                    <button
                      type="button"
                      onClick={() => setVideoToDelete(v)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Elimina video dalla Web TV"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Video Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-black text-slate-900 mb-1">
                Conferma Eliminazione Video
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Sei sicuro di voler eliminare definitivamente questo video dalla rubrica Web TV?
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1">
                <div className="text-xs font-bold text-slate-900 line-clamp-2">
                  {videoToDelete.titolo}
                </div>
                <div className="text-[11px] text-slate-500">
                  Rubrica: <span className="font-semibold text-slate-700">{videoToDelete.rubrica}</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Il record verrà cancellato dalla tabella <strong>webtv_video</strong> del database.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeletingVideo}
                  onClick={() => setVideoToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isDeletingVideo}
                  onClick={handleDeleteVideo}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingVideo ? 'Eliminazione in corso...' : 'Elimina Definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Pubblica Video Web TV</h3>
              <button onClick={() => setShowAddVideo(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVideo} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titolo Video *</label>
                <input
                  type="text"
                  required
                  value={newVideo.titolo}
                  onChange={(e) => setNewVideo({ ...newVideo, titolo: e.target.value })}
                  placeholder="Es. Transizione 5.0 in Molise: cosa finanzia e come richiederlo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rubrica</label>
                <select
                  value={newVideo.rubrica}
                  onChange={(e) => setNewVideo({ ...newVideo, rubrica: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Bandi in 2 Minuti">Bandi in 2 Minuti</option>
                  <option value="Storie di Successo">Storie di Successo</option>
                  <option value="Interviste sul Territorio">Interviste sul Territorio</option>
                  <option value="Tutorial & FAQ">Tutorial & FAQ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Video YouTube (o URL)</label>
                <input
                  type="text"
                  required
                  value={newVideo.youtube_id}
                  onChange={(e) => setNewVideo({ ...newVideo, youtube_id: e.target.value.replace(/.*v=/, '').replace(/.*youtu\.be\//, '') })}
                  placeholder="es. dQw4w9WgXcQ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bando Collegato (Opzionale)</label>
                <input
                  type="text"
                  value={newVideo.bando_titolo}
                  onChange={(e) => setNewVideo({ ...newVideo, bando_titolo: e.target.value })}
                  placeholder="Es. Voucher Innovazione 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrizione</label>
                <textarea
                  rows={3}
                  value={newVideo.descrizione}
                  onChange={(e) => setNewVideo({ ...newVideo, descrizione: e.target.value })}
                  placeholder="Breve sintesi del contenuto del video..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVideo(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Pubblica Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GESTIONE VETRINA HERO (CAROUSEL / WEB TV / DIGITALE)
         ========================================================================= */}
      {activeSubTab === 'vetrina' && (
        <HeroShowcaseManager
          role={role}
          onNavigateToPublicPortal={onNavigateToPublicPortal}
        />
      )}

      {/* Portal dedicato per la stampa esclusiva del Cartello Ufficiale A4 */}
      {activeSubTab === 'qrcode' && typeof document !== 'undefined' && createPortal(
        <div id="cartello-a4-print-target">
          <CartelloPosterA4
            selectedComune={selectedComune}
            qrType={qrType}
            qrCodeUrl={qrCodeUrl}
            isPrint
          />
        </div>,
        document.body
      )}

    </div>
  );
};
