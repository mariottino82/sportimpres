import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  Zap,
  CheckCircle2,
  AlertCircle,
  Search,
  UserPlus,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Video
} from 'lucide-react';
import { Sportello, AppointmentState } from '../../types';

interface NuovoAppuntamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sportelli: Sportello[];
  preselectedUserId?: number;
  preselectedSportelloId?: number;
}

export const NuovoAppuntamentoModal: React.FC<NuovoAppuntamentoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sportelli,
  preselectedUserId,
  preselectedSportelloId
}) => {
  // Mode: Accesso Diretto Oggi (Tempo Reale) vs Prenotazione Futura
  const [mode, setMode] = useState<'OGGI' | 'PROGRAMMATA'>('OGGI');
  const [forzato, setForzato] = useState(true);

  // Sportello
  const [sportelloId, setSportelloId] = useState<number>(() => {
    if (preselectedSportelloId) return preselectedSportelloId;
    return sportelli[0]?.id || 1;
  });

  // Date and Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  
  // Format current time rounded to 5 mins
  const getCurrentTimeFormatted = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [time, setTime] = useState<string>(getCurrentTimeFormatted());
  const [timeSelectionMode, setTimeSelectionMode] = useState<'NOW' | 'SLOT' | 'CUSTOM'>('NOW');
  const [slots, setSlots] = useState<Array<{ time: string; datetime: string; available: boolean }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // User selection: existing user vs walk-in registration
  const [userTab, setUserTab] = useState<'SEARCH' | 'NEW'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Walk-in user form
  const [walkinTipo, setWalkinTipo] = useState<'ASPIRANTE' | 'IMPRESA'>('ASPIRANTE');
  const [walkinDenominazione, setWalkinDenominazione] = useState('');
  const [walkinNome, setWalkinNome] = useState('');
  const [walkinCognome, setWalkinCognome] = useState('');
  const [walkinCodiceFiscale, setWalkinCodiceFiscale] = useState('');
  const [walkinPartitaIva, setWalkinPartitaIva] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [walkinTelefono, setWalkinTelefono] = useState('');
  const [walkinComune, setWalkinComune] = useState('');

  // Meeting details
  const [categoria, setCategoria] = useState('Bandi e finanziamenti');
  const [motivo, setMotivo] = useState('Accesso Diretto allo Sportello in Tempo Reale');
  const [modalita, setModalita] = useState<'PRESENZA' | 'VIDEOCALL'>('PRESENZA');
  const [statoIniziale, setStatoIniziale] = useState<AppointmentState>('CONFERMATO');
  const [noteOperatore, setNoteOperatore] = useState(
    'Utente presentatosi di persona allo sportello. Inserimento in tempo reale da parte dell\'operatore.'
  );
  const [inviaEmail, setInviaEmail] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessCode(null);
      setMode('OGGI');
      setDate(todayStr);
      setTime(getCurrentTimeFormatted());
      setTimeSelectionMode('NOW');
      setForzato(true);
      setStatoIniziale('CONFERMATO');
      setMotivo('Accesso Diretto allo Sportello in Tempo Reale');
      setNoteOperatore('Utente presentatosi di persona allo sportello. Inserimento in tempo reale da parte dell\'operatore.');
      if (preselectedSportelloId) setSportelloId(preselectedSportelloId);
      else if (sportelli.length > 0) setSportelloId(sportelli[0].id);

      if (preselectedUserId) {
        fetch(`/api/crm/utenti?search=${preselectedUserId}`)
          .then((r) => r.json())
          .then((list) => {
            const found = list.find((u: any) => u.id === preselectedUserId);
            if (found) setSelectedUser(found);
          })
          .catch(console.error);
      } else {
        setSelectedUser(null);
      }
    }
  }, [isOpen, preselectedUserId, preselectedSportelloId, sportelli]);

  // Update date if mode changes
  useEffect(() => {
    if (mode === 'OGGI') {
      setDate(todayStr);
      setForzato(true);
    }
  }, [mode, todayStr]);

  // Fetch slots for selected sportello & date
  useEffect(() => {
    if (!sportelloId || !date) return;
    setLoadingSlots(true);
    fetch(`/api/sportelli/${sportelloId}/slots?date=${date}&forzato=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data.slots && Array.isArray(data.slots)) {
          setSlots(data.slots);
        } else {
          setSlots([]);
        }
      })
      .catch((err) => {
        console.error('Errore caricamento slot:', err);
        setSlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, [sportelloId, date]);

  // Live user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchingUsers(true);
      fetch(`/api/crm/utenti?search=${encodeURIComponent(searchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
        })
        .catch(console.error)
        .finally(() => setSearchingUsers(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectedSportelloObj = sportelli.find((s) => s.id === sportelloId) || sportelli[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate datetime
    if (!date) {
      setErrorMsg('Seleziona una data per l\'appuntamento');
      return;
    }
    if (!time) {
      setErrorMsg('Seleziona o specifica un orario valido');
      return;
    }

    const fullDateTime = `${date} ${time}:00`;

    // Validate user
    let utenteId: number | undefined = selectedUser?.id;
    let nuovoUtentePayload: any = null;

    if (userTab === 'SEARCH') {
      if (!utenteId) {
        setErrorMsg('Seleziona un utente esistente oppure passa alla scheda "Nuovo Utente allo Sportello"');
        return;
      }
    } else {
      // Walk-in validation
      if (walkinTipo === 'IMPRESA') {
        if (!walkinDenominazione.trim()) {
          setErrorMsg('Inserisci la denominazione dell\'impresa');
          return;
        }
      } else {
        if (!walkinNome.trim() || !walkinCognome.trim()) {
          setErrorMsg('Inserisci nome e cognome dell\'aspirante imprenditore');
          return;
        }
      }

      nuovoUtentePayload = {
        tipo: walkinTipo,
        denominazione: walkinDenominazione.trim(),
        nome: walkinNome.trim(),
        cognome: walkinCognome.trim(),
        codiceFiscale: walkinCodiceFiscale.trim().toUpperCase(),
        partitaIva: walkinPartitaIva.trim(),
        email: walkinEmail.trim().toLowerCase(),
        telefono: walkinTelefono.trim(),
        comune: walkinComune.trim()
      };
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/crm/appuntamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utenteId,
          nuovoUtente: nuovoUtentePayload,
          sportelloId,
          dataOra: fullDateTime,
          modalita,
          motivo: motivo.trim() || 'Accesso Diretto allo Sportello',
          categoria,
          note: noteOperatore.trim(),
          inviaEmail,
          stato: statoIniziale,
          forzato: mode === 'OGGI' || forzato
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la registrazione dell\'appuntamento');
      }

      setSuccessCode(data.codice);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore di connessione al server');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
              <Zap className="w-3 h-3 fill-current" />
              Operatore Sportello
            </span>
            <span className="text-sky-200 text-xs font-semibold">
              Inserimento in Tempo Reale
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">
            Nuovo Appuntamento / Accesso Diretto
          </h2>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1 max-w-xl">
            Registra immediatamente la presenza o l'appuntamento dell'imprenditore recatosi allo sportello, oppure programma un incontro.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">

          {/* Success Banner */}
          {successCode && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Appuntamento registrato con successo!</p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Codice univoco generato: <strong className="font-mono text-emerald-950 font-black">{successCode}</strong>. L'agenda è stata aggiornata in tempo reale.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">Impossibile completare la registrazione</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* 1. Modalità: Accesso Diretto Oggi vs Programmato */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              1. Tipologia Inserimento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMode('OGGI');
                  setDate(todayStr);
                  setForzato(true);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  mode === 'OGGI'
                    ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Zap className="w-4 h-4 text-sky-600" />
                    <span>Accesso Diretto Oggi (Tempo Reale)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Walk-in
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-1.5">
                  L'utente è fisicamente presente allo sportello oggi. La prenotazione viene forzata istantaneamente.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('PROGRAMMATA')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  mode === 'PROGRAMMATA'
                    ? 'border-sky-600 bg-sky-50/70 shadow-xs ring-2 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Calendar className="w-4 h-4 text-slate-700" />
                  <span>Prenotazione Programmata Futura</span>
                </div>
                <p className="text-slate-600 text-xs mt-1.5">
                  Fissa un appuntamento per una data futura o per una sessione calendarizzata.
                </p>
              </button>
            </div>
          </div>

          {/* Forzatura Info Callout */}
          {mode === 'OGGI' && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-extrabold text-xs text-emerald-900">
                    🟢 Forzatura al Giorno Stesso Autorizzata
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-800">
                    <input
                      type="checkbox"
                      checked={forzato}
                      onChange={(e) => setForzato(e.target.checked)}
                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Abilita override orari/giorni sportello</span>
                  </label>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  L'operatore può registrare in tempo reale la presenza anche al di fuori delle fasce standard o in giornate di chiusura ordinaria al pubblico.
                </p>
              </div>
            </div>
          )}

          {/* 2. Sede Sportello & Orario */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              2. Sede Sportello e Orario Incontro
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sportello */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sportello Territoriale
                </label>
                <select
                  value={sportelloId}
                  onChange={(e) => setSportelloId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  {sportelli.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.comune} — {s.nome}
                    </option>
                  ))}
                </select>
                {selectedSportelloObj && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    📍 {selectedSportelloObj.indirizzo} • Orario standard: {selectedSportelloObj.orario}
                  </p>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Data Appuntamento
                </label>
                {mode === 'OGGI' ? (
                  <div className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50/60 font-bold text-emerald-950 flex items-center justify-between">
                    <span>Oggi ({new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})</span>
                    <span className="text-[10px] font-mono bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900">
                      {todayStr}
                    </span>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={date}
                    min={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                  />
                )}
              </div>
            </div>

            {/* Time selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                <label className="font-semibold text-slate-700">
                  Orario Incontro
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeSelectionMode('NOW');
                      setTime(getCurrentTimeFormatted());
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      timeSelectionMode === 'NOW'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ⚡ Orario Corrente (Adesso)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSelectionMode('SLOT')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      timeSelectionMode === 'SLOT'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Fasce Sportello
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSelectionMode('CUSTOM')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      timeSelectionMode === 'CUSTOM'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Personalizzato
                  </button>
                </div>
              </div>

              {timeSelectionMode === 'NOW' && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold text-slate-900">
                      Orario in tempo reale: <strong className="text-sm font-black font-mono text-sky-900">{time}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTime(getCurrentTimeFormatted())}
                    className="text-[11px] text-sky-700 hover:underline font-semibold"
                  >
                    Aggiorna a questo minuto
                  </button>
                </div>
              )}

              {timeSelectionMode === 'SLOT' && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  {loadingSlots ? (
                    <p className="text-slate-400 italic">Caricamento fasce orarie in corso...</p>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {slots.map((s) => {
                        const isSelected = time === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            onClick={() => setTime(s.time)}
                            className={`py-2 px-1 rounded-lg text-center font-mono font-bold text-xs border transition-all ${
                              isSelected
                                ? 'bg-sky-600 text-white border-sky-600 shadow-xs ring-1 ring-sky-500'
                                : s.available
                                ? 'bg-slate-50 hover:bg-sky-50 text-slate-800 border-slate-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {s.time}
                            {!s.available && (
                              <span className="block text-[8px] font-sans font-medium text-amber-700">occupato</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-slate-500">Nessuna fascia standard definita per oggi. Inserisci orario manuale:</p>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="px-2.5 py-1 border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {timeSelectionMode === 'CUSTOM' && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <label className="font-semibold text-slate-700">Specifica orario preciso:</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-slate-400 text-[11px]">(durata standard 30 minuti)</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Utente: Cerca Esistente vs Nuovo Walk-in */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                3. Anagrafica Utente / Impresa
              </label>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setUserTab('SEARCH')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    userTab === 'SEARCH'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔍 Cerca Esistente
                </button>
                <button
                  type="button"
                  onClick={() => setUserTab('NEW')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    userTab === 'NEW'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                  Nuovo Utente allo Sportello
                </button>
              </div>
            </div>

            {/* TAB SEARCH */}
            {userTab === 'SEARCH' && (
              <div className="space-y-3">
                {selectedUser ? (
                  <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedUser.tipo === 'IMPRESA' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedUser.tipo}
                        </span>
                        <strong className="text-sm text-slate-900">
                          {selectedUser.tipo === 'IMPRESA'
                            ? selectedUser.impresa_denominazione || selectedUser.denominazione || selectedUser.email
                            : `${selectedUser.aspirante_nome || selectedUser.nome || ''} ${selectedUser.aspirante_cognome || selectedUser.cognome || ''}`.trim() || selectedUser.email}
                        </strong>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        ✉️ {selectedUser.email || 'Nessuna email'} • 📞 {selectedUser.telefono || 'Nessun telefono'} • 📍 {selectedUser.impresa_comune || selectedUser.aspirante_comune || 'Molise'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="px-3 py-1 text-xs font-bold text-sky-700 hover:text-sky-900 underline"
                    >
                      Cambia
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Digita denominazione, nome, email, telefono, P.IVA o Codice Fiscale..."
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      />
                    </div>

                    {searchingUsers && (
                      <p className="text-slate-400 italic">Ricerca anagrafica in corso...</p>
                    )}

                    {searchResults.length > 0 && (
                      <div className="border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                        {searchResults.map((u) => {
                          const isImp = u.tipo === 'IMPRESA';
                          const title = isImp
                            ? u.impresa_denominazione || u.denominazione || u.email
                            : `${u.aspirante_nome || u.nome || ''} ${u.aspirante_cognome || u.cognome || ''}`.trim() || u.email;
                          const sub = [u.email, u.telefono, u.impresa_piva || u.codice_fiscale].filter(Boolean).join(' • ');

                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                              className="w-full p-2.5 text-left hover:bg-sky-50 flex items-center justify-between transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isImp ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {u.tipo}
                                  </span>
                                  <strong className="text-xs text-slate-900">{title}</strong>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                              </div>
                              <span className="text-xs text-sky-600 font-bold">Seleziona →</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {searchQuery.trim() && !searchingUsers && searchResults.length === 0 && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                        <p className="text-slate-500">Nessun utente trovato con questo criterio.</p>
                        <button
                          type="button"
                          onClick={() => setUserTab('NEW')}
                          className="mt-1.5 text-xs text-sky-700 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Registra come nuovo utente allo sportello
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB NEW WALK-IN USER */}
            {userTab === 'NEW' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">Profilo Walk-in:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="walkinTipo"
                      value="ASPIRANTE"
                      checked={walkinTipo === 'ASPIRANTE'}
                      onChange={() => setWalkinTipo('ASPIRANTE')}
                      className="text-sky-600"
                    />
                    <span className="font-bold text-slate-800">Aspirante Imprenditore</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="walkinTipo"
                      value="IMPRESA"
                      checked={walkinTipo === 'IMPRESA'}
                      onChange={() => setWalkinTipo('IMPRESA')}
                      className="text-sky-600"
                    />
                    <span className="font-bold text-slate-800">Impresa (con P.IVA)</span>
                  </label>
                </div>

                {walkinTipo === 'IMPRESA' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Ragione Sociale / Denominazione Impresa *
                      </label>
                      <input
                        type="text"
                        value={walkinDenominazione}
                        onChange={(e) => setWalkinDenominazione(e.target.value)}
                        placeholder="Es. Molise Tech S.r.l."
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Partita IVA / Codice Fiscale Impresa
                      </label>
                      <input
                        type="text"
                        value={walkinPartitaIva}
                        onChange={(e) => setWalkinPartitaIva(e.target.value)}
                        placeholder="Es. 01234567890"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Referente (Nome e Cognome)
                      </label>
                      <input
                        type="text"
                        value={walkinNome}
                        onChange={(e) => setWalkinNome(e.target.value)}
                        placeholder="Es. Mario Rossi"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={walkinNome}
                        onChange={(e) => setWalkinNome(e.target.value)}
                        placeholder="Es. Mario"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Cognome *
                      </label>
                      <input
                        type="text"
                        value={walkinCognome}
                        onChange={(e) => setWalkinCognome(e.target.value)}
                        placeholder="Es. Rossi"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Codice Fiscale
                      </label>
                      <input
                        type="text"
                        value={walkinCodiceFiscale}
                        onChange={(e) => setWalkinCodiceFiscale(e.target.value)}
                        placeholder="Es. RSSMRA80A01B519X"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Comune di Residenza
                      </label>
                      <input
                        type="text"
                        value={walkinComune}
                        onChange={(e) => setWalkinComune(e.target.value)}
                        placeholder="Es. Campobasso"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Common contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Email (opzionale per invio ricevuta)
                    </label>
                    <input
                      type="email"
                      value={walkinEmail}
                      onChange={(e) => setWalkinEmail(e.target.value)}
                      placeholder="utente@esempio.it"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Telefono / Cellulare
                    </label>
                    <input
                      type="tel"
                      value={walkinTelefono}
                      onChange={(e) => setWalkinTelefono(e.target.value)}
                      placeholder="Es. 333 1234567"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Dettagli Incontro & Esito Iniziale */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              4. Dettagli Incontro e Stato
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoria di Bisogno
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                >
                  <option value="Bandi e finanziamenti">Bandi e contributi regionali/nazionali</option>
                  <option value="Creazione impresa">Creazione d'impresa / Startup</option>
                  <option value="Credito e microcredito">Credito e finanza agevolata</option>
                  <option value="Digitalizzazione e AI">Transizione digitale & Intelligenza Artificiale</option>
                  <option value="Transizione ecologica">Transizione ecologica & ESG</option>
                  <option value="Formazione e competenze">Formazione, lavoro e competenze</option>
                  <option value="Altro">Informazioni generali e primo orientamento</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stato Iniziale Incontro
                </label>
                <select
                  value={statoIniziale}
                  onChange={(e) => setStatoIniziale(e.target.value as AppointmentState)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-900"
                >
                  <option value="CONFERMATO">CONFERMATO (In attesa / programmato oggi)</option>
                  <option value="SVOLTO">SVOLTO (Colloquio completato adesso allo sportello)</option>
                  <option value="FOLLOWUP">FOLLOWUP (Richiede istruttoria successiva)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {statoIniziale === 'SVOLTO'
                    ? '✓ Registra l\'accesso come già effettuato con successo'
                    : 'Pianifica l\'incontro nella lista odierna'}
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Motivo / Sintesi Richiesta
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Es. Richiesta informazioni bando investimenti artigianato"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Note Interne Operatore
              </label>
              <textarea
                value={noteOperatore}
                onChange={(e) => setNoteOperatore(e.target.value)}
                rows={2}
                placeholder="Eventuali dettagli o richieste discusse allo sportello..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>

            {/* Email Checkbox */}
            {(selectedUser?.email || walkinEmail.trim()) && (
              <label className="inline-flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={inviaEmail}
                  onChange={(e) => setInviaEmail(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-700 text-xs">
                  Invia email di promemoria / riepilogo a <strong>{selectedUser?.email || walkinEmail}</strong>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !!successCode}
            className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Registrazione in corso...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-current" />
                <span>
                  {mode === 'OGGI'
                    ? '⚡ Registra Appuntamento in Tempo Reale'
                    : 'Conferma Prenotazione Programmata'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
