import React, { useState, useEffect } from 'react';
import { Appointment, Sportello, CrmRole, AppointmentState } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Plus,
  QrCode,
  Building2,
  User,
  ArrowUpDown,
  Trash2
} from 'lucide-react';

interface AgendaViewProps {
  role: CrmRole;
  onOpenUser360: (userId: number) => void;
}

function getApptDisplayName(appt: any): string {
  if (!appt) return 'Utente';
  const isImpresa = appt.utente_tipo === 'IMPRESA';
  const denominazione = (appt.impresa_denominazione || appt.denominazione || '').trim();
  const nominativo = [appt.aspirante_nome || appt.nome, appt.aspirante_cognome || appt.cognome]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (isImpresa) {
    return denominazione || nominativo || appt.utente_email || 'Impresa registrata';
  }
  return nominativo || denominazione || appt.utente_email || 'Utente registrato';
}

export const AgendaView: React.FC<AgendaViewProps> = ({ role, onOpenUser360 }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSportelloId, setSelectedSportelloId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status edit modal
  const [selectedApptForStatus, setSelectedApptForStatus] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentState>('SVOLTO');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupEsito, setFollowupEsito] = useState('Positivo');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Deletion modal
  const [apptToDelete, setApptToDelete] = useState<Appointment | null>(null);
  const [isDeletingAppt, setIsDeletingAppt] = useState(false);

  // Quick Check-in modal
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinMessage, setCheckinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAgenda = () => {
    setLoading(true);
    let url = '/api/crm/agenda?';
    if (selectedSportelloId !== 'all') url += `sportelloId=${selectedSportelloId}&`;
    if (selectedDate) url += `date=${selectedDate}&`;
    if (selectedState !== 'all') url += `stato=${selectedState}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  const handleDeleteAppointmentConfirm = async () => {
    if (!apptToDelete) return;
    setIsDeletingAppt(true);
    try {
      const res = await fetch(`/api/crm/appuntamenti/${apptToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la cancellazione dell\'appuntamento');
      setApptToDelete(null);
      setSelectedApptForStatus(null);
      fetchAgenda();
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione');
    } finally {
      setIsDeletingAppt(false);
    }
  };

  useEffect(() => {
    fetch('/api/sportelli')
      .then((res) => res.json())
      .then((data) => setSportelli(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchAgenda();
  }, [selectedSportelloId, selectedDate, selectedState]);

  const handleUpdateStatus = async () => {
    if (!selectedApptForStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/crm/appuntamenti/${selectedApptForStatus.id}/stato`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stato: newStatus,
          note_operatore: operatorNotes,
          followup_date: followupDate || null,
          followup_esito: followupEsito
        })
      });
      if (!res.ok) throw new Error('Errore aggiornamento stato');
      setSelectedApptForStatus(null);
      fetchAgenda();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCodeCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;
    setCheckinMessage(null);

    try {
      const res = await fetch(`/api/prenotazioni/${encodeURIComponent(checkinCode.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Codice prenotazione non trovato');

      // Update to SVOLTO
      const updRes = await fetch(`/api/crm/appuntamenti/${data.id}/stato`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'SVOLTO', note_operatore: 'Check-in rapido QR / codice operatore' })
      });
      if (!updRes.ok) throw new Error('Impossibile completare il check-in');

      setCheckinMessage({
        type: 'success',
        text: `Check-in completato con successo per ${data.impresa_denominazione || data.aspirante_nome} (${data.codice}).`
      });
      setCheckinCode('');
      fetchAgenda();
    } catch (err: any) {
      setCheckinMessage({ type: 'error', text: err.message });
    }
  };

  const filteredAppts = appointments.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.codice.toLowerCase().includes(q) ||
      (a.impresa_denominazione && a.impresa_denominazione.toLowerCase().includes(q)) ||
      (a.aspirante_nome && a.aspirante_nome.toLowerCase().includes(q)) ||
      (a.aspirante_cognome && a.aspirante_cognome.toLowerCase().includes(q)) ||
      (a.sportello_nome && a.sportello_nome.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Gestione Appuntamenti e Registro Presenze
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            Agenda Operativa
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Visualizza e gestisci le prenotazioni dei 12 sportelli, effettua il check-in e compila l'esito dei colloqui.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCheckinModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Check-in Rapido QR</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Sportello */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Sportello Territoriale</label>
          <select
            value={selectedSportelloId}
            onChange={(e) => setSelectedSportelloId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tutti gli Sportelli ({sportelli.length})</option>
            {sportelli.map((s) => (
              <option key={s.id} value={s.id}>{s.comune} - {s.nome}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
        </div>

        {/* State */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Stato Incontro</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tutti gli stati</option>
            <option value="CONFERMATO">CONFERMATO (In attesa)</option>
            <option value="SVOLTO">SVOLTO (Effettuato)</option>
            <option value="FOLLOWUP">FOLLOWUP (In follow-up)</option>
            <option value="CHIUSO_POSITIVO">CHIUSO_POSITIVO (Esito positivo)</option>
            <option value="CHIUSO_NEGATIVO">CHIUSO_NEGATIVO</option>
            <option value="NOSHOW">NOSHOW (Assente)</option>
            <option value="ANNULLATO">ANNULLATO</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Cerca (Codice, Nome, Azienda)</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca..."
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Caricamento agenda...</div>
        ) : filteredAppts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Nessun appuntamento corrispondente ai filtri impostati.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< sm) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredAppts.map((appt) => {
                const isImpresa = appt.utente_tipo === 'IMPRESA';
                return (
                  <div key={appt.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                    {/* Header line: code, status, modality */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sky-950 text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {appt.codice}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.modalita === 'PRESENZA' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {appt.modalita === 'PRESENZA' ? <MapPin className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                          <span>{appt.modalita}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          appt.stato === 'SVOLTO' || appt.stato === 'CHIUSO_POSITIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.stato === 'CONFERMATO'
                            ? 'bg-sky-100 text-sky-800'
                            : appt.stato === 'ANNULLATO' || appt.stato === 'NOSHOW'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {appt.stato}
                        </span>
                      </div>
                    </div>

                    {/* User / Business name & need */}
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                        {isImpresa ? <Building2 className="w-4 h-4 text-blue-600 shrink-0" /> : <User className="w-4 h-4 text-purple-600 shrink-0" />}
                        <span className="truncate">
                          {getApptDisplayName(appt)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {appt.categoria_bisogno}
                      </div>
                    </div>

                    {/* Date and sportello info */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Data & Ora:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(appt.data_ora).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(appt.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sportello:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {appt.sportello_nome?.replace('Sportello Territoriale ', '')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedApptForStatus(appt);
                          setNewStatus(appt.stato);
                          setOperatorNotes(appt.note_operatore || '');
                          setFollowupDate(appt.followup_date || '');
                          setFollowupEsito(appt.followup_esito || 'Positivo');
                        }}
                        className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 font-bold text-xs transition-colors text-center cursor-pointer"
                      >
                        Aggiorna Stato
                      </button>
                      <button
                        onClick={() => onOpenUser360(appt.utente_id)}
                        className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors text-center cursor-pointer"
                      >
                        Scheda 360°
                      </button>
                      <button
                        onClick={() => setApptToDelete(appt)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Elimina appuntamento dal database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Codice</th>
                    <th className="py-3 px-4">Data e Ora</th>
                    <th className="py-3 px-4">Utente / Impresa</th>
                    <th className="py-3 px-4">Sportello</th>
                    <th className="py-3 px-4">Modalità</th>
                    <th className="py-3 px-4">Stato</th>
                    <th className="py-3 px-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppts.map((appt) => {
                    const isImpresa = appt.utente_tipo === 'IMPRESA';
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-950">
                          {appt.codice}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {new Date(appt.data_ora).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Ore {new Date(appt.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isImpresa ? <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                            <span className="truncate max-w-[200px]">
                              {getApptDisplayName(appt)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {appt.categoria_bisogno}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {appt.sportello_nome?.replace('Sportello Territoriale ', '')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.modalita === 'PRESENZA' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {appt.modalita === 'PRESENZA' ? <MapPin className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                            <span>{appt.modalita}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            appt.stato === 'SVOLTO' || appt.stato === 'CHIUSO_POSITIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.stato === 'CONFERMATO'
                              ? 'bg-sky-100 text-sky-800'
                              : appt.stato === 'ANNULLATO' || appt.stato === 'NOSHOW'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {appt.stato}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedApptForStatus(appt);
                                setNewStatus(appt.stato);
                                setOperatorNotes(appt.note_operatore || '');
                                setFollowupDate(appt.followup_date || '');
                                setFollowupEsito(appt.followup_esito || 'Positivo');
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Aggiorna Stato
                            </button>
                            <button
                              onClick={() => onOpenUser360(appt.utente_id)}
                              className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Scheda 360°
                            </button>
                            <button
                              onClick={() => setApptToDelete(appt)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Elimina appuntamento dal database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedApptForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Aggiorna Stato Incontro</h3>
                <span className="text-xs text-sky-400 font-mono">{selectedApptForStatus.codice}</span>
              </div>
              <button onClick={() => setSelectedApptForStatus(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nuovo Stato Incontro</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AppointmentState)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="CONFERMATO">CONFERMATO (In attesa)</option>
                  <option value="SVOLTO">SVOLTO (Colloquio effettuato)</option>
                  <option value="FOLLOWUP">FOLLOWUP (Richiede secondo contatto)</option>
                  <option value="CHIUSO_POSITIVO">CHIUSO_POSITIVO (Pratica o orientamento andato a buon fine)</option>
                  <option value="CHIUSO_NEGATIVO">CHIUSO_NEGATIVO</option>
                  <option value="NOSHOW">NOSHOW (Utente non si è presentato)</option>
                  <option value="ANNULLATO">ANNULLATO</option>
                </select>
              </div>

              {newStatus === 'FOLLOWUP' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data programmata ricontatto</label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Esito Sintetico</label>
                <select
                  value={followupEsito}
                  onChange={(e) => setFollowupEsito(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Positivo">Positivo (Interesse confermato)</option>
                  <option value="Da approfondire">Da approfondire</option>
                  <option value="Bando non idoneo">Bando non idoneo</option>
                  <option value="Chiuso">Chiuso</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note interne dell'operatore</label>
                <textarea
                  rows={3}
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Es. Presentato bando Transizione 5.0, in attesa di bilancio..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setApptToDelete(selectedApptForStatus)}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Elimina definitivamente questo appuntamento dal database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Elimina dal DB</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApptForStatus(null)}
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Checkin QR Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Check-in Rapido QR / Codice</h3>
              </div>
              <button onClick={() => setShowCheckinModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Inquadra il QR code sul promemoria dell'utente o inserisci manualmente il codice di prenotazione per registrare istantaneamente la presenza allo sportello.
              </p>

              <form onSubmit={handleCodeCheckin} className="space-y-3">
                <input
                  type="text"
                  required
                  value={checkinCode}
                  onChange={(e) => setCheckinCode(e.target.value)}
                  placeholder="es. SI-2026-000101"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-sky-500"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  Conferma Presenza (Check-in)
                </button>
              </form>

              {checkinMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  checkinMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {checkinMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Appointment Confirmation Modal */}
      {apptToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 p-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Conferma Cancellazione Appuntamento
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Sei sicuro di voler eliminare definitivamente questo appuntamento dal database?
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sky-900 text-xs">{apptToDelete.codice}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {apptToDelete.stato}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                {getApptDisplayName(apptToDelete)}
              </div>
              <div className="text-[11px] text-slate-500">
                {new Date(apptToDelete.data_ora).toLocaleDateString('it-IT')} ore {new Date(apptToDelete.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} • {apptToDelete.sportello_nome}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 mb-6 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Il record verrà rimosso in modo permanente dalla tabella <strong>appuntamenti</strong> del database SQL.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingAppt}
                onClick={() => setApptToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={isDeletingAppt}
                onClick={handleDeleteAppointmentConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingAppt ? 'Eliminazione...' : 'Elimina Definitivamente dal DB'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
