import React, { useState, useEffect } from 'react';
import { UserType, Appointment, Interaction, CrmRole } from '../../types';
import {
  X,
  Building2,
  User,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Save,
  Download,
  Trash2,
  CheckCircle,
  FileText,
  Clock,
  MapPin,
  Phone,
  Mail,
  Edit3,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface Scheda360ModalProps {
  userId: number;
  role?: CrmRole;
  onClose: () => void;
  onUpdated?: () => void;
  onNavigateToBandi?: (user?: any) => void;
}

const parseSafeDate = (val?: any): Date | null => {
  if (!val) return null;
  const s = typeof val === 'string' ? val.trim().replace(' ', 'T') : val;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatSafeDate = (val?: any): string => {
  const d = parseSafeDate(val);
  if (!d) return 'N/D';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatSafeDateTime = (val?: any): string => {
  const d = parseSafeDate(val);
  if (!d) return 'N/D';
  return `${d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })} ore ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
};

export const Scheda360Modal: React.FC<Scheda360ModalProps> = ({
  userId,
  role,
  onClose,
  onUpdated,
  onNavigateToBandi
}) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingPostColloquio, setSavingPostColloquio] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canDelete = !role || role === 'ADMIN' || role === 'COORDINATORE';

  // Action modals
  const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [modalNotice, setModalNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Post-colloquio operator form state
  const [atecoVerificato, setAtecoVerificato] = useState('');
  const [ris3Verificata, setRis3Verificata] = useState('ICT');
  const [dimensioneVerificata, setDimensioneVerificata] = useState('Piccola');
  const [faseVitaVerificata, setFaseVitaVerificata] = useState('Startup');
  const [innovazioneScore, setInnovazioneScore] = useState(4);
  const [aiScore, setAiScore] = useState(2);
  const [criticita, setCriticita] = useState('');
  const [strumentiSuggeriti, setStrumentiSuggeriti] = useState('');
  const [noteOperatore, setNoteOperatore] = useState('');

  const fetchUser360 = () => {
    setLoading(true);
    fetch(`/api/crm/utenti/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        const p = data.profilo || {};
        setAtecoVerificato(p.ateco || '');
        setRis3Verificata(p.settore_ris3 || p.settore_attivita || 'ICT');
        setDimensioneVerificata(p.dimensione || 'Piccola');
        setFaseVitaVerificata(p.fase_vita || 'Startup');
        setInnovazioneScore(p.grado_innovazione || 3);
        setAiScore(p.uso_ai || 1);
        setCriticita(p.criticita_identificate || '');
        setStrumentiSuggeriti(p.strumenti_suggeriti || '');
        setNoteOperatore(p.note_operatore || '');
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUser360();
  }, [userId]);

  const handleSavePostColloquio = async () => {
    setSavingPostColloquio(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/crm/utenti/${userId}/profilo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ateco: atecoVerificato,
          settore_ris3: ris3Verificata,
          dimensione: dimensioneVerificata,
          fase_vita: faseVitaVerificata,
          grado_innovazione: innovazioneScore,
          uso_ai: aiScore,
          criticita_identificate: criticita,
          strumenti_suggeriti: strumentiSuggeriti,
          note_operatore: noteOperatore
        })
      });
      if (!res.ok) throw new Error('Errore nel salvataggio della scheda EDP');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPostColloquio(false);
    }
  };

  const handleGdprExport = () => {
    if (!userData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dati_GDPR_Utente_${userId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAnonymizeConfirm = async () => {
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/crm/utenti/${userId}/anonimizza`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'anonimizzazione');
      setShowAnonymizeConfirm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setModalNotice({ type: 'error', message: err.message || 'Errore durante l\'anonimizzazione' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteUserConfirm = async () => {
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/crm/utenti/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la cancellazione nel database SQL');
      setShowDeleteConfirm(false);
      onUpdated();
      onClose();
    } catch (err: any) {
      setModalNotice({ type: 'error', message: err.message || 'Errore cancellazione utente' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500">
          Caricamento Scheda 360°...
        </div>
      </div>
    );
  }

  const utente = userData?.utente || {};
  const profilo = userData?.profilo || {};
  const appuntamenti = Array.isArray(userData?.appuntamenti) ? userData.appuntamenti : [];
  const interazioni = Array.isArray(userData?.interazioni) ? userData.interazioni : [];
  const isImpresa = utente?.tipo === 'IMPRESA';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Top Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${isImpresa ? 'bg-blue-600' : 'bg-purple-600'}`}>
              {isImpresa ? <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {isImpresa
                    ? (profilo?.denominazione || 'Impresa Molise')
                    : ([profilo?.nome, profilo?.cognome].filter(Boolean).join(' ') || utente.email || 'Aspirante Imprenditore')}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${isImpresa ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                  {utente.tipo}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-slate-400 block truncate">
                ID #{utente.id} • {formatSafeDate(utente.creato_il || utente.data_creazione || utente.created_at)} via {utente.canale_accesso || 'Sito Web'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Row 1: Anagrafica & GDPR Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Riepilogo Dati Anagrafici</span>
              </h4>
              {isImpresa ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>Denominazione: <strong>{profilo?.denominazione}</strong></div>
                  <div>Partita IVA: <strong className="font-mono">{profilo?.partita_iva}</strong></div>
                  <div>Referente: <strong>{profilo?.nome_referente} {profilo?.cognome_referente}</strong> ({profilo?.ruolo})</div>
                  <div>Sede: <strong>{profilo?.comune_sede}</strong></div>
                  <div>Email: <a href={`mailto:${utente.email}`} className="text-sky-700 underline">{utente.email}</a></div>
                  <div>Tel: <a href={`tel:${utente.telefono}`} className="text-sky-700 underline">{utente.telefono}</a></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>Nome e Cognome: <strong>{profilo?.nome} {profilo?.cognome}</strong></div>
                  <div>Residenza: <strong>{profilo?.comune_residenza}</strong></div>
                  <div>Email: <a href={`mailto:${utente.email}`} className="text-sky-700 underline">{utente.email}</a></div>
                  <div>Tel: <a href={`tel:${utente.telefono}`} className="text-sky-700 underline">{utente.telefono}</a></div>
                  <div>Condizione: <strong>{profilo?.condizione_attuale || 'N/D'}</strong></div>
                  <div>Stato Idea: <strong>{profilo?.stato_idea || 'N/D'}</strong></div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consensi & Privacy GDPR</span>
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Consenso Base Trattamento (Obbligatorio):</span>
                  <span className="font-bold text-emerald-700">✓ Concesso ({formatSafeDate(utente.consenso_privacy_data || utente.creato_il || utente.data_creazione)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Newsletter e Aggiornamenti Bandi:</span>
                  <span className={`font-bold ${utente.consenso_newsletter ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {utente.consenso_newsletter ? '✓ Sì' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Geolocalizzazione Sportello:</span>
                  <span className={`font-bold ${utente.consenso_geo ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {utente.consenso_geo ? '✓ Concesso' : '✗ Non fornito'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGdprExport}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Esporta Dati JSON (GDPR)</span>
                </button>
                {canDelete && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAnonymizeConfirm(true)}
                      className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Rimuove i dati identificativi personali mantenendo i dati aggregati per statistiche"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>Anonimizza (GDPR)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Elimina definitivamente l'utente e tutti i record collegati dal database SQL"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Elimina dal Database SQL</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Operator Post-Colloquio Form (Scheda EDP Capitolo 8.3) */}
          <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-700" />
                <h4 className="font-bold text-sky-950 uppercase text-xs">
                  Scheda di Sintesi Post-Colloquio Operatore (EDP & RIS3)
                </h4>
              </div>
              <span className="text-[10px] text-sky-800 font-semibold">
                Compilazione riservata all'operatore dopo l'incontro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Codice ATECO Verificato</label>
                <input
                  type="text"
                  value={atecoVerificato}
                  onChange={(e) => setAtecoVerificato(e.target.value)}
                  placeholder="es. 62.01.00"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area di Specializzazione RIS3</label>
                <select
                  value={ris3Verificata}
                  onChange={(e) => setRis3Verificata(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Agrifood">Agrifood</option>
                  <option value="Scienze della vita">Scienze della vita</option>
                  <option value="ICT">ICT e Digitale</option>
                  <option value="Industrie culturali, turistiche e creative">Industrie culturali e creative</option>
                  <option value="Tecnologie per la transizione">Tecnologie per la transizione</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fase di Vita</label>
                <select
                  value={faseVitaVerificata}
                  onChange={(e) => setFaseVitaVerificata(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Startup">Startup (&lt; 3 anni)</option>
                  <option value="In crescita">In crescita</option>
                  <option value="Consolidata">Consolidata</option>
                  <option value="Riconversione">In riconversione</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grado Innovazione (1-5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInnovazioneScore(s)}
                      className={`text-lg ${s <= innovazioneScore ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grado di Digitalizzazione (1-5)</label>
                <select
                  value={aiScore}
                  onChange={(e) => setAiScore(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="1">1 = Di base (email, web)</option>
                  <option value="2">2 = Sistemi gestionali</option>
                  <option value="3">3 = Cloud e processi digitalizzati</option>
                  <option value="4">4 = E-commerce e automazione</option>
                  <option value="5">5 = Digitale avanzato / 4.0</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dimensione Rilevata</label>
                <select
                  value={dimensioneVerificata}
                  onChange={(e) => setDimensioneVerificata(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Micro (fino a 9)">Micro (fino a 9)</option>
                  <option value="Piccola (10-49)">Piccola (10-49)</option>
                  <option value="Media (50-249)">Media (50-249)</option>
                  <option value="Grande">Grande</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Criticità o Fabbisogni Identificati (accesso credito, burocrazia, competenze...)
                </label>
                <input
                  type="text"
                  value={criticita}
                  onChange={(e) => setCriticita(e.target.value)}
                  placeholder="Es. Necessità di supporto per redazione perizia tecnica o garanzie fideiussorie..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Bandi o Strumenti Suggeriti dall'Operatore
                </label>
                <input
                  type="text"
                  value={strumentiSuggeriti}
                  onChange={(e) => setStrumentiSuggeriti(e.target.value)}
                  placeholder="Es. Voucher Digitalizzazione 2026, Microcredito Molise..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Note Operatore e Indicazioni per il Follow-up
                </label>
                <textarea
                  rows={2}
                  value={noteOperatore}
                  onChange={(e) => setNoteOperatore(e.target.value)}
                  placeholder="Note interne dell'incontro..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Dati post-colloquio aggiornati con successo!
                </span>
              )}
              <div className="ml-auto">
                <button
                  disabled={savingPostColloquio}
                  onClick={handleSavePostColloquio}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPostColloquio ? 'Salvataggio...' : 'Salva Scheda Post-Colloquio'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: History of Appointments */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Storico Appuntamenti ({appuntamenti.length})</span>
            </h4>
            {appuntamenti.length === 0 ? (
              <p className="text-slate-400 italic">Nessun appuntamento registrato.</p>
            ) : (
              <div className="space-y-2">
                {appuntamenti.map((a: any) => (
                  <div key={a.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-900">{a.codice}</span>
                        <span className="font-semibold text-slate-900">
                          {formatSafeDateTime(a.data_ora)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100">{a.stato}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{a.sportello_nome} • {a.categoria_bisogno}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: History of Interactions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>Registro Interazioni ({interazioni.length})</span>
            </h4>
            {interazioni.length === 0 ? (
              <p className="text-slate-400 italic">Nessuna interazione aggiuntiva registrata.</p>
            ) : (
              <div className="space-y-2">
                {interazioni.map((i: any) => (
                  <div key={i.id} className="p-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>{formatSafeDateTime(i.data_ora)} • Canale: <strong>{i.canale}</strong></span>
                      <span className="font-semibold text-slate-800">Operatore: {i.operatore_nome}</span>
                    </div>
                    <div className="font-bold text-slate-900">{i.tipologia_richiesta}</div>
                    <p className="text-slate-600 mt-0.5">{i.note || i.esito}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal: Conferma Anonimizzazione GDPR */}
        {showAnonymizeConfirm && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Conferma Diritto all'Oblio (GDPR)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Sei sicuro di voler anonimizzare questo utente? Tutti i dati personali identificativi (nome, cognome, ragione sociale, email, telefono, P.IVA/CF) verranno sovrascritti irreversibilmente nel database.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setShowAnonymizeConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleAnonymizeConfirm}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAction ? 'Anonimizzazione in corso...' : 'Conferma Anonimizzazione'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Conferma Eliminazione Utente dal Database SQL */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Elimina Utente dal Database SQL
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Sei sicuro di voler cancellare definitivamente questo utente dal database SQLite?
              </p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 mb-4 leading-relaxed">
                ⚠️ Questa operazione cancellerà a cascata dal database la scheda utente (tabella <code>utenti</code>), il profilo d'impresa/aspirante, i consensi privacy, gli appuntamenti e le interazioni associate.
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={handleDeleteUserConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAction ? 'Cancellazione...' : 'Elimina Definitivamente dal DB'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notice Toast */}
        {modalNotice && (
          <div className="fixed bottom-4 right-4 z-70 animate-in fade-in">
            <div className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold ${
              modalNotice.type === 'success' ? 'bg-emerald-800 text-white' : 'bg-rose-800 text-white'
            }`}>
              {modalNotice.message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
