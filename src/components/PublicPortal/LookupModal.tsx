import React, { useState } from 'react';
import { Appointment, Sportello } from '../../types';
import { PdfPromemoriaModal } from '../PdfPromemoriaModal';
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  CheckCircle,
  AlertCircle,
  Trash2,
  Building2,
  User,
  ExternalLink
} from 'lucide-react';

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LookupModal: React.FC<LookupModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [profilo, setProfilo] = useState<any | null>(null);
  const [sportello, setSportello] = useState<Sportello | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  // Cancellation state
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  if (!isOpen) return null;

  const formatDateSafe = (dateStr?: string) => {
    if (!dateStr) return 'Data da concordare';
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimeSafe = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setAppointment(null);
    setProfilo(null);
    setSportello(null);
    setCancelSuccess(false);

    try {
      const res = await fetch(`/api/prenotazioni/${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nessun appuntamento trovato con questo codice o token.');
      }

      // Handle both flat and nested appointment structure
      const apptObj: Appointment = data.appuntamento || data;
      const profObj = data.profilo || null;

      setAppointment(apptObj);
      setProfilo(profObj);

      const sportelloId = apptObj.sportello_id || data.sportello_id;
      if (sportelloId) {
        const sRes = await fetch(`/api/sportelli/${sportelloId}`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setSportello(sData);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment || !window.confirm('Sei sicuro di voler annullare questo appuntamento? L\'azione libererà lo slot.')) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/prenotazioni/${appointment.codice}/annulla`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'annullamento');

      setAppointment((prev) => prev ? { ...prev, stato: 'ANNULLATO' } : null);
      setCancelSuccess(true);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const nominativo = appointment?.impresa_denominazione ||
    profilo?.denominazione ||
    (appointment?.aspirante_nome ? `${appointment.aspirante_nome} ${appointment.aspirante_cognome || ''}` : '') ||
    (profilo?.nome ? `${profilo.nome} ${profilo.cognome || ''}` : '') ||
    'Utente';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">Verifica o Modifica Appuntamento</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Inserisci il tuo Codice Prenotazione (es. SI-2026-000101) o Token Modifica
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="es. SI-2026-000127"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shrink-0"
              >
                {loading ? 'Verifica...' : 'Verifica'}
              </button>
            </div>
            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Appointment Result Card */}
          {appointment && (
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Codice Univoco</span>
                  <div className="font-mono font-black text-slate-900 text-base">{appointment.codice}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                  appointment.stato === 'CONFERMATO'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : appointment.stato === 'ANNULLATO'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : appointment.stato === 'SVOLTO'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {appointment.stato === 'SVOLTO' ? 'Colloquio Svolto' : appointment.stato}
                </span>
              </div>

              {/* Beneficiary & Need info */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  {appointment.utente_tipo === 'IMPRESA' ? (
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-sky-600" />
                  )}
                  <span>{nominativo}</span>
                </div>
                {appointment.categoria_bisogno && (
                  <p className="text-[11px] text-slate-600">
                    Argomento: <span className="font-semibold text-slate-800">{appointment.categoria_bisogno}</span>
                  </p>
                )}
              </div>

              {/* Date, Time & Venue */}
              <div className="space-y-2.5 text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="capitalize font-semibold text-slate-900">
                    {formatDateSafe(appointment.data_ora)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Ore <strong>{formatTimeSafe(appointment.data_ora)}</strong> ({appointment.durata_minuti || 30} min)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {appointment.modalita === 'PRESENZA' ? (
                    <>
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        In presenza: <strong>{sportello?.nome || appointment.sportello_nome || 'Sportello Territoriale'}</strong>
                        {(sportello?.indirizzo || appointment.sportello_indirizzo) && (
                          <span className="block text-[11px] text-slate-500">
                            {sportello?.indirizzo || appointment.sportello_indirizzo}
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        Videocall online: {appointment.videocall_link ? (
                          <a
                            href={appointment.videocall_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-700 underline font-bold inline-flex items-center gap-0.5 ml-1"
                          >
                            <span>Partecipa alla stanza</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">Link disponibile in prossimità del colloquio</span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {cancelSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Appuntamento annullato con successo. Lo slot è stato reso nuovamente disponibile.</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowPdf(true)}
                  className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs transition-colors text-center shadow-xs"
                >
                  Stampa Promemoria PDF
                </button>

                {appointment.stato !== 'ANNULLATO' && appointment.stato !== 'SVOLTO' && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{cancelling ? 'Annullamento...' : 'Annulla Appuntamento'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PDF Modal inside Lookup */}
          {showPdf && appointment && (
            <PdfPromemoriaModal
              isOpen={showPdf}
              onClose={() => setShowPdf(false)}
              appointment={appointment}
              sportello={sportello || {
                id: appointment.sportello_id,
                nome: appointment.sportello_nome || 'Sviluppo Italia Molise',
                comune: appointment.sportello_comune || 'Campobasso',
                indirizzo: appointment.sportello_indirizzo || 'Via Nazario Sauro 1',
                telefono: appointment.sportello_telefono || '0874 011011',
                email: appointment.sportello_email || 'sportelloimprese@sviluppoitaliamolise.it',
                giorni: 'Lunedì-Venerdì',
                orario: '09:00 - 13:00',
                attivo: 1,
                lat: 41.56,
                lng: 14.66,
                target_annuo: 21,
                tipologia: 'HUB'
              }}
              profilo={{
                denominazione: appointment.impresa_denominazione || profilo?.denominazione,
                nome: appointment.aspirante_nome || profilo?.nome,
                cognome: appointment.aspirante_cognome || profilo?.cognome,
                comune_residenza: profilo?.comune_residenza,
                settore_interesse: profilo?.settore_interesse
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
};
