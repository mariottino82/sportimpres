import React, { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { MoliseMap } from '../MoliseMap';
import { PdfPromemoriaModal } from '../PdfPromemoriaModal';
import { MOLISE_COMUNI } from '../../data/moliseComuni';
import { Sportello, UserType, Modality, Appointment } from '../../types';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Navigation,
  FileText,
  AlertCircle,
  Share2,
  Download,
  Copy,
  Check,
  Phone,
  Mail,
  RotateCcw
} from 'lucide-react';

interface BookingWizardProps {
  initialUserType?: UserType;
  initialSportelloId?: number;
  initialSource?: string;
  onCancel: () => void;
  onComplete?: (appt: Appointment) => void;
}

// Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Italian Partita IVA formal check (11 digits, Luhn variant)
function validatePartitaIva(piva: string): boolean {
  if (!/^\d{11}$/.test(piva)) return false;
  let s = 0;
  for (let i = 0; i <= 9; i += 2) s += parseInt(piva.charAt(i), 10);
  for (let i = 1; i <= 9; i += 2) {
    let c = 2 * parseInt(piva.charAt(i), 10);
    if (c > 9) c -= 9;
    s += c;
  }
  const control = (10 - (s % 10)) % 10;
  return control === parseInt(piva.charAt(10), 10);
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialUserType,
  initialSportelloId,
  initialSource,
  onCancel
}) => {
  // Wizard Step state: 1 to 9
  const [step, setStep] = useState<number>(initialUserType ? 2 : 1);
  const [userType, setUserType] = useState<UserType>(initialUserType || 'IMPRESA');

  // Privacy consents (S2)
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [newsletterConsent, setNewsletterConsent] = useState(true);
  const [geoConsent, setGeoConsent] = useState(true);

  // Anagrafica (S3)
  const [anagraficaImpresa, setAnagraficaImpresa] = useState({
    denominazione: '',
    partitaIva: '',
    nomeReferente: '',
    cognomeReferente: '',
    ruolo: 'Titolare',
    email: '',
    telefono: '+39 ',
    comuneSede: 'Campobasso (CB)'
  });

  const [anagraficaAspirante, setAnagraficaAspirante] = useState({
    nome: '',
    cognome: '',
    telefono: '+39 ',
    email: '',
    comuneResidenza: 'Campobasso (CB)'
  });

  // Motivo del contatto (S4)
  const [motivoTesto, setMotivoTesto] = useState('');
  const [categoriaBisogno, setCategoriaBisogno] = useState('Bandi e finanziamenti');

  // Domande EDP facoltative (S5)
  const [edpImpresa, setEdpImpresa] = useState({
    settoreAttivita: 'ICT',
    ateco: '',
    dimensione: 'Piccola (10-49)',
    faseVita: 'Startup (< 3 anni)',
    gradoInnovazione: 4,
    usoAi: 2
  });

  const [edpAspirante, setEdpAspirante] = useState({
    statoIdea: 'Ho un progetto scritto',
    settoreInteresse: 'ICT',
    condizioneAttuale: 'Occupato',
    fasciaEta: '30-40',
    haPartitaIva: 'No'
  });

  // Sportelli & Selection (S6)
  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [selectedSportello, setSelectedSportello] = useState<Sportello | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Calendario & Slot (S7)
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; datetime: string; available: boolean; locked: boolean }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [modalita, setModalita] = useState<Modality>('PRESENZA');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Confirmation & Final (S8 & S9)
  const [submitting, setSubmitting] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState<Appointment | null>(null);
  const [confirmedSportello, setConfirmedSportello] = useState<Sportello | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [lockTimerSecs, setLockTimerSecs] = useState<number>(600); // 10 minutes countdown
  const [copiedLink, setCopiedLink] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!completedAppointment) return;
    setResendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/prenotazioni/${completedAppointment.token_modifica || completedAppointment.codice}/rinvia-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: completedAppointment.utente_email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailFeedback(`✓ Email inviata con successo a ${completedAppointment.utente_email}`);
      } else {
        setEmailFeedback(`Esito invio: ${data.messaggio || data.error || 'Operazione completata'}`);
      }
    } catch (e: any) {
      setEmailFeedback(`Errore: ${e.message}`);
    } finally {
      setResendingEmail(false);
    }
  };

  // Fetch sportelli on mount
  useEffect(() => {
    fetch('/api/sportelli')
      .then((res) => res.json())
      .then((data: Sportello[]) => {
        const list = Array.isArray(data) ? data : [];
        setSportelli(list);
        if (initialSportelloId) {
          const found = list.find((s) => s.id === initialSportelloId);
          if (found) setSelectedSportello(found);
        }
      })
      .catch((err) => {
        console.error(err);
        setSportelli([]);
      });
  }, [initialSportelloId]);

  // Handle Geolocation in S6
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalizzazione non supportata dal browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGeoLoading(false);

        // Calculate distance for all sportelli
        setSportelli((prev) => {
          const updated = prev.map((s) => ({
            ...s,
            distanzaKm: calculateDistanceKm(coords.lat, coords.lng, s.lat, s.lng)
          })).sort((a, b) => (a.distanzaKm || 999) - (b.distanzaKm || 999));

          if (updated.length > 0 && !selectedSportello) {
            setSelectedSportello(updated[0]);
          }
          return updated;
        });
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setGeoLoading(false);
        setGeoError('Geolocalizzazione non concessa o non disponibile. Puoi scegliere liberamente lo sportello.');
      },
      { timeout: 8000 }
    );
  };

  // When reaching step 6, auto-request geolocation if consent was given
  useEffect(() => {
    if (step === 6 && geoConsent && !userCoords && !geoLoading) {
      requestGeolocation();
    }
  }, [step, geoConsent]);

  // Fetch available slots when sportello and date are chosen
  useEffect(() => {
    if (selectedSportello && selectedDate) {
      setLoadingSlots(true);
      fetch(`/api/sportelli/${selectedSportello.id}/slots?date=${selectedDate}`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableSlots(data.slots || []);
          setLoadingSlots(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingSlots(false);
        });
    }
  }, [selectedSportello, selectedDate]);

  // Countdown timer for 10-min slot lock in S8
  useEffect(() => {
    if (step === 8 && lockTimerSecs > 0) {
      const interval = setInterval(() => {
        setLockTimerSecs((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, lockTimerSecs]);

  // Lock slot via API when selected
  const handleSelectSlot = (slotTime: string, datetimeStr: string) => {
    setSelectedSlot(datetimeStr);
    if (selectedSportello) {
      fetch('/api/prenotazioni/lock-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportelloId: selectedSportello.id,
          datetime: datetimeStr,
          sessionId
        })
      }).catch(console.error);
    }
  };

  // Submit Final Booking in S8
  const handleConfirmBooking = async () => {
    if (!selectedSportello || !selectedSlot) return;

    setSubmitting(true);
    try {
      const payload = {
        tipo: userType,
        anagrafica: userType === 'IMPRESA' ? anagraficaImpresa : anagraficaAspirante,
        motivo: {
          testoLibero: motivoTesto,
          categoriaBisogno
        },
        domandeEdp: userType === 'IMPRESA' ? edpImpresa : edpAspirante,
        sportelloId: selectedSportello.id,
        datetime: selectedSlot,
        modalita,
        consensi: {
          privacy: privacyConsent,
          newsletter: newsletterConsent,
          geolocalizzazione: geoConsent
        },
        canaleAccesso: initialSource || 'Sito Web'
      };

      const res = await fetch('/api/prenotazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella creazione della prenotazione');
      }

      setConfirmedSportello(selectedSportello);
      setCompletedAppointment({
        id: data.appuntamentoId,
        codice: data.codice,
        utente_id: 0,
        sportello_id: selectedSportello.id,
        data_ora: selectedSlot,
        durata_minuti: 30,
        modalita,
        videocall_link: data.videocallLink,
        stato: 'CONFERMATO',
        motivo_testo: motivoTesto,
        categoria_bisogno: categoriaBisogno,
        token_modifica: data.tokenModifica,
        creato_il: new Date().toISOString(),
        sportello_nome: selectedSportello.nome,
        sportello_comune: selectedSportello.comune,
        sportello_indirizzo: selectedSportello.indirizzo,
        sportello_telefono: selectedSportello.telefono,
        sportello_email: selectedSportello.email,
        utente_email: userType === 'IMPRESA' ? anagraficaImpresa.email : anagraficaAspirante.email,
        utente_telefono: userType === 'IMPRESA' ? anagraficaImpresa.telefono : anagraficaAspirante.telefono,
        utente_tipo: userType,
        impresa_denominazione: anagraficaImpresa.denominazione,
        impresa_piva: anagraficaImpresa.partitaIva,
        aspirante_nome: anagraficaAspirante.nome,
        aspirante_cognome: anagraficaAspirante.cognome
      });

      setStep(9); // Go to S9
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Download real .ics calendar file
  const downloadIcsFile = () => {
    if (!completedAppointment || !confirmedSportello) return;
    const start = new Date(completedAppointment.data_ora);
    const end = new Date(start.getTime() + 30 * 60000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toIcsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const summary = `Sportello Imprese Molise - Appuntamento ${completedAppointment.codice}`;
    const description = `Colloquio orientamento EDP: ${completedAppointment.categoria_bisogno}. Sede: ${confirmedSportello.nome}, ${confirmedSportello.indirizzo}. Telefono: ${confirmedSportello.telefono}`;
    const location = completedAppointment.modalita === 'PRESENZA' ? confirmedSportello.indirizzo : completedAppointment.videocall_link;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sportello Imprese Molise//IT',
      'BEGIN:VEVENT',
      `UID:${completedAppointment.codice}@sviluppoitaliamolise.it`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Appuntamento_${completedAppointment.codice}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareBooking = (platform: string) => {
    const text = `Ho appena prenotato un appuntamento gratuito con lo Sportello Imprese di Sviluppo Italia Molise!`;
    const url = window.location.origin;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Helper date generator for opening days in Sep / Oct 2026 (or next 60 days)
  const getUpcomingDatesForSportello = (sportello: Sportello) => {
    const dates: string[] = [];
    const today = new Date();
    // Start from tomorrow
    const cur = new Date(today);
    cur.setDate(cur.getDate() + 1);

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

    for (let i = 0; i < 45; i++) {
      const d = new Date(cur);
      d.setDate(d.getDate() + i);
      const dayName = dayNames[d.getDay()];

      if ((sportello?.giorni || '').toLowerCase().includes(dayName.toLowerCase())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return dates;
  };

  // Step names for progress indicator
  const stepTitles = [
    'Profilo',
    'Privacy',
    'Anagrafica',
    'Bisogno',
    'Domande EDP',
    'Sportello',
    'Calendario',
    'Riepilogo',
    'Conferma'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-slate-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <Logo size="sm" />
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Esci e torna alla Home
          </button>
        </div>

        {/* Step Progress Bar (hidden on Step 9) */}
        {step < 9 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Passo {step} di 8: <strong className="text-slate-900">{stepTitles[step - 1]}</strong></span>
              <span className="text-sky-700 font-bold">{Math.round((step / 8) * 100)}% completato</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-600 to-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 8) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* =========================================================================
            S1: CHI SEI? (IMPRESA vs ASPIRANTE)
           ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-display">
                Chi sei?
              </h2>
              <p className="text-slate-600 text-sm">
                Seleziona la tua tipologia per personalizzare il percorso di prenotazione e l'orientamento ai bandi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 max-w-2xl mx-auto">
              {/* Pulsante IMPRESA (Blu) */}
              <button
                onClick={() => {
                  setUserType('IMPRESA');
                  setStep(2);
                }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 group border border-blue-400/40"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wide font-display">
                  IMPRESA
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm mt-2 leading-relaxed">
                  Per società, ditte individuali, cooperative e professionisti già costituiti e con Partita IVA attiva.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-full">
                  <span>Continua come Impresa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Pulsante ASPIRANTE IMPRENDITORE (Viola) */}
              <button
                onClick={() => {
                  setUserType('ASPIRANTE');
                  setStep(2);
                }}
                className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 hover:from-purple-700 hover:to-indigo-900 text-white shadow-lg shadow-purple-600/20 transition-all transform hover:-translate-y-1 group border border-purple-400/40"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wide font-display">
                  ASPIRANTE IMPRENDITORE
                </h3>
                <p className="text-purple-100 text-xs sm:text-sm mt-2 leading-relaxed">
                  Per chi ha un'idea imprenditoriale, studenti, disoccupati o lavoratori che desiderano avviare una nuova attività in Molise.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold bg-white/20 px-4 py-2 rounded-full">
                  <span>Continua come Aspirante</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 pt-4">
              Nessun login richiesto • Nessuna registrazione con password • Accesso diretto
            </div>
          </div>
        )}

        {/* =========================================================================
            S2: PRIVACY & CONSENSO
           ========================================================================= */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Informativa sul Trattamento dei Dati</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                Privacy e Protezione dei Dati (GDPR)
              </h2>
              <p className="text-xs text-slate-600">
                Ai sensi degli articoli 13 e 14 del Regolamento UE 2016/679 (GDPR).
              </p>
            </div>

            {/* Scrollable Privacy Text */}
            <div className="h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p className="font-semibold text-slate-800">
                1. Titolare del Trattamento
              </p>
              <p>
                Il Titolare del trattamento è <strong>Sviluppo Italia Molise S.p.A.</strong> (P.IVA 00852240704), con sede in Via Nazario Sauro, 1 - 86100 Campobasso (CB). Email: info@sviluppoitaliamolise.it.
              </p>
              <p className="font-semibold text-slate-800">
                2. Finalità del Trattamento
              </p>
              <p>
                I dati raccolti saranno utilizzati per la gestione dell'appuntamento, l'erogazione del servizio di orientamento e supporto imprenditoriale (EDP), l'invio del promemoria di conferma e delle comunicazioni istituzionali inerenti i bandi del PR Molise FESR FSE+ 2021-2027.
              </p>
              <p className="font-semibold text-slate-800">
                3. Base Giuridica
              </p>
              <p>
                Il trattamento è necessario per l'esecuzione di misure precontrattuali o contrattuali relative al servizio richiesto e per l'adempimento di obblighi legali legati alla rendicontazione dei fondi europei.
              </p>
              <p className="font-semibold text-slate-800">
                4. Diritti dell'Interessato
              </p>
              <p>
                In qualsiasi momento l'utente può esercitare i diritti di accesso, rettifica, cancellazione (oblio), limitazione e opposizione al trattamento inviando una comunicazione al Titolare.
              </p>
               <p className="font-semibold text-slate-800">
                5. Responsabile del Trattamento dei Dati
              </p>
              <p>
                Il responsabilde del trattamento dei dati è Cube Solution Service
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs text-slate-800 font-medium">
                  <strong>* Obbligatorio:</strong> Dichiaro di aver letto e accetto l'informativa sulla privacy per l'erogazione del servizio di appuntamento e orientamento.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newsletterConsent}
                  onChange={(e) => setNewsletterConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs text-slate-600">
                  Facoltativo: Desidero ricevere aggiornamenti, inviti ad eventi territoriali e la newsletter mensile sui nuovi bandi regionali.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={geoConsent}
                  onChange={(e) => setGeoConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs text-slate-600">
                  Facoltativo: Acconsento alla geolocalizzazione approssimata del dispositivo per calcolare lo sportello più vicino.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
              >
                Rifiuta ed Esci
              </button>

              <button
                disabled={!privacyConsent}
                onClick={() => setStep(3)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  privacyConsent
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continua</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S3: DATI ANAGRAFICI (MODULO DIVERSO PER IMPRESA / ASPIRANTE)
           ========================================================================= */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                {userType === 'IMPRESA' ? 'Modulo Registrazione Azienda' : 'Modulo Registrazione Cittadino'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                {userType === 'IMPRESA' ? 'Dati Anagrafici Impresa' : 'I tuoi dati anagrafici'}
              </h2>
              <p className="text-xs text-slate-600">
                I campi contrassegnati con (*) sono obbligatori e necessari per la conferma dell'appuntamento.
              </p>
            </div>

            {userType === 'IMPRESA' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Denominazione Azienda / Ragione Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    value={anagraficaImpresa.denominazione}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, denominazione: e.target.value })}
                    placeholder="Denominazione Impresa"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Partita IVA (11 cifre) *
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={anagraficaImpresa.partitaIva}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, partitaIva: e.target.value.replace(/\D/g, '') })}
                    placeholder="11 cifre numeriche"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                  {(anagraficaImpresa.partitaIva || '').length === 11 && !validatePartitaIva(anagraficaImpresa.partitaIva) && (
                    <span className="text-[10px] text-amber-600 mt-1 block">
                      Attenzione: codice di controllo P.IVA formalmente non corrispondente.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ruolo in Azienda *
                  </label>
                  <select
                    value={anagraficaImpresa.ruolo}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, ruolo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="Titolare">Titolare</option>
                    <option value="Amministratore">Amministratore</option>
                    <option value="Socio">Socio</option>
                    <option value="Dipendente">Dipendente</option>
                    <option value="Consulente">Consulente</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Referente *
                  </label>
                  <input
                    type="text"
                    required
                    value={anagraficaImpresa.nomeReferente}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, nomeReferente: e.target.value })}
                    placeholder="Nome"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cognome Referente *
                  </label>
                  <input
                    type="text"
                    required
                    value={anagraficaImpresa.cognomeReferente}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, cognomeReferente: e.target.value })}
                    placeholder="Cognome"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Aziendale (per conferma e promemoria) *
                  </label>
                  <input
                    type="email"
                    required
                    value={anagraficaImpresa.email}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, email: e.target.value })}
                    placeholder="direzione@azienda.it"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={anagraficaImpresa.telefono}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Comune della Sede Operativa *
                  </label>
                  <select
                    value={anagraficaImpresa.comuneSede}
                    onChange={(e) => setAnagraficaImpresa({ ...anagraficaImpresa, comuneSede: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    {MOLISE_COMUNI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* ASPIRANTE IMPRENDITORE */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={anagraficaAspirante.nome}
                    onChange={(e) => setAnagraficaAspirante({ ...anagraficaAspirante, nome: e.target.value })}
                    placeholder="Nome"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    value={anagraficaAspirante.cognome}
                    onChange={(e) => setAnagraficaAspirante({ ...anagraficaAspirante, cognome: e.target.value })}
                    placeholder="Cognome"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={anagraficaAspirante.telefono}
                    onChange={(e) => setAnagraficaAspirante({ ...anagraficaAspirante, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Personale (per conferma) *
                  </label>
                  <input
                    type="email"
                    required
                    value={anagraficaAspirante.email}
                    onChange={(e) => setAnagraficaAspirante({ ...anagraficaAspirante, email: e.target.value })}
                    placeholder="nome.cognome@email.it"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Comune di Residenza *
                  </label>
                  <select
                    value={anagraficaAspirante.comuneResidenza}
                    onChange={(e) => setAnagraficaAspirante({ ...anagraficaAspirante, comuneResidenza: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    {MOLISE_COMUNI.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                onClick={() => {
                  // Basic validation
                  if (userType === 'IMPRESA') {
                    if (!anagraficaImpresa.denominazione || !anagraficaImpresa.email || !anagraficaImpresa.telefono || (anagraficaImpresa.partitaIva || '').length !== 11) {
                      alert('Per favore compila tutti i campi obbligatori (inclusa la Partita IVA di 11 cifre).');
                      return;
                    }
                  } else {
                    if (!anagraficaAspirante.nome || !anagraficaAspirante.cognome || !anagraficaAspirante.email || !anagraficaAspirante.telefono) {
                      alert('Per favore compila tutti i campi obbligatori.');
                      return;
                    }
                  }
                  setStep(4);
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Continua</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S4: MOTIVO DEL CONTATTO
           ========================================================================= */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Orientamento e Bisogno Espresso</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                Motivo del Contatto
              </h2>
              <p className="text-xs text-slate-600">
                Aiutaci a preparare al meglio la documentazione utile per il tuo incontro con l'operatore.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoria del bisogno principale *
                </label>
                <select
                  value={categoriaBisogno}
                  onChange={(e) => setCategoriaBisogno(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-sm"
                >
                  <option value="Bandi e finanziamenti">Bandi e finanziamenti</option>
                  <option value="Avvio di una nuova impresa / apertura Partita IVA">Avvio di una nuova impresa / apertura Partita IVA</option>
                  <option value="Innovazione e digitalizzazione">Innovazione e digitalizzazione</option>
                 
                  <option value="Partecipazione a eventi, hackathon, consultazioni">Partecipazione a eventi, hackathon, consultazioni</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Descriva brevemente il motivo per cui ci contatta e di cosa avrebbe bisogno *
                  </label>
                  <span className={`text-[10px] ${motivoTesto.length > 900 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {motivoTesto.length} / 1.000 caratteri
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  required
                  value={motivoTesto}
                  onChange={(e) => setMotivoTesto(e.target.value)}
                  placeholder="Es. Vorrei richiedere informazioni sul Voucher Transizione 5.0 per aggiornare i nostri macchinari, oppure vorrei verificare se sono previsti contributi a fondo perduto per una nuova idea..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                disabled={!motivoTesto.trim()}
                onClick={() => setStep(5)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  motivoTesto.trim()
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continua</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S5: PROFILO - DOMANDE EDP FACOLTATIVE (CON "SALTA")
           ========================================================================= */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                  Scoperta Imprenditoriale (EDP RIS3 Molise)
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                  Domande di Approfondimento (Facoltative)
                </h2>
                <p className="text-xs text-slate-600">
                  Rispondere a queste domande aiuta gli operatori di sportello a selezionare subito i bandi e le opportunità coerenti con la tua realtà. Puoi saltare se preferisci.
                </p>
              </div>

              <button
                onClick={() => setStep(6)}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Salta questo passaggio →
              </button>
            </div>

            {userType === 'IMPRESA' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Area di Specializzazione Intelligente (RIS3 Molise) o Codice ATECO
                  </label>
                  <select
                    value={edpImpresa.settoreAttivita}
                    onChange={(e) => setEdpImpresa({ ...edpImpresa, settoreAttivita: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Agrifood">Agrifood (Agroalimentare di qualità e tipicità)</option>
                    <option value="Scienze della vita">Scienze della vita e salute</option>
                    <option value="ICT">ICT, Software e Tecnologie Digitali</option>
                    <option value="Industrie culturali, turistiche e creative">Industrie culturali, turistiche e creative</option>
                    <option value="Tecnologie per la transizione">Tecnologie per la transizione ecologica ed energetica</option>
                    <option value="Altro">Altro settore</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dimensione Aziendale
                    </label>
                    <select
                      value={edpImpresa.dimensione}
                      onChange={(e) => setEdpImpresa({ ...edpImpresa, dimensione: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Micro (fino a 9 addetti)">Micro (fino a 9 addetti)</option>
                      <option value="Piccola (10-49)">Piccola (10-49 addetti)</option>
                      <option value="Media (50-249)">Media (50-249 addetti)</option>
                      <option value="Grande">Grande impresa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Fase di Vita dell'Impresa
                    </label>
                    <select
                      value={edpImpresa.faseVita}
                      onChange={(e) => setEdpImpresa({ ...edpImpresa, faseVita: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Startup (< 3 anni)">Startup (&lt; 3 anni)</option>
                      <option value="In crescita">In crescita ed espansione</option>
                      <option value="Consolidata">Consolidata</option>
                      <option value="In difficoltà / riconversione">In difficoltà / riconversione</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Grado di digitalizzazione e utilizzo strumenti software
                  </label>
                  <select
                    value={edpImpresa.usoAi}
                    onChange={(e) => setEdpImpresa({ ...edpImpresa, usoAi: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="1">1 = Di base (solo email / navigazione)</option>
                    <option value="2">2 = Software gestionali standard</option>
                    <option value="3">3 = Cloud e processi digitalizzati</option>
                    <option value="4">4 = E-commerce e automazione processi</option>
                    <option value="5">5 = Digitale avanzato / Industria 4.0</option>
                  </select>
                </div>
              </div>
            ) : (
              /* ASPIRANTE IMPRENDITORE */
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    A che punto è la sua idea?
                  </label>
                  <select
                    value={edpAspirante.statoIdea}
                    onChange={(e) => setEdpAspirante({ ...edpAspirante, statoIdea: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Solo un'idea">Solo un'idea informale</option>
                    <option value="Ho un progetto scritto">Ho un progetto scritto / bozza di business plan</option>
                    <option value="Sto per avviare / ho appena avviato">Sto per avviare / ho appena avviato</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Settore di Interesse
                    </label>
                    <select
                      value={edpAspirante.settoreInteresse}
                      onChange={(e) => setEdpAspirante({ ...edpAspirante, settoreInteresse: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Agrifood">Agrifood e prodotti tipici</option>
                      <option value="Scienze della vita">Scienze della vita e salute</option>
                      <option value="ICT">ICT, Digitale e Nuove Tecnologie</option>
                      <option value="Industrie culturali, turistiche e creative">Turismo, Cultura e Artigianato</option>
                      <option value="Tecnologie per la transizione">Ambiente, Green economy e Sostenibilità</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Condizione Attuale
                    </label>
                    <select
                      value={edpAspirante.condizioneAttuale}
                      onChange={(e) => setEdpAspirante({ ...edpAspirante, condizioneAttuale: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Studente">Studente</option>
                      <option value="Occupato">Occupato</option>
                      <option value="Disoccupato / inoccupato">Disoccupato / inoccupato</option>
                      <option value="Libero professionista">Libero professionista</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Fascia di Età
                    </label>
                    <select
                      value={edpAspirante.fasciaEta}
                      onChange={(e) => setEdpAspirante({ ...edpAspirante, fasciaEta: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="18-29">18-29 anni (Under 30)</option>
                      <option value="30-40">30-40 anni</option>
                      <option value="41-50">41-50 anni</option>
                      <option value="oltre 50">Oltre 50 anni</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ha già una Partita IVA aperta?
                    </label>
                    <select
                      value={edpAspirante.haPartitaIva}
                      onChange={(e) => setEdpAspirante({ ...edpAspirante, haPartitaIva: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="No">No</option>
                      <option value="Sì">Sì</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                onClick={() => setStep(6)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Prosegui alla Scelta dello Sportello</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S6: SPORTELLO PIÙ VICINO (GEOLOCALIZZAZIONE O SCELTA LIBERA)
           ========================================================================= */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                Geolocalizzazione e Proposta Sportello
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-display">
                Scegli lo Sportello
              </h2>
              <p className="text-slate-600 text-sm">
                In base alla tua posizione ti proponiamo gli sportelli più vicini, ma puoi scegliere liberamente qualunque sede.
              </p>
            </div>

            {/* Top 3 Proposed Desks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sportelli.slice(0, 3).map((s, idx) => {
                const isSelected = selectedSportello?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSportello(s)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-300 ring-offset-1'
                        : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          idx === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {idx === 0 ? 'Consigliato più vicino' : `Opzione ${idx + 1}`}
                        </span>
                        {s.distanzaKm !== undefined && (
                          <span className="text-xs font-bold text-sky-700">
                            ~{s.distanzaKm} km
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {s.comune}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {s.indirizzo}
                      </p>

                      <div className="mt-3 text-xs space-y-1 text-slate-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          <span>{s.giorni} ({s.orario})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cadenza: <strong>{s.cadenza}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                      <span className={`font-bold ${isSelected ? 'text-sky-700' : 'text-slate-500'}`}>
                        {isSelected ? '✓ Selezionato' : 'Clicca per scegliere'}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Geolocation status and button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <span>
                  {userCoords
                    ? 'Posizione rilevata con successo. Distanze calcolate in linea d\'aria (formula Haversine).'
                    : geoError || 'Posizione non ancora rilevata.'}
                </span>
              </div>
              <button
                onClick={requestGeolocation}
                disabled={geoLoading}
                className="px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold transition-colors"
              >
                {geoLoading ? 'Rilevamento in corso...' : 'Ricalcola la mia posizione'}
              </button>
            </div>

            {/* Interactive Map */}
            <MoliseMap
              sportelli={sportelli}
              selectedSportelloId={selectedSportello?.id}
              userCoords={userCoords}
              onSelectSportello={(s) => setSelectedSportello(s)}
            />

            {/* All Desks Fallback Selector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-800 text-xs mb-1.5">
                Oppure seleziona un altro sportello dall'elenco completo:
              </label>
              <select
                value={selectedSportello?.id || ''}
                onChange={(e) => {
                  const s = sportelli.find((item) => item.id === parseInt(e.target.value, 10));
                  if (s) setSelectedSportello(s);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-sky-500"
              >
                {sportelli.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.comune} - {s.nome} ({s.giorni}, {s.orario})
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setStep(5)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                disabled={!selectedSportello}
                onClick={() => {
                  if (selectedSportello) {
                    const upcoming = getUpcomingDatesForSportello(selectedSportello);
                    if (upcoming.length > 0) setSelectedDate(upcoming[0]);
                  }
                  setStep(7);
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  selectedSportello
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Scegli Data e Ora</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S7: CALENDARIO E ORARI
           ========================================================================= */}
        {step === 7 && selectedSportello && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                Disponibilità {selectedSportello.comune}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                Data, Orario e Modalità
              </h2>
              <p className="text-xs text-slate-600">
                Seleziona un giorno tra quelli di apertura dello sportello, una fascia oraria libera da 30 minuti e la modalità preferita.
              </p>
            </div>

            {/* Modality Toggle */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Modalità dell'incontro
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalita('PRESENZA')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    modalita === 'PRESENZA'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-sky-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>In presenza allo Sportello</span>
                </button>

                <button
                  type="button"
                  disabled={selectedSportello.online_attivo === 0}
                  onClick={() => {
                    if (selectedSportello.online_attivo !== 0) {
                      setModalita('VIDEOCALL');
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-bold transition-all ${
                    selectedSportello.online_attivo === 0
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                      : modalita === 'VIDEOCALL'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Videocall online (Jitsi / Meet)</span>
                  </div>
                  {selectedSportello.online_attivo === 0 && (
                    <span className="text-[10px] text-amber-700 font-medium">
                      (Sede abilitata solo a colloqui in presenza)
                    </span>
                  )}
                </button>
              </div>

              {/* Sportello contact and responsible banner */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">Sede:</span>
                  <span>{selectedSportello.nome} • {selectedSportello.indirizzo}</span>
                </div>
                {selectedSportello.responsabile_nome && (
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <span>Resp:</span>
                    <strong>{selectedSportello.responsabile_nome}</strong>
                  </div>
                )}
              </div>
              {selectedSportello.note_accesso && (
                <div className="mt-2 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                  ℹ️ <strong>Note accesso:</strong> {selectedSportello.note_accesso}
                </div>
              )}
            </div>

            {/* Upcoming Opening Days Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Seleziona il giorno di apertura (Aperto: {selectedSportello.giorni})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {getUpcomingDatesForSportello(selectedSportello).slice(0, 8).map((dStr) => {
                  const dateObj = new Date(dStr + 'T12:00:00Z');
                  const isSelected = selectedDate === dStr;
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dStr);
                        setSelectedSlot('');
                      }}
                      className={`p-3 rounded-xl text-left border transition-all text-xs ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 shadow-xs ring-1 ring-sky-500'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        {dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {selectedSportello.orario}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots for selected date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                2. Fasce orarie libere (durata 30 minuti)
              </label>

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Caricamento fasce orarie in corso...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                  Nessuno slot disponibile per questa data o sportello chiuso. Seleziona un'altra data.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.datetime;
                    return (
                      <button
                        key={slot.datetime}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => handleSelectSlot(slot.time, slot.datetime)}
                        className={`p-3 rounded-xl text-center border font-bold text-xs transition-all ${
                          !slot.available
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-300'
                            : 'bg-white border-slate-200 hover:border-sky-400 text-slate-800'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${isSelected ? 'text-white' : 'text-sky-600'}`} />
                        <span>{slot.time}</span>
                        <span className="block text-[9px] font-normal mt-0.5 opacity-80">
                          {slot.available ? 'Disponibile' : 'Occupato'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(6)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                disabled={!selectedSlot}
                onClick={() => setStep(8)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  selectedSlot
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Vai al Riepilogo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S8: RIEPILOGO E CONFERMA
           ========================================================================= */}
        {step === 8 && selectedSportello && selectedSlot && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            
            {/* Slot Lock Countdown Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                <span>Slot orario bloccato per te. Tempo rimanente per confermare:</span>
              </div>
              <span className="font-mono font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                {Math.floor(lockTimerSecs / 60)}:{String(lockTimerSecs % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Passo Finale</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 font-display">
                Riepilogo e Conferma Prenotazione
              </h2>
              <p className="text-xs text-slate-600">
                Verifica che tutti i dati siano corretti prima di confermare. Potrai sempre modificare o annullare l'appuntamento in seguito.
              </p>
            </div>

            {/* Review Cards */}
            <div className="space-y-4 text-xs">
              
              {/* Box 1: Appuntamento */}
              <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sky-900 uppercase text-[11px] flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Appuntamento Scelto</span>
                  </span>
                  <button onClick={() => setStep(7)} className="text-sky-700 hover:underline font-semibold">
                    Modifica
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="text-slate-500 block">Data e Ora:</span>
                    <strong className="text-slate-900 text-sm">
                      {new Date(selectedSlot).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                    <p className="text-xs text-sky-700 font-semibold">
                      Ore {new Date(selectedSlot).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} (30 minuti)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sede e Modalità:</span>
                    <strong>{selectedSportello.nome}</strong>
                    <p className="text-slate-600">{selectedSportello.indirizzo}</p>
                    <span className="inline-block mt-1 font-bold px-2 py-0.5 rounded bg-white border text-[10px]">
                      {modalita === 'PRESENZA' ? 'In Presenza' : 'Videocall Online'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Anagrafica */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                    {userType === 'IMPRESA' ? <Building2 className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{userType === 'IMPRESA' ? 'Dati Impresa e Referente' : 'Dati Aspirante'}</span>
                  </span>
                  <button onClick={() => setStep(3)} className="text-sky-700 hover:underline font-semibold">
                    Modifica
                  </button>
                </div>
                {userType === 'IMPRESA' ? (
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Denominazione: <strong>{anagraficaImpresa.denominazione}</strong></div>
                    <div>Partita IVA: <strong>{anagraficaImpresa.partitaIva}</strong></div>
                    <div>Referente: <strong>{anagraficaImpresa.nomeReferente} {anagraficaImpresa.cognomeReferente}</strong> ({anagraficaImpresa.ruolo})</div>
                    <div>Comune Sede: <strong>{anagraficaImpresa.comuneSede}</strong></div>
                    <div>Email: <strong>{anagraficaImpresa.email}</strong></div>
                    <div>Telefono: <strong>{anagraficaImpresa.telefono}</strong></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>Nominativo: <strong>{anagraficaAspirante.nome} {anagraficaAspirante.cognome}</strong></div>
                    <div>Comune: <strong>{anagraficaAspirante.comuneResidenza}</strong></div>
                    <div>Email: <strong>{anagraficaAspirante.email}</strong></div>
                    <div>Telefono: <strong>{anagraficaAspirante.telefono}</strong></div>
                  </div>
                )}
              </div>

              {/* Box 3: Motivo del contatto */}
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px]">
                    Motivo e Categoria del Bisogno
                  </span>
                  <button onClick={() => setStep(4)} className="text-sky-700 hover:underline font-semibold">
                    Modifica
                  </button>
                </div>
                <div className="text-slate-700 space-y-1">
                  <div>Categoria: <strong className="text-slate-900">{categoriaBisogno}</strong></div>
                  <p className="italic text-slate-600 bg-slate-50 p-2 rounded">
                    "{motivoTesto}"
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(7)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>

              <button
                disabled={submitting || lockTimerSecs === 0}
                onClick={handleConfirmBooking}
                className={`px-8 py-3 rounded-xl text-sm font-black text-white shadow-lg transition-all flex items-center gap-2 ${
                  submitting
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 transform hover:-translate-y-0.5'
                }`}
              >
                {submitting ? (
                  <span>Registrazione in corso...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma Prenotazione</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            S9: GRAZIE / SCHERMATA FINALE DI CONFERMA (Cap. 7)
           ========================================================================= */}
        {step === 9 && completedAppointment && confirmedSportello && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Success Celebration Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Prenotazione Confermata con Successo!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-display mt-1">
                  Grazie per aver scelto lo Sportello Imprese
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1">
                  Ti abbiamo inviato un'e-mail di riepilogo con tutti i riferimenti e il promemoria allegato.
                </p>
              </div>

              {/* Prominent Booking Code Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Codice Univoco Prenotazione</span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-sky-900 tracking-wider my-1">
                  {completedAppointment.codice}
                </div>
                <span className="text-[11px] text-slate-500">
                  Conserva questo codice o mostralo all'operatore al momento del check-in.
                </span>
              </div>

              {/* Email Confirmation Feedback Box */}
              {completedAppointment.utente_email && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Email di conferma inviata con successo</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    È stata recapitata una notifica con il riepilogo dell'appuntamento e l'allegato calendario (.ics) a:
                  </p>
                  <div className="font-mono font-bold text-xs text-emerald-950 bg-white/90 px-3 py-1 rounded-lg border border-emerald-300 inline-block shadow-2xs">
                    {completedAppointment.utente_email}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resendingEmail}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold underline mt-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${resendingEmail ? 'animate-spin' : ''}`} />
                      <span>{resendingEmail ? 'Invio in corso...' : 'Non trovi l\'email? Clicca per reinviarla'}</span>
                    </button>
                    {emailFeedback && (
                      <div className="text-[11px] font-semibold text-emerald-800 mt-1">
                        {emailFeedback}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Actions: Download PDF & Add to Calendar (.ics) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Scarica Promemoria PDF</span>
                </button>

                <button
                  onClick={downloadIcsFile}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 text-sky-400" />
                  <span>Aggiungi al Calendario (.ics)</span>
                </button>
              </div>
            </div>

            {/* Appointment Details & Sede Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
                Riepilogo del Tuo Incontro
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
                <div>
                  <span className="text-slate-500 block">Quando:</span>
                  <strong className="text-slate-900 text-sm block">
                    {new Date(completedAppointment.data_ora).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>
                  <span className="font-semibold text-sky-700">
                    Ore {new Date(completedAppointment.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Modalità:</span>
                  <strong className="text-slate-900 block">
                    {completedAppointment.modalita === 'PRESENZA' ? 'In presenza allo Sportello' : 'Videocall online'}
                  </strong>
                  {completedAppointment.modalita === 'VIDEOCALL' && (
                    <a
                      href={completedAppointment.videocall_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 underline font-semibold block mt-0.5 break-all"
                    >
                      {completedAppointment.videocall_link}
                    </a>
                  )}
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block">Sede dello Sportello:</span>
                  <strong className="text-slate-900 text-sm">{confirmedSportello.nome}</strong>
                  <p className="text-slate-600 mt-0.5">{confirmedSportello.indirizzo}</p>
                  <p className="text-slate-500 mt-0.5">
                    Tel. <strong>{confirmedSportello.telefono}</strong> • Email: <strong>{confirmedSportello.email}</strong>
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${confirmedSportello.lat},${confirmedSportello.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-700 hover:underline font-semibold mt-1"
                  >
                    <span>Ottieni indicazioni stradali su Google Maps</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Share / Passaparola (Cap. 9.2) */}
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-6 text-center space-y-3">
              <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">Passaparola</span>
              <h4 className="text-base font-bold text-slate-900">
                Condividi lo Sportello Imprese con altri imprenditori
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Fai conoscere le opportunità di finanziamento e i servizi gratuiti di Sviluppo Italia Molise ai tuoi colleghi e amici.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => shareBooking('whatsapp')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => shareBooking('linkedin')}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </button>
                <button
                  onClick={() => shareBooking('facebook')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={() => shareBooking('copy')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copiato!' : 'Copia Link'}</span>
                </button>
              </div>
            </div>

            {/* Return to Home button */}
            <div className="text-center pt-2">
              <button
                onClick={onCancel}
                className="px-6 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition-colors"
              >
                Torna alla Pagina Principale
              </button>
            </div>

            {/* Printable PDF Modal */}
            {showPdfModal && (
              <PdfPromemoriaModal
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                appointment={completedAppointment}
                sportello={confirmedSportello}
                profilo={userType === 'IMPRESA' ? anagraficaImpresa : anagraficaAspirante}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};
