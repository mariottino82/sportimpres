import React, { useState, useEffect, useRef } from 'react';
import { EventoCrm, CrmRole } from '../../types';
import { MESI_IT } from '../../data/portalEvents';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Eye,
  Sparkles,
  Save,
  X,
  Tag,
  Newspaper,
  ExternalLink,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Check,
  AlertCircle
} from 'lucide-react';

interface EventiManagerProps {
  role: CrmRole;
  onNavigateToPublicPortal?: () => void;
}

const TIPO_CONFIG = {
  EVENTO: { label: 'Evento', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  WORKSHOP: { label: 'Workshop', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  BANDO: { label: 'Bandi e news', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
};

export const EventiManager: React.FC<EventiManagerProps> = ({
  role,
  onNavigateToPublicPortal,
}) => {
  const isAuthorized = role === 'ADMIN' || role === 'COMUNICAZIONE' || role === 'COORDINATORE';
  const [eventi, setEventi] = useState<EventoCrm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState<string>('ALL');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'EVENTO' as 'EVENTO' | 'WORKSHOP' | 'BANDO',
    titolo: '',
    testo: '',
    luogo: '',
    ora: '',
    nota: '',
    bottone: 'Scopri',
    link: '',
    manifesto_url: '',
    locandina_tipo: '' as 'image' | 'pdf' | '',
    locandina_nome: '',
    attivo: 1,
  });

  const [uploadingLocandina, setUploadingLocandina] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [locandinaPreviewModal, setLocandinaPreviewModal] = useState<{ url: string; tipo: 'image' | 'pdf'; titolo: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchEventi = () => {
    setLoading(true);
    fetch('/api/eventi?all=true')
      .then((res) => res.json())
      .then((data) => {
        setEventi(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching eventi:', err);
        setEventi([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEventi();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setUploadError(null);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo: 'EVENTO',
      titolo: '',
      testo: '',
      luogo: '',
      ora: '15:00',
      nota: 'Gratuito',
      bottone: 'Scopri',
      link: '',
      manifesto_url: '',
      locandina_tipo: '',
      locandina_nome: '',
      attivo: 1,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: EventoCrm) => {
    setEditingId(item.id);
    setUploadError(null);

    // Rileva tipo locandina da tipo memorizzato o estensione
    let detectedTipo: 'image' | 'pdf' | '' = item.locandina_tipo || '';
    if (!detectedTipo && item.manifesto_url) {
      const lower = item.manifesto_url.toLowerCase();
      if (lower.endsWith('.pdf') || lower.startsWith('data:application/pdf')) {
        detectedTipo = 'pdf';
      } else {
        detectedTipo = 'image';
      }
    }

    setFormData({
      data: item.data || new Date().toISOString().split('T')[0],
      tipo: item.tipo || 'EVENTO',
      titolo: item.titolo || '',
      testo: item.testo || '',
      luogo: item.luogo || '',
      ora: item.ora || '',
      nota: item.nota || '',
      bottone: item.bottone || 'Scopri',
      link: item.link || '',
      manifesto_url: item.manifesto_url || '',
      locandina_tipo: detectedTipo,
      locandina_nome: item.locandina_nome || (item.manifesto_url ? 'Locandina allegata' : ''),
      attivo: item.attivo !== undefined ? item.attivo : 1,
    });
    setShowModal(true);
  };

  const handleLocandinaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setUploadError('Formato file non valido. Seleziona una locandina in formato JPEG, JPG, PNG o PDF.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Il file è troppo grande. Dimensione massima consentita: 20 MB.');
      return;
    }

    setUploadingLocandina(true);
    setUploadError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Errore lettura file locale'));
        reader.readAsDataURL(file);
      });

      const detectedType: 'image' | 'pdf' = isPdf ? 'pdf' : 'image';

      // Chiamata all'endpoint di upload backend per persistenza su disco /uploads
      const res = await fetch('/api/upload-locandina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64,
          fileType: detectedType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Errore durante il salvataggio sul server');
      }

      setFormData((prev) => ({
        ...prev,
        manifesto_url: data.url,
        locandina_tipo: detectedType,
        locandina_nome: file.name,
        // Se il bottone ha ancora il valore default, suggerisci un testo adatto
        bottone: prev.bottone === 'Scopri' ? (detectedType === 'pdf' ? 'Scarica Locandina PDF' : 'Vedi Locandina') : prev.bottone,
      }));
    } catch (err: any) {
      console.error('Locandina upload error:', err);
      setUploadError(err.message || 'Errore durante il caricamento del file');
    } finally {
      setUploadingLocandina(false);
    }
  };

  const handleRemoveLocandina = () => {
    setFormData((prev) => ({
      ...prev,
      manifesto_url: '',
      locandina_tipo: '',
      locandina_nome: '',
      bottone: prev.bottone === 'Vedi Locandina' || prev.bottone === 'Scarica Locandina PDF' ? 'Scopri' : prev.bottone,
    }));
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titolo.trim() || !formData.testo.trim() || !formData.data) {
      alert('Compilare data, titolo e descrizione');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/eventi/${editingId}` : '/api/eventi';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Errore durante il salvataggio');
      }

      setShowModal(false);
      fetchEventi();
    } catch (err: any) {
      alert(err.message || 'Errore');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/eventi/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore durante eliminazione');
      setDeleteConfirmId(null);
      fetchEventi();
    } catch (err: any) {
      alert(err.message || 'Errore');
    }
  };

  const handleToggleStatus = async (item: EventoCrm) => {
    try {
      const res = await fetch(`/api/eventi/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, attivo: item.attivo === 1 ? 0 : 1 }),
      });
      if (!res.ok) throw new Error('Errore aggiornamento stato');
      fetchEventi();
    } catch (err: any) {
      alert(err.message || 'Errore');
    }
  };

  const filtered = eventi.filter(
    (e) => filterTipo === 'ALL' || e.tipo === filterTipo
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Newspaper className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Gestione News ed Eventi (Homepage)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci in tempo reale gli appuntamenti, i workshop e i bandi pubblicati nella sezione &quot;Prossimi appuntamenti&quot; e nel banner superiore della homepage.
          </p>
        </div>

        {isAuthorized && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Evento / News</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'Tutti' },
            { id: 'EVENTO', label: 'Eventi' },
            { id: 'WORKSHOP', label: 'Workshop' },
            { id: 'BANDO', label: 'Bandi e news' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTipo(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                filterTipo === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Trovati <strong>{filtered.length}</strong> elementi
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          Caricamento eventi in corso...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Nessun evento o notizia presente</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aggiungi il primo evento per mostrarlo nella sezione &quot;Prossimi appuntamenti&quot; della homepage.
          </p>
          {isAuthorized && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
            >
              Crea adesso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const dateObj = new Date(item.data);
            const isEventActive = item.attivo === 1;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs ${
                  isEventActive ? 'border-slate-200 hover:border-sky-300' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar with Date & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-center">
                        <span className="font-display font-black text-lg text-sky-700 leading-none">
                          {String(dateObj.getDate()).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600 mt-0.5">
                          {MESI_IT[dateObj.getMonth()]}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            TIPO_CONFIG[item.tipo]?.bg || TIPO_CONFIG.EVENTO.bg
                          }`}
                        >
                          {item.tipo}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.data}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      title={isEventActive ? 'Disattiva (nascondi da homepage)' : 'Attiva (mostra in homepage)'}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        isEventActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isEventActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Attivo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-500" />
                          <span>Nascosto</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {item.titolo}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                      {item.testo}
                    </p>
                  </div>

                  {/* Location & Time details */}
                  <div className="flex flex-wrap gap-2.5 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                    {item.luogo && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        <span>{item.luogo}</span>
                      </span>
                    )}
                    {item.ora && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{item.ora}</span>
                      </span>
                    )}
                    {item.nota && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {item.nota}
                      </span>
                    )}
                  </div>

                  {/* Locandina Indicator Badge */}
                  {item.manifesto_url && (
                    <div className="pt-1">
                      <a
                        href={item.manifesto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all ${
                          item.locandina_tipo === 'pdf' || item.manifesto_url.toLowerCase().endsWith('.pdf')
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        {item.locandina_tipo === 'pdf' || item.manifesto_url.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {item.locandina_tipo === 'pdf' || item.manifesto_url.toLowerCase().endsWith('.pdf')
                            ? 'Locandina PDF allegata'
                            : 'Locandina JPEG allegata'}
                        </span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-sky-700 truncate">
                    Bottone: &quot;{item.bottone}&quot;
                  </div>

                  <div className="flex items-center gap-1">
                    {isAuthorized && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Modifica"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900">Confermi l&apos;eliminazione?</h4>
            <p className="text-xs text-slate-600">
              L&apos;evento verrà rimosso permanentemente dal database e non comparirà più sulla homepage pubblica.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Elimina definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl sm:max-w-2xl w-full space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                {editingId ? 'Modifica Evento / Notizia' : 'Nuovo Evento o Notizia'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipologia *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value as 'EVENTO' | 'WORKSHOP' | 'BANDO' })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="EVENTO">Evento</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="BANDO">Bandi e news</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titolo *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Inaugurazione Sportello Imprese – Sede di Trivento"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione / Testo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Breve sintesi per il pubblico della homepage..."
                  value={formData.testo}
                  onChange={(e) => setFormData({ ...formData, testo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Luogo / Sede</label>
                  <input
                    type="text"
                    placeholder="Es. Trivento oppure Online"
                    value={formData.luogo}
                    onChange={(e) => setFormData({ ...formData, luogo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orario</label>
                  <input
                    type="text"
                    placeholder="Es. 18:00"
                    value={formData.ora}
                    onChange={(e) => setFormData({ ...formData, ora: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Etichetta Nota</label>
                  <input
                    type="text"
                    placeholder="Es. Lunedì 28 settembre o Gratuito"
                    value={formData.nota}
                    onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Testo Bottone CTA</label>
                  <input
                    type="text"
                    placeholder="Es. Vedi manifesto, Iscriviti, Scopri"
                    value={formData.bottone}
                    onChange={(e) => setFormData({ ...formData, bottone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link o Destinazione</label>
                <input
                  type="text"
                  placeholder="Es. #sportelli per prenotazione, o URL esterno"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Sezione Caricamento Locandina (JPEG o PDF) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Locandina Ufficiale (JPEG, PNG o PDF)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Carica la locandina, manifesto o programma dell&apos;evento
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input file nascosto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleLocandinaFileSelect}
                  className="hidden"
                />

                {/* Stato con locandina caricata */}
                {formData.manifesto_url ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {formData.locandina_tipo === 'pdf' || formData.manifesto_url.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center text-red-600 shrink-0">
                          <FileText className="w-6 h-6" />
                          <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">PDF</span>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                          {formData.manifesto_url.startsWith('http') ||
                          formData.manifesto_url.startsWith('/') ||
                          formData.manifesto_url.startsWith('data:') ? (
                            <img
                              src={formData.manifesto_url}
                              alt="Locandina"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-sky-600" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              formData.locandina_tipo === 'pdf' || formData.manifesto_url.toLowerCase().endsWith('.pdf')
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {formData.locandina_tipo === 'pdf' || formData.manifesto_url.toLowerCase().endsWith('.pdf')
                              ? 'Locandina PDF'
                              : 'Locandina JPEG / PNG'}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Pronta
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate mt-1" title={formData.locandina_nome || 'locandina'}>
                          {formData.locandina_nome || 'locandina_ufficiale'}
                        </div>
                      </div>
                    </div>

                    {/* Azioni sui pulsanti: riga dedicata flessibile, mai tagliata fuori */}
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
                      <a
                        href={formData.manifesto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 bg-white transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Visualizza</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 bg-white transition-colors cursor-pointer shadow-2xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                        <span>Sostituisci</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLocandina}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer ml-auto"
                        title="Rimuovi locandina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rimuovi</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Area di selezione e drag-drop del file */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && fileInputRef.current) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        fileInputRef.current.files = dt.files;
                        handleLocandinaFileSelect({ target: fileInputRef.current } as any);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-white group hover:bg-sky-50/20"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {uploadingLocandina ? (
                          <span className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {uploadingLocandina
                            ? 'Caricamento locandina in corso...'
                            : 'Clicca o trascina qui la locandina'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Supporta formato <strong>JPEG (.jpg, .jpeg)</strong>, <strong>PNG</strong> o documento <strong>PDF</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Opzione facoltativa per inserire URL diretto web */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">
                    Oppure specifica l&apos;URL web diretto della locandina:
                  </div>
                  <input
                    type="text"
                    placeholder="https://.../locandina.pdf oppure .jpg"
                    value={formData.manifesto_url}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isPdf = val.toLowerCase().endsWith('.pdf');
                      setFormData({
                        ...formData,
                        manifesto_url: val,
                        locandina_tipo: val ? (isPdf ? 'pdf' : 'image') : '',
                        locandina_nome: val ? 'locandina_esterna' : '',
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:ring-1 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="attivoCheck"
                  checked={formData.attivo === 1}
                  onChange={(e) => setFormData({ ...formData, attivo: e.target.checked ? 1 : 0 })}
                  className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <label htmlFor="attivoCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mostra subito come attivo nella homepage pubblica
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvataggio...' : 'Salva Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
