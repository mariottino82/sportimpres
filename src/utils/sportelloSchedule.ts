import { Sportello } from '../types';

export const ITALIAN_DAY_NAMES = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato'
];

export interface SportelloOpenCheck {
  open: boolean;
  reason?: string;
  nextOpenDate?: string; // YYYY-MM-DD
}

/**
 * Calcola se un dato giorno (YYYY-MM-DD) è un giorno di apertura effettivo
 * per lo sportello selezionato, considerando:
 * 1. Stato attivo dello sportello (attivo === 1)
 * 2. Data di inizio attività / apertura prenotazioni (data_inizio_attivita)
 * 3. Giorni settimanali di apertura (Lunedì, Martedì, ecc.)
 * 4. Cadenza (Settimanale o Quindicinale / ogni 14 giorni a partire dalla data di attivazione)
 */
export function isSportelloDateOpen(
  sportello: Pick<Sportello, 'giorni' | 'cadenza' | 'data_inizio_attivita' | 'attivo'>,
  dateStr: string
): SportelloOpenCheck {
  if (sportello.attivo === 0) {
    return { open: false, reason: 'Sportello temporaneamente inattivo per nuove prenotazioni' };
  }

  // 1. Verifica data di inizio attività/apertura prenotazioni
  if (sportello.data_inizio_attivita && dateStr < sportello.data_inizio_attivita) {
    const formattedDate = sportello.data_inizio_attivita.split('-').reverse().join('/');
    return {
      open: false,
      reason: `Sportello attivo e prenotabile a partire dal ${formattedDate}`
    };
  }

  const targetDate = new Date(dateStr + 'T12:00:00Z');
  if (isNaN(targetDate.getTime())) {
    return { open: false, reason: 'Data non valida' };
  }

  // 2. Verifica giorno della settimana (Lunedì...Domenica)
  const dayOfWeek = targetDate.getUTCDay();
  const currentDayName = ITALIAN_DAY_NAMES[dayOfWeek];
  const isOpenDayOfWeek = (sportello.giorni || '').toLowerCase().includes(currentDayName.toLowerCase());

  if (!isOpenDayOfWeek) {
    return { open: false, reason: `Chiuso il ${currentDayName}` };
  }

  // 3. Verifica Cadenza (Quindicinale / ogni 15 giorni)
  const isQuindicinale = (sportello.cadenza || '').toLowerCase().includes('quindicin');

  if (isQuindicinale) {
    // La data di ancoraggio per il ciclo quindicinale è la data di attivazione dello sportello
    // (o il 2026-10-01 se non definita)
    const anchorDateStr = sportello.data_inizio_attivita || '2026-10-01';
    const anchor = new Date(anchorDateStr + 'T12:00:00Z');

    // Trova il primo giorno effettivo di apertura coincidente o successivo alla data di attivazione
    let firstActiveDate = new Date(anchor);
    for (let i = 0; i < 7; i++) {
      const candidate = new Date(anchor);
      candidate.setUTCDate(candidate.getUTCDate() + i);
      const candidateDayName = ITALIAN_DAY_NAMES[candidate.getUTCDay()];
      if ((sportello.giorni || '').toLowerCase().includes(candidateDayName.toLowerCase())) {
        firstActiveDate = candidate;
        break;
      }
    }

    const firstActiveStr = firstActiveDate.toISOString().split('T')[0];
    if (dateStr < firstActiveStr) {
      const formatted = firstActiveStr.split('-').reverse().join('/');
      return {
        open: false,
        reason: `Prima apertura quindicinale prevista il ${formatted}`
      };
    }

    // Calcolo della distanza in settimane dal giorno di prima apertura
    const diffMs = targetDate.getTime() - firstActiveDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.round(diffDays / 7);

    // Nella cadenza quindicinale, solo le settimane con scarto pari (0, 2, 4...) sono aperte (ogni 14 giorni)
    if (diffWeeks % 2 !== 0) {
      const nextOpenDateObj = new Date(targetDate);
      nextOpenDateObj.setUTCDate(nextOpenDateObj.getUTCDate() + 7);
      const nextOpenFormatted = nextOpenDateObj.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return {
        open: false,
        reason: `Chiuso per cadenza quindicinale (prossima apertura il ${nextOpenFormatted})`,
        nextOpenDate: nextOpenDateObj.toISOString().split('T')[0]
      };
    }
  }

  return { open: true };
}

/**
 * Restituisce l'elenco delle date effettive di apertura disponibili
 * per la prenotazione da parte dell'utente (filtra giorni chiusi,
 * date antecedenti l'attivazione e settimane spente per cadenza quindicinale).
 */
export function getUpcomingDatesForSportello(sportello: Sportello, limit: number = 8): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  // Si inizia a verificare da domani
  const cur = new Date(today);
  cur.setDate(cur.getDate() + 1);

  // Scansioniamo fino a 120 giorni nel futuro per raccogliere il numero di aperture desiderato
  for (let i = 0; i < 120; i++) {
    const d = new Date(cur);
    d.setDate(d.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;

    const check = isSportelloDateOpen(sportello, dStr);
    if (check.open) {
      dates.push(dStr);
      if (dates.length >= limit) {
        break;
      }
    }
  }

  return dates;
}
