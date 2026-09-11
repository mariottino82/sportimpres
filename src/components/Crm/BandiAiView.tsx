import React, { useState, useEffect, useRef } from 'react';
import { Bando, BandoAllegato, CrmRole } from '../../types';
import {
  FileText,
  Calendar,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Award,
  Info,
  X,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileCheck,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  File,
  Edit3
} from 'lucide-react';

interface BandiAiViewProps {
  role: CrmRole;
  preselectedUser?: any | null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-600 shrink-0" />;
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
  if (ext === 'docx' || ext === 'doc') return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
  return <File className="w-4 h-4 text-slate-500 shrink-0" />;
}

export const BandiAiView: React.FC<BandiAiViewProps> = ({ role }) => {
  const canManageBandi = role === 'ADMIN' || role === 'COORDINATORE';
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [loadingBandi, setLoadingBandi] = useState(true);

  // Filters for Bandi
  const [livelloFilter, setLivelloFilter] = useState<string>('all');
  const [ris3Filter, setRis3Filter] = useState<string>('all');
  const [searchBando, setSearchBando] = useState<string>('');
  const [selectedBandoForModal, setSelectedBandoForModal] = useState<Bando | null>(null);

  // Delete Bando
  const [bandoToDelete, setBandoToDelete] = useState<Bando | null>(null);
  const [isDeletingBando, setIsDeletingBando] = useState(false);

  // Edit Bando
  const [editingBando, setEditingBando] = useState<Bando | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add Bando Modal & Form
  const [showAddBando, setShowAddBando] = useState(false);
  const [savingBando, setSavingBando] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newBando, setNewBando] = useState({
    titolo: '',
    ente: 'Regione Molise',
    livello: 'REGIONALE',
    area_ris3: 'ICT',
    beneficiari: 'Micro e Piccole imprese con sede in Molise',
    scadenza: '2026-12-31',
    link: 'https://www.sviluppoitaliamolise.it',
    scheda_semplificata: '',
    stato: 'ATTIVO'
  });

  const [uploadedAttachments, setUploadedAttachments] = useState<BandoAllegato[]>([]);

  // Existing Bando detail modal attachments state (to add more attachments)
  const [addingToExisting, setAddingToExisting] = useState(false);
  const [modalFileInputRef, setModalFileInputRef] = useState<HTMLInputElement | null>(null);

  const resetForm = () => {
    setNewBando({
      titolo: '',
      ente: 'Regione Molise',
      livello: 'REGIONALE',
      area_ris3: 'ICT',
      beneficiari: 'Micro e Piccole imprese con sede in Molise',
      scadenza: '2026-12-31',
      link: 'https://www.sviluppoitaliamolise.it',
      scheda_semplificata: '',
      stato: 'ATTIVO'
    });
    setUploadedAttachments([]);
  };

  const fetchBandi = () => {
    setLoadingBandi(true);
    fetch('/api/bandi')
      .then((res) => res.json())
      .then((data) => {
        setBandi(Array.isArray(data) ? data : []);
        setLoadingBandi(false);
      })
      .catch((err) => {
        console.error(err);
        setBandi([]);
        setLoadingBandi(false);
      });
  };

  useEffect(() => {
    fetchBandi();
  }, []);

  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAtt: BandoAllegato = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          nome: file.name,
          dimensione: formatFileSize(file.size),
          tipo: file.type || 'application/octet-stream',
          data_caricamento: new Date().toISOString().split('T')[0],
          data: result
        };
        setUploadedAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setUploadedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateBando = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBando(true);
    try {
      const res = await fetch('/api/crm/bandi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBando,
          allegati: uploadedAttachments
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Errore creazione bando');
      }
      setShowAddBando(false);
      resetForm();
      fetchBandi();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingBando(false);
    }
  };

  const handleDownloadAttachment = (att: BandoAllegato) => {
    if (att.data) {
      const a = document.createElement('a');
      a.href = att.data;
      a.download = att.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback document generation for seed entries
      const content = `SVILUPPO ITALIA MOLISE - PR MOLISE FESR FSE+ 2021-2027\nDocumento: ${att.nome}\nData caricamento: ${att.data_caricamento || '2026-09-03'}\nDimensione: ${att.dimensione || '1 MB'}\n\nDocumento ufficiale depositato agli atti del bando.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Add attachment to currently open bando modal
  const handleAddAttachmentToSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedBandoForModal) return;
    setAddingToExisting(true);

    const newItems: BandoAllegato[] = [];
    const promises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          newItems.push({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            nome: file.name,
            dimensione: formatFileSize(file.size),
            tipo: file.type || 'application/octet-stream',
            data_caricamento: new Date().toISOString().split('T')[0],
            data: reader.result as string
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(promises);

    const updatedAllegati = [...(selectedBandoForModal.allegati || []), ...newItems];

    try {
      const res = await fetch(`/api/crm/bandi/${selectedBandoForModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allegati: updatedAllegati
        })
      });
      if (!res.ok) throw new Error('Errore nel salvataggio allegati');
      const updatedBando = { ...selectedBandoForModal, allegati: updatedAllegati };
      setSelectedBandoForModal(updatedBando);
      setBandi((prev) => prev.map((b) => (b.id === updatedBando.id ? updatedBando : b)));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddingToExisting(false);
    }
  };

  // Remove attachment from currently open bando modal
  const handleRemoveAttachmentFromSelected = async (attachmentId: string) => {
    if (!selectedBandoForModal) return;
    const updatedAllegati = (selectedBandoForModal.allegati || []).filter((a) => a.id !== attachmentId);

    try {
      const res = await fetch(`/api/crm/bandi/${selectedBandoForModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allegati: updatedAllegati
        })
      });
      if (!res.ok) throw new Error('Errore rimozione allegato');
      const updatedBando = { ...selectedBandoForModal, allegati: updatedAllegati };
      setSelectedBandoForModal(updatedBando);
      setBandi((prev) => prev.map((b) => (b.id === updatedBando.id ? updatedBando : b)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteBandoConfirm = async () => {
    if (!bandoToDelete) return;
    setIsDeletingBando(true);
    try {
      const res = await fetch(`/api/crm/bandi/${bandoToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore eliminazione bando');
      setBandoToDelete(null);
      if (selectedBandoForModal?.id === bandoToDelete.id) {
        setSelectedBandoForModal(null);
      }
      fetchBandi();
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione bando');
    } finally {
      setIsDeletingBando(false);
    }
  };

  const handleUpdateBando = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBando) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/crm/bandi/${editingBando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBando)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore aggiornamento bando');
      setEditingBando(null);
      if (selectedBandoForModal?.id === editingBando.id) {
        setSelectedBandoForModal(editingBando);
      }
      fetchBandi();
    } catch (err: any) {
      alert(err.message || 'Errore aggiornamento bando');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredBandi = bandi.filter((b) => {
    if (livelloFilter !== 'all' && b.livello !== livelloFilter) return false;
    if (ris3Filter !== 'all' && b.area_ris3 !== ris3Filter) return false;
    if (searchBando) {
      const q = searchBando.toLowerCase();
      return (
        b.titolo.toLowerCase().includes(q) ||
        b.ente.toLowerCase().includes(q) ||
        b.area_ris3.toLowerCase().includes(q) ||
        (b.beneficiari && b.beneficiari.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header with Prominent Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              PR Molise FESR FSE+ 2021-2027 • Opportunità per le Imprese
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 shrink-0" />
            <span>Catalogo Bandi & Agevolazioni</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Archivio delle agevolazioni regionali, nazionali ed europee per le imprese del territorio e gli aspiranti imprenditori.
          </p>
        </div>

        {canManageBandi && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                resetForm();
                setShowAddBando(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nuovo Bando</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Catalog View */}
      <div className="space-y-4">
        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Livello Territoriale</label>
            <select
              value={livelloFilter}
              onChange={(e) => setLivelloFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="all">Tutti i livelli</option>
              <option value="REGIONALE">Regionale (PR Molise FESR FSE+)</option>
              <option value="NAZIONALE">Nazionale (MIMIT, Invitalia)</option>
              <option value="EUROPEO">Europeo (Horizon, Digital Europe)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Area di Specializzazione RIS3</label>
            <select
              value={ris3Filter}
              onChange={(e) => setRis3Filter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="all">Tutte le aree RIS3</option>
              <option value="Agrifood">Agrifood</option>
              <option value="Scienze della vita">Scienze della vita</option>
              <option value="ICT">ICT & Digitale</option>
              <option value="Industrie culturali, turistiche e creative">Industrie culturali e turistiche</option>
              <option value="Tecnologie per la transizione">Tecnologie per la transizione</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cerca Bando</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchBando}
                onChange={(e) => setSearchBando(e.target.value)}
                placeholder="Cerca per titolo, ente o beneficiari..."
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bandi Grid */}
        {loadingBandi ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Caricamento catalogo bandi in corso...
          </div>
        ) : filteredBandi.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Nessun bando trovato con i criteri selezionati.</p>
            <p className="text-xs text-slate-400 mt-1">Prova a modificare i filtri di ricerca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBandi.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-sky-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {b.livello}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{b.ente}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {b.titolo}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md font-medium border border-sky-100">
                      RIS3: {b.area_ris3}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Scadenza: <strong>{b.scadenza}</strong>
                    </span>
                    {b.allegati && b.allegati.length > 0 && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                        <Paperclip className="w-3 h-3 text-amber-600" />
                        {b.allegati.length} {b.allegati.length === 1 ? 'allegato' : 'allegati'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {b.scheda_semplificata}
                  </p>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-800 block mb-0.5">Beneficiari ammissibili:</span>
                    <span>{b.beneficiari}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      b.stato === 'ATTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {b.stato}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBandoForModal(b)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      <span>Scheda & Allegati</span>
                      {b.allegati && b.allegati.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center justify-center">
                          {b.allegati.length}
                        </span>
                      )}
                    </button>

                    <a
                      href={b.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <span>Avviso</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {canManageBandi && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingBando({ ...b })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                          title="Modifica scheda bando"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBandoToDelete(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Elimina bando dal database SQL"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Bando Details & Attachments Modal */}
      {selectedBandoForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Scheda Dettagliata & Documentazione Bando</h3>
              </div>
              <button
                onClick={() => setSelectedBandoForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    {selectedBandoForModal.livello}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Stato: {selectedBandoForModal.stato}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-950 mt-1.5">
                  {selectedBandoForModal.titolo}
                </h4>
                <p className="text-slate-500 font-medium mt-0.5">Ente erogatore: {selectedBandoForModal.ente}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-semibold text-slate-500 block">Area RIS3:</span>
                  <span className="font-bold text-slate-800">{selectedBandoForModal.area_ris3}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Scadenza presentazione:</span>
                  <span className="font-bold text-slate-800">{selectedBandoForModal.scadenza}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Beneficiari ammissibili</h5>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                  {selectedBandoForModal.beneficiari}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 mb-1">Obiettivi e Spese Ammissibili</h5>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200">
                  {selectedBandoForModal.scheda_semplificata}
                </p>
              </div>

              {/* Attachments Section in Modal */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-sky-600" />
                    <span>Allegati Ufficiali e Modulistica</span>
                    <span className="bg-sky-100 text-sky-800 px-2 py-0.2 rounded-full text-[10px]">
                      {selectedBandoForModal.allegati?.length || 0}
                    </span>
                  </h5>
                </div>

                {(!selectedBandoForModal.allegati || selectedBandoForModal.allegati.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500">
                    <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="font-medium">Nessun allegato presente per questa scheda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedBandoForModal.allegati.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                            {getFileIcon(att.nome)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{att.nome}</p>
                            <p className="text-[10px] text-slate-500">
                              {att.dimensione || 'Documento'} {att.data_caricamento ? `• Caricato il ${att.data_caricamento}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att)}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold inline-flex items-center gap-1 text-[11px] transition-colors"
                            title="Scarica allegato"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Scarica</span>
                          </button>
                          {canManageBandi && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachmentFromSelected(att.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Rimuovi allegato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload additional attachments to this bando (only admin & coordinatore) */}
                {canManageBandi && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <input
                      type="file"
                      multiple
                      ref={(el) => setModalFileInputRef(el)}
                      onChange={(e) => handleAddAttachmentToSelected(e.target.files)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.png"
                    />
                    <button
                      type="button"
                      disabled={addingToExisting}
                      onClick={() => modalFileInputRef?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-sky-700 font-semibold text-xs transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{addingToExisting ? 'Caricamento in corso...' : '+ Aggiungi un altro allegato a questa scheda'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBandoForModal(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Chiudi
                  </button>
                  {canManageBandi && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBando({ ...selectedBandoForModal });
                          setSelectedBandoForModal(null);
                        }}
                        className="px-3 py-2 rounded-xl text-sky-700 hover:bg-sky-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifica Bando</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBandoToDelete(selectedBandoForModal)}
                        className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Elimina dal DB</span>
                      </button>
                    </>
                  )}
                </div>

                <a
                  href={selectedBandoForModal.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Apri Bando Ufficiale</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Bando with File Upload Modal */}
      {showAddBando && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Nuovo Bando nel Catalogo</h3>
                  <p className="text-[11px] text-slate-300">Inserimento scheda bando e caricamento allegati ufficiali</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBando(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBando} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titolo dell'Avviso / Bando *</label>
                <input
                  type="text"
                  required
                  value={newBando.titolo}
                  onChange={(e) => setNewBando({ ...newBando, titolo: e.target.value })}
                  placeholder="Es. PR Molise 2021-2027 - Voucher Innovazione e Digitalizzazione"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ente Erogatore</label>
                  <input
                    type="text"
                    value={newBando.ente}
                    onChange={(e) => setNewBando({ ...newBando, ente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Livello Territoriale</label>
                  <select
                    value={newBando.livello}
                    onChange={(e) => setNewBando({ ...newBando, livello: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="REGIONALE">Regionale (PR Molise)</option>
                    <option value="NAZIONALE">Nazionale (MIMIT, Invitalia)</option>
                    <option value="EUROPEO">Europeo (Horizon, Digital Europe)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area RIS3 Molise</label>
                  <select
                    value={newBando.area_ris3}
                    onChange={(e) => setNewBando({ ...newBando, area_ris3: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Agrifood">Agrifood</option>
                    <option value="Scienze della vita">Scienze della vita</option>
                    <option value="ICT">ICT & Digitale</option>
                    <option value="Industrie culturali, turistiche e creative">Industrie culturali</option>
                    <option value="Tecnologie per la transizione">Tecnologie transizione</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Scadenza Domande</label>
                  <input
                    type="date"
                    required
                    value={newBando.scadenza}
                    onChange={(e) => setNewBando({ ...newBando, scadenza: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Beneficiari Ammissibili</label>
                <input
                  type="text"
                  value={newBando.beneficiari}
                  onChange={(e) => setNewBando({ ...newBando, beneficiari: e.target.value })}
                  placeholder="Es. Micro, Piccole e Medie Imprese (PMI) con sede operativa in Molise"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheda Semplificata e Obiettivi</label>
                <textarea
                  rows={3}
                  value={newBando.scheda_semplificata}
                  onChange={(e) => setNewBando({ ...newBando, scheda_semplificata: e.target.value })}
                  placeholder="Sintesi delle spese ammissibili, intensità di aiuto e finalità..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Ufficiale Avviso / Portale</label>
                <input
                  type="url"
                  value={newBando.link}
                  onChange={(e) => setNewBando({ ...newBando, link: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* UPLOAD ALLEGATI MULTIPLI (Drag & Drop + Click) */}
              <div className="pt-2">
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-sky-600" />
                    <span>Upload Allegati Ufficiali (uno o più file)</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">PDF, DOCX, XLSX, ZIP fino a 25MB</span>
                </label>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFilesChosen(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => handleFilesChosen(e.target.files)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.png"
                  />
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-sky-600' : 'text-slate-400'}`} />
                  <p className="font-semibold text-slate-800 text-xs">
                    Trascina qui uno o più file oppure <span className="text-sky-600 underline">clicca per selezionarli</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Avviso pubblico, formulari di domanda, tabelle di spesa, linee guida
                  </p>
                </div>

                {/* List of uploaded attachments */}
                {uploadedAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-bold text-[11px] text-slate-700">
                      Allegati selezionati ({uploadedAttachments.length}):
                    </p>
                    {uploadedAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(att.nome)}
                          <span className="font-medium text-slate-800 truncate">{att.nome}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">({att.dimensione})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Pronto
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAttachment(att.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Rimuovi file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBando(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingBando}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {savingBando ? (
                    <span>Salvataggio in corso...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Salva Bando con {uploadedAttachments.length} Allegat{uploadedAttachments.length === 1 ? 'o' : 'i'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bando Modal */}
      {editingBando && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm text-white">Modifica Bando Ufficiale</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBando(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBando} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titolo del Bando *</label>
                <input
                  type="text"
                  required
                  value={editingBando.titolo}
                  onChange={(e) => setEditingBando({ ...editingBando, titolo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ente Erogatore *</label>
                  <input
                    type="text"
                    required
                    value={editingBando.ente}
                    onChange={(e) => setEditingBando({ ...editingBando, ente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Livello Territoriale</label>
                  <select
                    value={editingBando.livello}
                    onChange={(e) => setEditingBando({ ...editingBando, livello: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="REGIONALE">Regionale (Molise)</option>
                    <option value="NAZIONALE">Nazionale (MIMIT / Invitalia / MAECI)</option>
                    <option value="EUROPEO">Europeo (Horizon / NextGenEU)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Area RIS3 Molise</label>
                  <select
                    value={editingBando.area_ris3}
                    onChange={(e) => setEditingBando({ ...editingBando, area_ris3: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Agrifood">Agrifood</option>
                    <option value="ICT">ICT & Digitale</option>
                    <option value="Meccatronica">Meccatronica</option>
                    <option value="Chimica & Pharma">Chimica & Pharma</option>
                    <option value="Turismo & Cultura">Turismo & Cultura</option>
                    <option value="Altro">Altro / Generale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data di Scadenza</label>
                  <input
                    type="date"
                    value={editingBando.scadenza}
                    onChange={(e) => setEditingBando({ ...editingBando, scadenza: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stato Bando</label>
                  <select
                    value={editingBando.stato}
                    onChange={(e) => setEditingBando({ ...editingBando, stato: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="ATTIVO">ATTIVO</option>
                    <option value="IN_ATTIVAZIONE">IN ATTIVAZIONE</option>
                    <option value="SCADUTO">SCADUTO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Beneficiari Ammissibili *</label>
                <input
                  type="text"
                  required
                  value={editingBando.beneficiari}
                  onChange={(e) => setEditingBando({ ...editingBando, beneficiari: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Link Ufficiale Avviso Pubblico *</label>
                <input
                  type="url"
                  required
                  value={editingBando.link}
                  onChange={(e) => setEditingBando({ ...editingBando, link: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sky-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheda Semplificata / Sintesi Operativa *</label>
                <textarea
                  required
                  rows={4}
                  value={editingBando.scheda_semplificata}
                  onChange={(e) => setEditingBando({ ...editingBando, scheda_semplificata: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBando(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <span>Salvataggio nel DB...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Salva Modifiche nel DB SQL</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Bando Confirmation Modal */}
      {bandoToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Conferma Eliminazione Bando
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Sei sicuro di voler eliminare definitivamente questo bando dal catalogo e dal database SQL?
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase">
                  {bandoToDelete.livello}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {bandoToDelete.stato}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                {bandoToDelete.titolo}
              </div>
              <div className="text-[11px] text-slate-500">
                Ente: {bandoToDelete.ente} • Scadenza: {bandoToDelete.scadenza}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Il record e tutti i metadati correlati verranno eliminati permanentemente dalla tabella <strong>bandi</strong> del database SQL.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingBando}
                onClick={() => setBandoToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isDeletingBando}
                onClick={handleDeleteBandoConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingBando ? 'Eliminazione in corso...' : 'Elimina Definitivamente dal DB'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
