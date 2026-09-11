import React, { useState, useEffect } from 'react';
import { Interaction, Sportello, CrmRole } from '../../types';
import {
  MessageSquare,
  Phone,
  MessageCircle,
  Video,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Building2,
  User,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface InterazioniViewProps {
  role: CrmRole;
  onOpenUser360: (userId: number) => void;
}

export const InterazioniView: React.FC<InterazioniViewProps> = ({ role, onOpenUser360 }) => {
  const [interazioni, setInterazioni] = useState<Interaction[]>([]);
  const [ricontatti, setRicontatti] = useState<any[]>([]);
  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'registro' | 'coda'>('registro');
  const [loading, setLoading] = useState(true);

  // Deletion modal
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);
  const [isDeletingInteraction, setIsDeletingInteraction] = useState(false);

  // New interaction modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    utente_id: '',
    sportello_id: '1',
    operatore_nome: 'Operatore SIM',
    canale: 'TELEFONO',
    tipologia_richiesta: 'Informazioni sui bandi e requisiti di accesso',
    bandi_trattati: 'Voucher Innovazione 2026',
    esito: 'Colloquio positivo, inviato materiale via email',
    stato_followup: 'Positivo',
    data_prossimo_ricontatto: '',
    note: ''
  });
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchInteractions = () => {
    setLoading(true);
    fetch('/api/crm/interazioni')
      .then((res) => res.json())
      .then((data) => {
        setInterazioni(data);
        setLoading(false);
      })
      .catch(console.error);

    fetch('/api/crm/ricontatti')
      .then((res) => res.json())
      .then((data) => setRicontatti(data))
      .catch(console.error);

    fetch('/api/crm/utenti')
      .then((res) => res.json())
      .then((data) => {
        setUsersList(data);
        if (data.length > 0 && !newInteraction.utente_id) {
          setNewInteraction((prev) => ({ ...prev, utente_id: String(data[0].id) }));
        }
      })
      .catch(console.error);

    fetch('/api/sportelli')
      .then((res) => res.json())
      .then((data) => setSportelli(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/interazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInteraction)
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      setShowAddModal(false);
      fetchInteractions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteInteractionConfirm = async () => {
    if (!interactionToDelete) return;
    setIsDeletingInteraction(true);
    try {
      const res = await fetch(`/api/crm/interazioni/${interactionToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la cancellazione dell\'interazione');
      setInteractionToDelete(null);
      fetchInteractions();
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione');
    } finally {
      setIsDeletingInteraction(false);
    }
  };

  const getCanaleBadge = (canale: string) => {
    switch (canale) {
      case 'TELEFONO':
        return <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-[10px]"><Phone className="w-3 h-3" /> Telefono</span>;
      case 'WHATSAPP':
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]"><MessageCircle className="w-3 h-3" /> WhatsApp</span>;
      case 'SPORTELLO':
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]"><MapPin className="w-3 h-3" /> Sportello</span>;
      case 'VIDEOCALL':
        return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px]"><Video className="w-3 h-3" /> Videocall</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold text-[10px]">{canale}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Registro Multicanale & Follow-up (B)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            Interazioni e Coda Ricontatti
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Tracciamento delle telefonate del Contact Center, messaggi WhatsApp, colloqui fisici e gestione solleciti a 30 e 60 giorni.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nuova Interazione</span>
          </button>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none w-full min-w-0">
        <button
          onClick={() => setActiveSubTab('registro')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'registro'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Registro Storico ({interazioni.length})
        </button>

        <button
          onClick={() => setActiveSubTab('coda')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
            activeSubTab === 'coda'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Coda da Ricontattare ({ricontatti.length})</span>
        </button>
      </div>

      {/* View 1: Registro Storico */}
      {activeSubTab === 'registro' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Caricamento interazioni...</div>
          ) : interazioni.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Nessuna interazione registrata.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs text-slate-700">
              {interazioni.map((it) => (
                <div key={it.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getCanaleBadge(it.canale)}
                      <span className="font-bold text-slate-900 text-sm">
                        {it.impresa_denominazione || [it.aspirante_nome, it.aspirante_cognome].filter(Boolean).join(' ') || 'Utente'}
                      </span>
                      <span className="text-slate-400 text-[11px]">•</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(it.data_ora).toLocaleDateString('it-IT')} ore {new Date(it.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-400 text-[11px]">•</span>
                      <span className="text-slate-500 text-[11px]">Operatore: <strong>{it.operatore_nome}</strong></span>
                    </div>

                    <p className="font-semibold text-slate-800">
                      {it.tipologia_richiesta}
                    </p>

                    {it.bandi_trattati && (
                      <div className="text-[11px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded inline-block font-medium">
                        Bandi trattati: {it.bandi_trattati}
                      </div>
                    )}

                    <p className="text-slate-600 italic">
                      "{it.esito}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenUser360(it.utente_id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Scheda 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionToDelete(it)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Elimina interazione dal database"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View 2: Coda Ricontatti (Contact Center) */}
      {activeSubTab === 'coda' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <strong>Coda di Follow-Up Contact Center:</strong> Include utenti che hanno richiesto approfondimenti, aziende con bando in preparazione, o incontri terminati con stato "FOLLOWUP".
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 text-xs">
            {ricontatti.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nessun contatto in sospeso nella coda di ricontatto.
              </div>
            ) : (
              ricontatti.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {r.impresa_denominazione || [r.aspirante_nome, r.aspirante_cognome].filter(Boolean).join(' ') || r.utente_email || 'Utente'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Follow-up {r.stato_followup || 'In attesa'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span>Tel: <a href={`tel:${r.utente_telefono}`} className="text-sky-700 font-bold underline">{r.utente_telefono}</a></span>
                      <span>Email: <a href={`mailto:${r.utente_email}`} className="text-sky-700 underline">{r.utente_email}</a></span>
                      {r.data_prossimo_ricontatto && (
                        <span>Data prevista: <strong className="text-amber-800">{new Date(r.data_prossimo_ricontatto).toLocaleDateString('it-IT')}</strong></span>
                      )}
                    </div>

                    <p className="text-slate-600 mt-1">
                      Ultima nota: <em>{r.note || r.esito || 'In attesa di documentazione'}</em>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/39${(r.utente_telefono || '').replace(/\D/g, '')}?text=Buongiorno%20dallo%20Sportello%20Imprese%20Molise`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={() => onOpenUser360(r.utente_id)}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                    >
                      Scheda 360°
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Interaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Registra Interazione Multicanale</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveInteraction} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Utente / Impresa *</label>
                <select
                  value={newInteraction.utente_id}
                  onChange={(e) => setNewInteraction({ ...newInteraction, utente_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.tipo === 'IMPRESA' ? u.denominazione : `${u.nome} ${u.cognome}`} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Canale</label>
                  <select
                    value={newInteraction.canale}
                    onChange={(e) => setNewInteraction({ ...newInteraction, canale: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="TELEFONO">Telefono</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SPORTELLO">Sportello Fisico</option>
                    <option value="VIDEOCALL">Videocall</option>
                    <option value="EVENTO">Evento Territoriale</option>
                    <option value="HACKATHON">Hackathon</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sportello di Riferimento</label>
                  <select
                    value={newInteraction.sportello_id}
                    onChange={(e) => setNewInteraction({ ...newInteraction, sportello_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {sportelli.map((s) => (
                      <option key={s.id} value={s.id}>{s.comune}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipologia di Richiesta *</label>
                <input
                  type="text"
                  required
                  value={newInteraction.tipologia_richiesta}
                  onChange={(e) => setNewInteraction({ ...newInteraction, tipologia_richiesta: e.target.value })}
                  placeholder="Es. Richiesta informazioni requisiti bando transizione"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bandi Trattati</label>
                <input
                  type="text"
                  value={newInteraction.bandi_trattati}
                  onChange={(e) => setNewInteraction({ ...newInteraction, bandi_trattati: e.target.value })}
                  placeholder="Es. Voucher Innovazione 2026, Fondo FESR 1.4.2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Esito del Contatto *</label>
                <textarea
                  rows={2}
                  required
                  value={newInteraction.esito}
                  onChange={(e) => setNewInteraction({ ...newInteraction, esito: e.target.value })}
                  placeholder="Sintesi di quanto concordato..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stato Follow-up</label>
                  <select
                    value={newInteraction.stato_followup}
                    onChange={(e) => setNewInteraction({ ...newInteraction, stato_followup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Positivo">Positivo</option>
                    <option value="In attesa">In attesa di riscontro</option>
                    <option value="Da ricontattare">Da ricontattare</option>
                    <option value="Chiuso">Chiuso / Non interessato</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Ricontatto (opzionale)</label>
                  <input
                    type="date"
                    value={newInteraction.data_prossimo_ricontatto}
                    onChange={(e) => setNewInteraction({ ...newInteraction, data_prossimo_ricontatto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Registra Interazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Interaction Confirmation Modal */}
      {interactionToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Conferma Eliminazione Interazione
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Sei sicuro di voler eliminare definitivamente questa annotazione di interazione dal database?
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1 text-xs">
              <div className="font-bold text-slate-900">
                {interactionToDelete.tipologia_richiesta}
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(interactionToDelete.data_ora).toLocaleDateString('it-IT')} • Canale: {interactionToDelete.canale} • {interactionToDelete.operatore_nome}
              </div>
              <p className="text-[11px] text-slate-600 italic mt-1">
                "{interactionToDelete.esito || interactionToDelete.note}"
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Il record verrà rimosso in modo permanente dalla tabella <strong>interazioni</strong> del database SQL.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingInteraction}
                onClick={() => setInteractionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isDeletingInteraction}
                onClick={handleDeleteInteractionConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingInteraction ? 'Eliminazione...' : 'Elimina Definitivamente dal DB'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
