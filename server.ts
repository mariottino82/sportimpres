import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { getDb, queryAll, queryOne, run, purgeSampleTestData } from './server/db.js';
import { matchBandiForProfile } from './server/gemini.js';
import { sendAppointmentConfirmationEmail } from './server/emailService.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory slot locks (10 min expiry)
const slotLocks = new Map<string, { lockedAt: number; sessionId: string }>();

// Clean up expired locks every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of slotLocks.entries()) {
    if (now - lock.lockedAt > 10 * 60 * 1000) {
      slotLocks.delete(key);
    }
  }
}, 60 * 1000);

// DB initialization happens inside startServer() below

// ----------------------------------------------------
// PUBLIC API: SPORTELLI & AVAILABILITY
// ----------------------------------------------------

app.get('/api/sportelli', (req, res) => {
  try {
    const includeInactive = req.query.all === 'true' || req.query.include_inactive === 'true';
    const rows = queryAll(
      includeInactive
        ? 'SELECT * FROM sportelli ORDER BY comune ASC'
        : 'SELECT * FROM sportelli WHERE attivo = 1 ORDER BY comune ASC'
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sportelli/:id', (req, res) => {
  try {
    const row = queryOne('SELECT * FROM sportelli WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Sportello non trovato' });
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new sportello
app.post('/api/sportelli', (req, res) => {
  try {
    const {
      comune,
      nome,
      indirizzo,
      telefono = '0874 011011',
      email = 'sportelloimprese@sviluppoitaliamolise.it',
      lat,
      lng,
      giorni,
      orario = '09:30 - 12:00',
      cadenza = 'Settimanale',
      attivo = 1,
      operatori_assegnati = '',
      responsabile_nome = '',
      responsabile_email = '',
      responsabile_telefono = '',
      online_attivo = 1,
      link_videocall = '',
      note_accesso = '',
      provincia = 'CB'
    } = req.body;

    if (!comune || !nome || !indirizzo || !giorni) {
      return res.status(400).json({ error: 'Comune, Nome, Indirizzo e Giorni di apertura sono obbligatori' });
    }

    const finalLat = typeof lat === 'number' ? lat : parseFloat(lat) || 41.5603;
    const finalLng = typeof lng === 'number' ? lng : parseFloat(lng) || 14.6627;

    const result = run(`
      INSERT INTO sportelli (
        comune, nome, indirizzo, telefono, email, lat, lng,
        giorni, orario, cadenza, attivo, operatori_assegnati,
        responsabile_nome, responsabile_email, responsabile_telefono,
        online_attivo, link_videocall, note_accesso, provincia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      comune, nome, indirizzo, telefono, email, finalLat, finalLng,
      giorni, orario, cadenza, attivo ? 1 : 0, operatori_assegnati,
      responsabile_nome, responsabile_email, responsabile_telefono,
      online_attivo ? 1 : 0, link_videocall, note_accesso, provincia
    ]);

    const created = queryOne('SELECT * FROM sportelli WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update sportello
app.put('/api/sportelli/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Sportello non trovato' });
    }

    const {
      comune = existing.comune,
      nome = existing.nome,
      indirizzo = existing.indirizzo,
      telefono = existing.telefono,
      email = existing.email,
      lat = existing.lat,
      lng = existing.lng,
      giorni = existing.giorni,
      orario = existing.orario,
      cadenza = existing.cadenza,
      attivo = existing.attivo,
      operatori_assegnati = existing.operatori_assegnati,
      responsabile_nome = existing.responsabile_nome,
      responsabile_email = existing.responsabile_email,
      responsabile_telefono = existing.responsabile_telefono,
      online_attivo = existing.online_attivo,
      link_videocall = existing.link_videocall,
      note_accesso = existing.note_accesso,
      provincia = existing.provincia
    } = req.body;

    const finalLat = typeof lat === 'number' ? lat : parseFloat(lat) || existing.lat;
    const finalLng = typeof lng === 'number' ? lng : parseFloat(lng) || existing.lng;

    run(`
      UPDATE sportelli SET
        comune = ?, nome = ?, indirizzo = ?, telefono = ?, email = ?,
        lat = ?, lng = ?, giorni = ?, orario = ?, cadenza = ?,
        attivo = ?, operatori_assegnati = ?, responsabile_nome = ?,
        responsabile_email = ?, responsabile_telefono = ?,
        online_attivo = ?, link_videocall = ?, note_accesso = ?, provincia = ?
      WHERE id = ?
    `, [
      comune, nome, indirizzo, telefono, email,
      finalLat, finalLng, giorni, orario, cadenza,
      attivo ? 1 : 0, operatori_assegnati, responsabile_nome,
      responsabile_email, responsabile_telefono,
      online_attivo ? 1 : 0, link_videocall, note_accesso, provincia,
      id
    ]);

    const updated = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle active status
app.patch('/api/sportelli/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Sportello non trovato' });

    const newStatus = existing.attivo === 1 ? 0 : 1;
    run('UPDATE sportelli SET attivo = ? WHERE id = ?', [newStatus, id]);
    const updated = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete sportello (or deactivate if has appointments)
app.delete('/api/sportelli/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Sportello non trovato' });

    const countCheck = queryOne('SELECT COUNT(*) as cnt FROM appuntamenti WHERE sportello_id = ?', [id]);
    if (countCheck && countCheck.cnt > 0) {
      run('UPDATE sportelli SET attivo = 0 WHERE id = ?', [id]);
      return res.json({ success: true, message: `Sportello disattivato (presenti ${countCheck.cnt} appuntamenti associati)`, deactivated: true });
    }

    run('DELETE FROM sportelli WHERE id = ?', [id]);
    res.json({ success: true, message: 'Sportello eliminato con successo' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate available 30-min slots for a sportello on a given date (YYYY-MM-DD)
app.get('/api/sportelli/:id/slots', (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // e.g. "2026-09-23"

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Parametro date obbligatorio (YYYY-MM-DD)' });
    }

    const sportello = queryOne('SELECT * FROM sportelli WHERE id = ?', [id]);
    if (!sportello) return res.status(404).json({ error: 'Sportello non trovato' });

    if (sportello.attivo === 0) {
      return res.json({ date, open: false, reason: 'Sportello temporaneamente inattivo per nuove prenotazioni', slots: [] });
    }

    // Parse date day of week in Italian
    const targetDate = new Date(date + 'T12:00:00Z');
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mer, 4 = Gio, 5 = Ven, 6 = Sab
    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const currentDayName = dayNames[dayOfWeek];

    // Check if sportello opens on this day
    const isOpenDay = sportello.giorni.toLowerCase().includes(currentDayName.toLowerCase());

    if (!isOpenDay) {
      return res.json({ date, open: false, reason: `Chiuso il ${currentDayName}`, slots: [] });
    }

    // Determine slots based on sportello.orario (e.g. "09:30 - 12:00" or custom)
    let startHour = 9;
    let startMin = 30;
    let endHour = 12;
    let endMin = 0;

    const match = (sportello.orario || '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (match) {
      startHour = parseInt(match[1], 10);
      startMin = parseInt(match[2], 10);
      endHour = parseInt(match[3], 10);
      endMin = parseInt(match[4], 10);
    } else if (sportello.orario.includes('15:00')) {
      startHour = 15;
      startMin = 0;
      endHour = 17;
      endMin = 0;
    } else if (sportello.orario.includes('15:30')) {
      startHour = 15;
      startMin = 30;
      endHour = 17;
      endMin = 0;
    }

    // Generate candidate slots in 30 min intervals
    const slots: Array<{ time: string; datetime: string; available: boolean; locked: boolean }> = [];
    let cur = new Date(targetDate);
    cur.setUTCHours(startHour, startMin, 0, 0);

    const endLimit = new Date(targetDate);
    endLimit.setUTCHours(endHour, endMin, 0, 0);

    // Existing bookings for this sportello and date
    const bookedRows = queryAll(
      "SELECT data_ora FROM appuntamenti WHERE sportello_id = ? AND date(data_ora) = date(?) AND stato != 'ANNULLATO'",
      [id, date]
    );
    const bookedTimes = new Set(bookedRows.map((r: any) => r.data_ora.substring(11, 16)));

    const now = Date.now();

    while (cur < endLimit) {
      const hh = String(cur.getUTCHours()).padStart(2, '0');
      const mm = String(cur.getUTCMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const datetimeStr = `${date} ${timeStr}:00`;
      const lockKey = `${id}-${datetimeStr}`;

      const isBooked = bookedTimes.has(timeStr);
      const isLocked = slotLocks.has(lockKey) && (now - slotLocks.get(lockKey)!.lockedAt < 10 * 60 * 1000);

      slots.push({
        time: timeStr,
        datetime: datetimeStr,
        available: !isBooked && !isLocked,
        locked: isLocked
      });

      cur.setUTCMinutes(cur.getUTCMinutes() + 30);
    }

    res.json({ date, open: true, sportello: sportello.nome, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lock slot temporarily for 10 minutes
app.post('/api/prenotazioni/lock-slot', (req, res) => {
  const { sportelloId, datetime, sessionId } = req.body;
  if (!sportelloId || !datetime || !sessionId) {
    return res.status(400).json({ error: 'sportelloId, datetime e sessionId sono obbligatori' });
  }

  const lockKey = `${sportelloId}-${datetime}`;
  const now = Date.now();

  if (slotLocks.has(lockKey)) {
    const existing = slotLocks.get(lockKey)!;
    if (existing.sessionId !== sessionId && now - existing.lockedAt < 10 * 60 * 1000) {
      return res.status(409).json({ error: 'Slot orario temporaneamente bloccato da un altro utente' });
    }
  }

  slotLocks.set(lockKey, { lockedAt: now, sessionId });
  res.json({ status: 'locked', expiresAt: now + 10 * 60 * 1000 });
});

// ----------------------------------------------------
// PUBLIC API: CREATE APPOINTMENT & PROFILE
// ----------------------------------------------------

app.post('/api/prenotazioni', async (req, res) => {
  try {
    const {
      tipo, // 'IMPRESA' | 'ASPIRANTE'
      anagrafica,
      motivo,
      domandeEdp,
      sportelloId,
      datetime,
      modalita, // 'PRESENZA' | 'VIDEOCALL'
      consensi, // { privacy: true, newsletter: boolean, geolocalizzazione: boolean }
      canaleAccesso
    } = req.body;

    if (!tipo || !anagrafica || !motivo || !sportelloId || !datetime || !modalita) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    // 1. Check if user already exists (by email or piva or phone)
    let email = (anagrafica.email || '').trim().toLowerCase();
    let telefono = (anagrafica.telefono || '').trim();

    let existingUser = queryOne('SELECT * FROM utenti WHERE email = ? OR telefono = ?', [email, telefono]);
    let utenteId: number;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (existingUser) {
      utenteId = existingUser.id;
      run("UPDATE utenti SET ultimo_accesso = ?, tipo = ? WHERE id = ?", [nowStr, tipo, utenteId]);
    } else {
      const insUser = run(
        "INSERT INTO utenti (email, telefono, tipo, data_creazione, ultimo_accesso, canale_accesso) VALUES (?, ?, ?, ?, ?, ?)",
        [email, telefono, tipo, nowStr, nowStr, canaleAccesso || 'Sito Web']
      );
      utenteId = insUser.lastInsertRowid;
    }

    // 2. Profile insertion/update
    if (tipo === 'IMPRESA') {
      const piva = (anagrafica.partitaIva || '').trim();
      const denom = (anagrafica.denominazione || '').trim();
      const nomeRef = (anagrafica.nomeReferente || '').trim();
      const cognomeRef = (anagrafica.cognomeReferente || '').trim();
      const ruolo = (anagrafica.ruolo || 'Titolare').trim();
      const comuneSede = (anagrafica.comuneSede || '').trim();

      const atecoCodice = domandeEdp?.ateco || '';
      const atecoArea = domandeEdp?.settoreAttivita || '';
      const dimensione = domandeEdp?.dimensione || '';
      const faseVita = domandeEdp?.faseVita || '';
      const gradoInnovazione = domandeEdp?.gradoInnovazione || 3;
      const usoAi = domandeEdp?.usoAi || 1;

      const existingProf = queryOne('SELECT id FROM profili_impresa WHERE utente_id = ?', [utenteId]);
      if (existingProf) {
        run(`
          UPDATE profili_impresa 
          SET denominazione = ?, partita_iva = ?, nome_referente = ?, cognome_referente = ?, ruolo = ?, comune_sede = ?,
              ateco_codice = COALESCE(NULLIF(?, ''), ateco_codice),
              ateco_area = COALESCE(NULLIF(?, ''), ateco_area),
              dimensione = COALESCE(NULLIF(?, ''), dimensione),
              fase_vita = COALESCE(NULLIF(?, ''), fase_vita),
              grado_innovazione = COALESCE(?, grado_innovazione),
              uso_ai = COALESCE(?, uso_ai)
          WHERE utente_id = ?
        `, [denom, piva, nomeRef, cognomeRef, ruolo, comuneSede, atecoCodice, atecoArea, dimensione, faseVita, gradoInnovazione, usoAi, utenteId]);
      } else {
        run(`
          INSERT INTO profili_impresa 
          (utente_id, denominazione, partita_iva, nome_referente, cognome_referente, ruolo, comune_sede, ateco_codice, ateco_area, dimensione, fase_vita, grado_innovazione, uso_ai)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [utenteId, denom, piva, nomeRef, cognomeRef, ruolo, comuneSede, atecoCodice, atecoArea, dimensione, faseVita, gradoInnovazione, usoAi]);
      }
    } else {
      // ASPIRANTE
      const nome = (anagrafica.nome || '').trim();
      const cognome = (anagrafica.cognome || '').trim();
      const comuneResidenza = (anagrafica.comuneResidenza || '').trim();

      const statoIdea = domandeEdp?.statoIdea || '';
      const settoreInteresse = domandeEdp?.settoreInteresse || '';
      const condizioneAttuale = domandeEdp?.condizioneAttuale || '';
      const fasciaEta = domandeEdp?.fasciaEta || '';
      const haPartitaIva = domandeEdp?.haPartitaIva || 'No';

      const existingProf = queryOne('SELECT id FROM profili_aspirante WHERE utente_id = ?', [utenteId]);
      if (existingProf) {
        run(`
          UPDATE profili_aspirante
          SET nome = ?, cognome = ?, comune_residenza = ?,
              stato_idea = COALESCE(NULLIF(?, ''), stato_idea),
              settore_interesse = COALESCE(NULLIF(?, ''), settore_interesse),
              condizione_attuale = COALESCE(NULLIF(?, ''), condizione_attuale),
              fascia_eta = COALESCE(NULLIF(?, ''), fascia_eta),
              ha_partita_iva = COALESCE(NULLIF(?, ''), ha_partita_iva)
          WHERE utente_id = ?
        `, [nome, cognome, comuneResidenza, statoIdea, settoreInteresse, condizioneAttuale, fasciaEta, haPartitaIva, utenteId]);
      } else {
        run(`
          INSERT INTO profili_aspirante
          (utente_id, nome, cognome, comune_residenza, stato_idea, settore_interesse, condizione_attuale, fascia_eta, ha_partita_iva)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [utenteId, nome, cognome, comuneResidenza, statoIdea, settoreInteresse, condizioneAttuale, fasciaEta, haPartitaIva]);
      }
    }

    // 3. Append consensi
    if (consensi) {
      if (consensi.privacy) {
        run("INSERT INTO consensi (utente_id, tipo, accettato, timestamp, user_agent) VALUES (?, 'PRIVACY', 1, ?, ?)", [utenteId, nowStr, req.headers['user-agent'] || '']);
      }
      if (consensi.newsletter !== undefined) {
        run("INSERT INTO consensi (utente_id, tipo, accettato, timestamp, user_agent) VALUES (?, 'NEWSLETTER', ?, ?, ?)", [utenteId, consensi.newsletter ? 1 : 0, nowStr, req.headers['user-agent'] || '']);
      }
      if (consensi.geolocalizzazione !== undefined) {
        run("INSERT INTO consensi (utente_id, tipo, accettato, timestamp, user_agent) VALUES (?, 'GEOLOCALIZZAZIONE', ?, ?, ?)", [utenteId, consensi.geolocalizzazione ? 1 : 0, nowStr, req.headers['user-agent'] || '']);
      }
    }

    // 4. Generate unique readable booking code: SI-2026-XXXXXX
    const countRow = queryOne('SELECT COUNT(*) as c FROM appuntamenti');
    const seq = (countRow?.c || 0) + 124;
    const codice = `SI-2026-${String(seq).padStart(6, '0')}`;
    const tokenModifica = crypto.randomBytes(16).toString('hex');

    // Videocall link if modalita === VIDEOCALL
    const videocallLink = modalita === 'VIDEOCALL' ? `https://meet.jit.si/SportelloImpreseMolise-${codice}` : '';

    // Insert appuntamento
    const insAppt = run(`
      INSERT INTO appuntamenti
      (codice, utente_id, sportello_id, data_ora, durata_minuti, modalita, videocall_link, stato, motivo_testo, categoria_bisogno, token_modifica, creato_il)
      VALUES (?, ?, ?, ?, 30, ?, ?, 'CONFERMATO', ?, ?, ?, ?)
    `, [codice, utenteId, sportelloId, datetime, modalita, videocallLink, motivo.testoLibero || '', motivo.categoriaBisogno || 'Bandi e finanziamenti', tokenModifica, nowStr]);

    // Clear slot lock
    const lockKey = `${sportelloId}-${datetime}`;
    slotLocks.delete(lockKey);

    const sportelloInfo = queryOne('SELECT * FROM sportelli WHERE id = ?', [sportelloId]);

    // 5. Invia email di conferma all'indirizzo email inserito durante la procedura
    let emailStatus = { sent: false, simulated: false, error: '' };
    if (email) {
      const recipientName = tipo === 'IMPRESA'
        ? `${anagrafica.nomeReferente || ''} ${anagrafica.cognomeReferente || ''}`.trim() || anagrafica.denominazione || 'Gentile Impresa'
        : `${anagrafica.nome || ''} ${anagrafica.cognome || ''}`.trim() || 'Gentile Utente';

      const hostHeader = req.get('host');
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const portalUrl = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'http://31.70.141.184');

      try {
        const mailResult = await sendAppointmentConfirmationEmail({
          to: email,
          recipientName,
          codice,
          datetime,
          modalita,
          videocallLink,
          sportelloNome: sportelloInfo?.nome || 'Sportello Imprese Molise',
          sportelloIndirizzo: sportelloInfo?.indirizzo || '',
          sportelloComune: sportelloInfo?.comune || '',
          sportelloTelefono: sportelloInfo?.telefono || '0874 011011',
          sportelloEmail: sportelloInfo?.email || 'sportelloimprese@sviluppoitaliamolise.it',
          categoriaBisogno: motivo.categoriaBisogno || 'Bandi e finanziamenti',
          motivoTesto: motivo.testoLibero || '',
          tokenModifica,
          portalUrl
        });
        emailStatus = {
          sent: mailResult.success,
          simulated: Boolean(mailResult.simulated),
          error: mailResult.error || ''
        };
      } catch (mailErr: any) {
        console.error('[EMAIL ERROR] Impossibile inviare email:', mailErr);
        emailStatus = { sent: false, simulated: false, error: mailErr.message };
      }
    }

    res.json({
      success: true,
      codice,
      tokenModifica,
      appuntamentoId: insAppt.lastInsertRowid,
      datetime,
      modalita,
      videocallLink,
      sportello: sportelloInfo,
      emailSent: emailStatus.sent,
      emailStatus,
      emailRecipient: email,
      messaggio: 'Prenotazione confermata con successo'
    });
  } catch (err: any) {
    console.error('Error creating prenotazione:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lookup appointment by token or code
app.get('/api/prenotazioni/:tokenOrCode', (req, res) => {
  try {
    const { tokenOrCode } = req.params;
    const appt = queryOne(`
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune, s.indirizzo as sportello_indirizzo, s.telefono as sportello_telefono, s.email as sportello_email,
             u.email as utente_email, u.telefono as utente_telefono, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione, pi.partita_iva as impresa_piva,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE a.token_modifica = ? OR a.codice = ?
    `, [tokenOrCode, tokenOrCode]);

    if (!appt) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    let profilo: any = null;
    if (appt.utente_tipo === 'IMPRESA') {
      profilo = queryOne('SELECT * FROM profili_impresa WHERE utente_id = ?', [appt.utente_id]);
    } else {
      profilo = queryOne('SELECT * FROM profili_aspirante WHERE utente_id = ?', [appt.utente_id]);
    }

    const merged = {
      ...appt,
      appuntamento: appt,
      profilo
    };

    res.json(merged);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel appointment
app.post('/api/prenotazioni/:tokenOrCode/annulla', (req, res) => {
  try {
    const { tokenOrCode } = req.params;
    const appt = queryOne('SELECT id, stato FROM appuntamenti WHERE token_modifica = ? OR codice = ?', [tokenOrCode, tokenOrCode]);
    if (!appt) return res.status(404).json({ error: 'Prenotazione non trovata' });

    run("UPDATE appuntamenti SET stato = 'ANNULLATO' WHERE id = ?", [appt.id]);
    res.json({ success: true, messaggio: 'Prenotazione annullata con successo' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule appointment
app.post('/api/prenotazioni/:tokenOrCode/modifica', async (req, res) => {
  try {
    const { tokenOrCode } = req.params;
    const { sportelloId, datetime, modalita } = req.body;

    const appt = queryOne('SELECT id, codice, utente_id FROM appuntamenti WHERE token_modifica = ? OR codice = ?', [tokenOrCode, tokenOrCode]);
    if (!appt) return res.status(404).json({ error: 'Prenotazione non trovata' });

    const videocallLink = modalita === 'VIDEOCALL' ? `https://meet.jit.si/SportelloImpreseMolise-${appt.codice}` : '';

    run(`
      UPDATE appuntamenti 
      SET sportello_id = ?, data_ora = ?, modalita = ?, videocall_link = ?, stato = 'CONFERMATO'
      WHERE id = ?
    `, [sportelloId, datetime, modalita, videocallLink, appt.id]);

    // Send updated confirmation email if user has email
    try {
      const u = queryOne('SELECT email, tipo FROM utenti WHERE id = ?', [appt.utente_id]);
      const s = queryOne('SELECT * FROM sportelli WHERE id = ?', [sportelloId]);
      if (u?.email) {
        let recipientName = 'Gentile Utente';
        if (u.tipo === 'IMPRESA') {
          const prof = queryOne('SELECT denominazione, nome_referente, cognome_referente FROM profili_impresa WHERE utente_id = ?', [appt.utente_id]);
          recipientName = `${prof?.nome_referente || ''} ${prof?.cognome_referente || ''}`.trim() || prof?.denominazione || 'Gentile Impresa';
        } else {
          const prof = queryOne('SELECT nome, cognome FROM profili_aspirante WHERE utente_id = ?', [appt.utente_id]);
          recipientName = `${prof?.nome || ''} ${prof?.cognome || ''}`.trim() || 'Gentile Utente';
        }

        const hostHeader = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const portalUrl = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'http://31.70.141.184');

        await sendAppointmentConfirmationEmail({
          to: u.email,
          recipientName,
          codice: appt.codice,
          datetime,
          modalita,
          videocallLink,
          sportelloNome: s?.nome || 'Sportello Imprese Molise',
          sportelloIndirizzo: s?.indirizzo || '',
          sportelloComune: s?.comune || '',
          sportelloTelefono: s?.telefono || '0874 011011',
          sportelloEmail: s?.email || 'sportelloimprese@sviluppoitaliamolise.it',
          categoriaBisogno: 'Modifica Orario/Sede Appuntamento',
          tokenModifica: tokenOrCode,
          portalUrl
        });
      }
    } catch (mErr) {
      console.warn('[EMAIL RESCHEDULE WARN]:', mErr);
    }

    res.json({ success: true, messaggio: 'Prenotazione modificata con successo' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Re-send confirmation email
app.post('/api/prenotazioni/:tokenOrCode/rinvia-email', async (req, res) => {
  try {
    const { tokenOrCode } = req.params;
    const targetEmail = req.body.email;

    const appt = queryOne(`
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune, s.indirizzo as sportello_indirizzo, s.telefono as sportello_telefono, s.email as sportello_email,
             u.email as utente_email, u.telefono as utente_telefono, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione, pi.nome_referente as impresa_nome_ref, pi.cognome_referente as impresa_cognome_ref,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE a.token_modifica = ? OR a.codice = ?
    `, [tokenOrCode, tokenOrCode]);

    if (!appt) return res.status(404).json({ error: 'Prenotazione non trovata' });

    const destEmail = (targetEmail || appt.utente_email || '').trim().toLowerCase();
    if (!destEmail) {
      return res.status(400).json({ error: 'Nessun indirizzo email specificato per l\'invio' });
    }

    const recipientName = appt.utente_tipo === 'IMPRESA'
      ? `${appt.impresa_nome_ref || ''} ${appt.impresa_cognome_ref || ''}`.trim() || appt.impresa_denominazione || 'Gentile Impresa'
      : `${appt.aspirante_nome || ''} ${appt.aspirante_cognome || ''}`.trim() || 'Gentile Utente';

    const hostHeader = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const portalUrl = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'http://31.70.141.184');

    const mailResult = await sendAppointmentConfirmationEmail({
      to: destEmail,
      recipientName,
      codice: appt.codice,
      datetime: appt.data_ora,
      modalita: appt.modalita,
      videocallLink: appt.videocall_link,
      sportelloNome: appt.sportello_nome,
      sportelloIndirizzo: appt.sportello_indirizzo,
      sportelloComune: appt.sportello_comune,
      sportelloTelefono: appt.sportello_telefono,
      sportelloEmail: appt.sportello_email,
      categoriaBisogno: appt.categoria_bisogno || 'Bandi e finanziamenti',
      motivoTesto: appt.motivo_testo || '',
      tokenModifica: appt.token_modifica,
      portalUrl
    });

    res.json({
      success: mailResult.success,
      emailSent: mailResult.success,
      destEmail,
      simulated: mailResult.simulated,
      messaggio: mailResult.success ? `Email inviata con successo a ${destEmail}` : `Errore durante l'invio: ${mailResult.error}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BACK-OFFICE CRM: ACCESSI & RUOLI (AUTH & USER MANAGEMENT)
// ----------------------------------------------------

app.post('/api/crm/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Inserisci username e password' });
    }

    const trimmedUsername = String(username).trim();
    const trimmedPassword = String(password).trim();

    const operator = queryOne(
      'SELECT * FROM crm_operatori WHERE LOWER(username) = LOWER(?)',
      [trimmedUsername]
    );

    if (!operator) {
      return res.status(401).json({ error: 'Credenziali non valide. Username non trovato.' });
    }

    if (operator.password !== trimmedPassword) {
      return res.status(401).json({ error: 'Credenziali non valide. Password errata.' });
    }

    if (!operator.attivo) {
      return res.status(403).json({ error: 'Questa utenza è disattivata o sospesa. Contattare il coordinatore CRM.' });
    }

    // Update last login
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    run('UPDATE crm_operatori SET ultimo_accesso = ? WHERE id = ?', [nowStr, operator.id]);

    const { password: _, ...userSafe } = operator;
    res.json({
      success: true,
      user: {
        ...userSafe,
        ultimo_accesso: nowStr
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/auth/users', (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM crm_operatori ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/auth/users', (req, res) => {
  try {
    const {
      username,
      password,
      nome,
      cognome,
      email,
      ruolo,
      sportello_id,
      sportello_nome,
      note
    } = req.body;

    if (!username || !password || !nome || !cognome || !ruolo) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti (username, password, nome, cognome, ruolo)' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const existing = queryOne('SELECT id FROM crm_operatori WHERE LOWER(username) = LOWER(?)', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: `Lo username '${cleanUsername}' è già in uso. Scegline un altro.` });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = run(
      `INSERT INTO crm_operatori (username, password, nome, cognome, email, ruolo, sportello_id, sportello_nome, attivo, creato_il, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        cleanUsername,
        String(password).trim(),
        String(nome).trim(),
        String(cognome).trim(),
        String(email || '').trim(),
        ruolo,
        sportello_id ? Number(sportello_id) : null,
        sportello_nome || 'Tutti gli Sportelli',
        nowStr,
        note || ''
      ]
    );

    const newUser = queryOne('SELECT * FROM crm_operatori WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/crm/auth/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      password,
      nome,
      cognome,
      email,
      ruolo,
      sportello_id,
      sportello_nome,
      attivo,
      note
    } = req.body;

    const operator = queryOne('SELECT * FROM crm_operatori WHERE id = ?', [id]);
    if (!operator) {
      return res.status(404).json({ error: 'Utenza operatore non trovata' });
    }

    const newPassword = password && String(password).trim() ? String(password).trim() : operator.password;
    const newNome = nome !== undefined ? String(nome).trim() : operator.nome;
    const newCognome = cognome !== undefined ? String(cognome).trim() : operator.cognome;
    const newEmail = email !== undefined ? String(email).trim() : operator.email;
    const newRuolo = ruolo !== undefined ? ruolo : operator.ruolo;
    const newSportelloId = sportello_id !== undefined ? (sportello_id ? Number(sportello_id) : null) : operator.sportello_id;
    const newSportelloNome = sportello_nome !== undefined ? sportello_nome : operator.sportello_nome;
    const newAttivo = attivo !== undefined ? (attivo ? 1 : 0) : operator.attivo;
    const newNote = note !== undefined ? note : operator.note;

    run(
      `UPDATE crm_operatori
       SET password = ?, nome = ?, cognome = ?, email = ?, ruolo = ?,
           sportello_id = ?, sportello_nome = ?, attivo = ?, note = ?
       WHERE id = ?`,
      [newPassword, newNome, newCognome, newEmail, newRuolo, newSportelloId, newSportelloNome, newAttivo, newNote, id]
    );

    const updated = queryOne('SELECT * FROM crm_operatori WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/crm/auth/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = queryOne('SELECT * FROM crm_operatori WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Utenza non trovata' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ error: 'Non è possibile eliminare l\'utenza amministrativa principale (admin).' });
    }

    run('DELETE FROM crm_operatori WHERE id = ?', [id]);
    res.json({ success: true, message: `Utenza ${user.username} eliminata.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BACK-OFFICE CRM API: AGENDA & GESTIONE
// ----------------------------------------------------

app.get('/api/crm/agenda', (req, res) => {
  try {
    const { sportelloId, stato, search, date } = req.query;
    let sql = `
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune,
             u.email as utente_email, u.telefono as utente_telefono, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione, pi.partita_iva as impresa_piva,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (sportelloId) {
      sql += ' AND a.sportello_id = ?';
      params.push(sportelloId);
    }
    if (stato) {
      sql += ' AND a.stato = ?';
      params.push(stato);
    }
    if (date) {
      sql += ' AND date(a.data_ora) = date(?)';
      params.push(date);
    }
    if (search) {
      sql += ` AND (
        a.codice LIKE ? OR 
        u.email LIKE ? OR 
        pi.denominazione LIKE ? OR 
        pa.nome LIKE ? OR 
        pa.cognome LIKE ?
      )`;
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }

    sql += ' ORDER BY a.data_ora DESC';

    const rows = queryAll(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change appointment state (e.g. CONFERMATO -> SVOLTO -> FOLLOWUP -> CHIUSO_POSITIVO)
app.patch(['/api/crm/appuntamenti/:id/stato', '/api/crm/appuntamenti/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const stato = req.body.stato;
    const noteOperatore = req.body.noteOperatore || req.body.note_operatore || req.body.note;
    const followupDate = req.body.followupDate || req.body.followup_date;
    const followupEsito = req.body.followupEsito || req.body.followup_esito;

    const validStates = ['RICHIESTO', 'CONFERMATO', 'SVOLTO', 'NOSHOW', 'FOLLOWUP', 'CHIUSO_POSITIVO', 'CHIUSO_NEGATIVO', 'ANNULLATO'];
    if (stato && !validStates.includes(stato)) {
      return res.status(400).json({ error: 'Stato non valido' });
    }

    run(`
      UPDATE appuntamenti
      SET stato = COALESCE(?, stato),
          note_operatore = COALESCE(?, note_operatore),
          followup_date = COALESCE(?, followup_date),
          followup_esito = COALESCE(?, followup_esito)
      WHERE id = ?
    `, [stato || null, noteOperatore || null, followupDate || null, followupEsito || null, id]);

    // If marked as SVOLTO, optionally create an interaction record
    if (stato === 'SVOLTO') {
      const appt = queryOne('SELECT * FROM appuntamenti WHERE id = ?', [id]);
      if (appt) {
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30); // 30-day follow up reminder
        const nextDateStr = nextDate.toISOString().substring(0, 10);

        run(`
          INSERT INTO interazioni
          (utente_id, appuntamento_id, sportello_id, operatore_nome, data_ora, canale, tipologia_richiesta, bandi_trattati, esito, stato_followup, data_prossimo_ricontatto, note)
          VALUES (?, ?, ?, 'Operatore Sportello', ?, 'SPORTELLO', ?, ?, 'COLLOQUIO_SVOLTO', 'PROGRAMMATO', ?, ?)
        `, [appt.utente_id, appt.id, appt.sportello_id, nowStr, appt.categoria_bisogno, '', nextDateStr, noteOperatore || 'Colloquio completato. Avviata fase di orientamento.']);
      }
    }

    res.json({ success: true, id, stato });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete appointment
app.delete('/api/crm/appuntamenti/:id', (req, res) => {
  try {
    const { id } = req.params;
    run('DELETE FROM appuntamenti WHERE id = ?', [id]);
    res.json({ success: true, message: 'Appuntamento eliminato dal database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Manual appointment creation by back-office operator / contact center
app.post('/api/crm/appuntamenti', async (req, res) => {
  try {
    const { utenteId, sportelloId, dataOra, modalita, motivo, categoria, note, inviaEmail = true } = req.body;
    if (!utenteId || !sportelloId || !dataOra) {
      return res.status(400).json({ error: 'utenteId, sportelloId e dataOra sono obbligatori' });
    }

    const countRow = queryOne('SELECT COUNT(*) as c FROM appuntamenti');
    const seq = (countRow?.c || 0) + 125;
    const codice = `SI-2026-${String(seq).padStart(6, '0')}`;
    const token = crypto.randomBytes(16).toString('hex');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const videocallLink = modalita === 'VIDEOCALL' ? `https://meet.jit.si/SportelloImpreseMolise-${codice}` : '';

    const ins = run(`
      INSERT INTO appuntamenti
      (codice, utente_id, sportello_id, data_ora, durata_minuti, modalita, videocall_link, stato, motivo_testo, categoria_bisogno, token_modifica, creato_il, note_operatore)
      VALUES (?, ?, ?, ?, 30, ?, ?, 'CONFERMATO', ?, ?, ?, ?, ?)
    `, [codice, utenteId, sportelloId, dataOra, modalita || 'PRESENZA', videocallLink, motivo || 'Prenotazione da Contact Center', categoria || 'Bandi e finanziamenti', token, nowStr, note || '']);

    let emailSent = false;
    if (inviaEmail) {
      try {
        const u = queryOne('SELECT email, tipo FROM utenti WHERE id = ?', [utenteId]);
        const s = queryOne('SELECT * FROM sportelli WHERE id = ?', [sportelloId]);
        if (u?.email) {
          let recipientName = 'Gentile Utente';
          if (u.tipo === 'IMPRESA') {
            const prof = queryOne('SELECT denominazione, nome_referente, cognome_referente FROM profili_impresa WHERE utente_id = ?', [utenteId]);
            recipientName = `${prof?.nome_referente || ''} ${prof?.cognome_referente || ''}`.trim() || prof?.denominazione || 'Gentile Impresa';
          } else {
            const prof = queryOne('SELECT nome, cognome FROM profili_aspirante WHERE utente_id = ?', [utenteId]);
            recipientName = `${prof?.nome || ''} ${prof?.cognome || ''}`.trim() || 'Gentile Utente';
          }

          const hostHeader = req.get('host');
          const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
          const portalUrl = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'http://31.70.141.184');

          const mailResult = await sendAppointmentConfirmationEmail({
            to: u.email,
            recipientName,
            codice,
            datetime: dataOra,
            modalita: modalita || 'PRESENZA',
            videocallLink,
            sportelloNome: s?.nome || 'Sportello Imprese Molise',
            sportelloIndirizzo: s?.indirizzo || '',
            sportelloComune: s?.comune || '',
            sportelloTelefono: s?.telefono || '0874 011011',
            sportelloEmail: s?.email || 'sportelloimprese@sviluppoitaliamolise.it',
            categoriaBisogno: categoria || 'Bandi e finanziamenti',
            motivoTesto: motivo || '',
            tokenModifica: token,
            portalUrl
          });
          emailSent = mailResult.success;
        }
      } catch (mErr) {
        console.warn('[CRM APPOINTMENT EMAIL WARN]:', mErr);
      }
    }

    res.json({ success: true, id: ins.lastInsertRowid, codice, emailSent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit send/resend email for an existing appointment from CRM
app.post('/api/crm/appuntamenti/:id/send-email', async (req, res) => {
  try {
    const { id } = req.params;
    const { customEmail } = req.body;

    const appt = queryOne(`
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune, s.indirizzo as sportello_indirizzo, s.telefono as sportello_telefono, s.email as sportello_email,
             u.email as utente_email, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione, pi.nome_referente as impresa_nome_ref, pi.cognome_referente as impresa_cognome_ref,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE a.id = ?
    `, [id]);

    if (!appt) return res.status(404).json({ error: 'Appuntamento non trovato' });

    const destEmail = (customEmail || appt.utente_email || '').trim().toLowerCase();
    if (!destEmail) {
      return res.status(400).json({ error: 'Nessun indirizzo email associato all\'utente' });
    }

    const recipientName = appt.utente_tipo === 'IMPRESA'
      ? `${appt.impresa_nome_ref || ''} ${appt.impresa_cognome_ref || ''}`.trim() || appt.impresa_denominazione || 'Gentile Impresa'
      : `${appt.aspirante_nome || ''} ${appt.aspirante_cognome || ''}`.trim() || 'Gentile Utente';

    const hostHeader = req.get('host');
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const portalUrl = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'http://31.70.141.184');

    const mailResult = await sendAppointmentConfirmationEmail({
      to: destEmail,
      recipientName,
      codice: appt.codice,
      datetime: appt.data_ora,
      modalita: appt.modalita,
      videocallLink: appt.videocall_link,
      sportelloNome: appt.sportello_nome,
      sportelloIndirizzo: appt.sportello_indirizzo,
      sportelloComune: appt.sportello_comune,
      sportelloTelefono: appt.sportello_telefono,
      sportelloEmail: appt.sportello_email,
      categoriaBisogno: appt.categoria_bisogno || 'Bandi e finanziamenti',
      motivoTesto: appt.motivo_testo || '',
      tokenModifica: appt.token_modifica,
      portalUrl
    });

    res.json({
      success: mailResult.success,
      emailSent: mailResult.success,
      destEmail,
      simulated: mailResult.simulated,
      messaggio: mailResult.success ? `Email inviata a ${destEmail}` : `Errore invio: ${mailResult.error}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BACK-OFFICE CRM API: ANAGRAFICA UTENTI & 360° VIEW
// ----------------------------------------------------

app.get('/api/crm/utenti', (req, res) => {
  try {
    const { tipo, comune, sportelloId, search } = req.query;
    let sql = `
      SELECT u.*,
             pi.denominazione as impresa_denominazione, pi.partita_iva as impresa_piva, pi.comune_sede as impresa_comune, pi.ateco_area as impresa_ris3, pi.dimensione as impresa_dimensione,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome, pa.comune_residenza as aspirante_comune, pa.settore_interesse as aspirante_ris3,
             (SELECT COUNT(*) FROM appuntamenti a WHERE a.utente_id = u.id) as appuntamenti_count,
             (SELECT MAX(a.data_ora) FROM appuntamenti a WHERE a.utente_id = u.id) as ultimo_appuntamento
      FROM utenti u
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tipo) {
      sql += ' AND u.tipo = ?';
      params.push(tipo);
    }
    if (comune) {
      sql += ' AND (pi.comune_sede = ? OR pa.comune_residenza = ?)';
      params.push(comune, comune);
    }
    if (search) {
      sql += ` AND (
        u.email LIKE ? OR 
        u.telefono LIKE ? OR 
        pi.denominazione LIKE ? OR 
        pi.partita_iva LIKE ? OR 
        pa.nome LIKE ? OR 
        pa.cognome LIKE ?
      )`;
      const q = `%${search}%`;
      params.push(q, q, q, q, q, q);
    }

    sql += ' ORDER BY u.data_creazione DESC';
    const rows = queryAll(sql, params).map((r: any) => {
      const denominazione = r.impresa_denominazione || r.denominazione || '';
      const nome = r.aspirante_nome || r.nome || '';
      const cognome = r.aspirante_cognome || r.cognome || '';
      const partita_iva = r.impresa_piva || r.partita_iva || '';
      const comune_sede = r.impresa_comune || r.comune_sede || '';
      const comune_residenza = r.aspirante_comune || r.comune_residenza || '';
      const settore_ris3 = r.impresa_ris3 || r.aspirante_ris3 || r.settore_ris3 || '';

      return {
        ...r,
        denominazione,
        impresa_denominazione: denominazione,
        nome,
        cognome,
        aspirante_nome: nome,
        aspirante_cognome: cognome,
        partita_iva,
        impresa_piva: partita_iva,
        comune_sede,
        comune_residenza,
        settore_ris3,
        creato_il: r.data_creazione || r.creato_il || ''
      };
    });
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/utenti/:id', (req, res) => {
  try {
    const { id } = req.params;
    const utente = queryOne('SELECT * FROM utenti WHERE id = ?', [id]);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato' });

    let profilo: any = null;
    if (utente.tipo === 'IMPRESA') {
      profilo = queryOne('SELECT * FROM profili_impresa WHERE utente_id = ?', [id]);
    } else {
      profilo = queryOne('SELECT * FROM profili_aspirante WHERE utente_id = ?', [id]);
    }

    const appuntamenti = queryAll(`
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      WHERE a.utente_id = ?
      ORDER BY a.data_ora DESC
    `, [id]);

    const interazioni = queryAll(`
      SELECT i.*, s.nome as sportello_nome
      FROM interazioni i
      JOIN sportelli s ON i.sportello_id = s.id
      WHERE i.utente_id = ?
      ORDER BY i.data_ora DESC
    `, [id]);

    const consensi = queryAll('SELECT * FROM consensi WHERE utente_id = ? ORDER BY timestamp DESC', [id]);

    const privacyConsent = consensi.find((c: any) => c.tipo === 'PRIVACY' && (c.accettato === 1 || c.accettato === true));
    const newsletterConsent = consensi.find((c: any) => c.tipo === 'NEWSLETTER');
    const geoConsent = consensi.find((c: any) => c.tipo === 'GEOLOCALIZZAZIONE');

    const rawCreationDate = utente.data_creazione || utente.creato_il || '';

    const utenteNormalized = {
      ...utente,
      creato_il: rawCreationDate,
      data_creazione: rawCreationDate,
      consenso_privacy_data: privacyConsent?.timestamp || rawCreationDate || null,
      consenso_newsletter: newsletterConsent ? Boolean(newsletterConsent.accettato) : false,
      consenso_geo: geoConsent ? Boolean(geoConsent.accettato) : false
    };

    res.json({ utente: utenteNormalized, profilo, appuntamenti, interazioni, consensi });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update post-interview fields / EDP profile by operator
app.all(['/api/crm/utenti/:id/post-colloquio', '/api/crm/utenti/:id/profilo'], (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
  try {
    const { id } = req.params;
    const atecoCodice = req.body.ateco || req.body.atecoCodice || req.body.ateco_codice;
    const atecoArea = req.body.settore_ris3 || req.body.atecoArea || req.body.ateco_area;
    const dimensione = req.body.dimensione;
    const faseVita = req.body.fase_vita || req.body.faseVita;
    const gradoInnovazione = req.body.grado_innovazione || req.body.gradoInnovazione;
    const usoAi = req.body.uso_ai || req.body.usoAi;
    const criticitaRilevate = req.body.criticita_identificate || req.body.criticitaRilevate || req.body.criticita_rilevate;
    const strumentiSuggeriti = req.body.strumenti_suggeriti || req.body.strumentiSuggeriti;
    const noteOperatore = req.body.note_operatore || req.body.noteOperatore || req.body.note;

    const utente = queryOne('SELECT tipo FROM utenti WHERE id = ?', [id]);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato' });

    if (utente.tipo === 'IMPRESA') {
      run(`
        UPDATE profili_impresa
        SET ateco_codice = COALESCE(?, ateco_codice),
            ateco_area = COALESCE(?, ateco_area),
            dimensione = COALESCE(?, dimensione),
            fase_vita = COALESCE(?, fase_vita),
            grado_innovazione = COALESCE(?, grado_innovazione),
            uso_ai = COALESCE(?, uso_ai),
            criticita_rilevate = COALESCE(?, criticita_rilevate),
            strumenti_suggeriti = COALESCE(?, strumenti_suggeriti)
        WHERE utente_id = ?
      `, [atecoCodice || null, atecoArea || null, dimensione || null, faseVita || null, gradoInnovazione || null, usoAi || null, criticitaRilevate || null, strumentiSuggeriti || null, id]);
    } else if (utente.tipo === 'ASPIRANTE') {
      run(`
        UPDATE profili_aspirante
        SET settore_interesse = COALESCE(?, settore_interesse),
            fase_progetto = COALESCE(?, fase_progetto)
        WHERE utente_id = ?
      `, [atecoArea || atecoCodice || null, faseVita || null, id]);
    }

    if (noteOperatore) {
      run('UPDATE utenti SET note = ? WHERE id = ?', [noteOperatore, id]);
    }

    res.json({ success: true, messaggio: 'Scheda EDP aggiornata dall\'operatore con successo nel database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GDPR export & deletion / anonimizzazione
app.post(['/api/crm/utenti/:id/gdpr-delete', '/api/crm/utenti/:id/anonimizza'], (req, res) => {
  try {
    const { id } = req.params;
    // Anonymize personal details
    run("UPDATE utenti SET email = 'anonimo@gdpr.sviluppoitaliamolise.it', telefono = '+39 0000000000', note = 'Anonimizzato su richiesta GDPR' WHERE id = ?", [id]);
    run("UPDATE profili_impresa SET denominazione = 'Impresa Anonimizzata', partita_iva = '00000000000', nome_referente = 'Anonimo', cognome_referente = 'Anonimo' WHERE utente_id = ?", [id]);
    run("UPDATE profili_aspirante SET nome = 'Anonimo', cognome = 'Anonimo' WHERE utente_id = ?", [id]);
    run("INSERT INTO consensi (utente_id, tipo, accettato, timestamp) VALUES (?, 'REVOCA_GDPR', 0, datetime('now'))", [id]);
    res.json({ success: true, messaggio: 'Dati utente anonimizzati nel rispetto del GDPR' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Permanent deletion of user record
app.delete('/api/crm/utenti/:id', (req, res) => {
  try {
    const { id } = req.params;
    run('DELETE FROM consensi WHERE utente_id = ?', [id]);
    run('DELETE FROM appuntamenti WHERE utente_id = ?', [id]);
    run('DELETE FROM interazioni WHERE utente_id = ?', [id]);
    run('DELETE FROM profili_impresa WHERE utente_id = ?', [id]);
    run('DELETE FROM profili_aspirante WHERE utente_id = ?', [id]);
    run('DELETE FROM utenti WHERE id = ?', [id]);
    res.json({ success: true, message: 'Record utente eliminato definitivamente dal database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BACK-OFFICE CRM API: REGISTRO INTERAZIONI & RECALL QUEUE
// ----------------------------------------------------

app.get('/api/crm/interazioni', (req, res) => {
  try {
    const { statoFollowup, soloRecall } = req.query;
    let sql = `
      SELECT i.*, s.nome as sportello_nome, s.comune as sportello_comune,
             u.email as utente_email, u.telefono as utente_telefono, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM interazioni i
      JOIN sportelli s ON i.sportello_id = s.id
      JOIN utenti u ON i.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statoFollowup) {
      sql += ' AND i.stato_followup = ?';
      params.push(statoFollowup);
    }
    if (soloRecall === 'true') {
      sql += " AND i.data_prossimo_ricontatto IS NOT NULL AND i.data_prossimo_ricontatto != '' AND i.stato_followup != 'COMPLETATO'";
    }

    sql += ' ORDER BY i.data_ora DESC';
    const rows = queryAll(sql, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/interazioni', (req, res) => {
  try {
    const utenteId = req.body.utenteId || req.body.utente_id;
    const appuntamentoId = req.body.appuntamentoId || req.body.appuntamento_id || null;
    const sportelloId = req.body.sportelloId || req.body.sportello_id;
    const operatoreNome = req.body.operatoreNome || req.body.operatore_nome || 'Operatore Contact Center';
    const canale = req.body.canale || 'TELEFONO';
    const tipologiaRichiesta = req.body.tipologiaRichiesta || req.body.tipologia_richiesta || 'Informazioni Bandi';
    const bandiTrattati = req.body.bandiTrattati || req.body.bandi_trattati || '';
    const esito = req.body.esito || 'RICHIESTA_GESTITA';
    const statoFollowup = req.body.statoFollowup || req.body.stato_followup || 'PROGRAMMATO';
    const dataProssimoRicontatto = req.body.dataProssimoRicontatto || req.body.data_prossimo_ricontatto || '';
    const note = req.body.note || '';

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const ins = run(`
      INSERT INTO interazioni
      (utente_id, appuntamento_id, sportello_id, operatore_nome, data_ora, canale, tipologia_richiesta, bandi_trattati, esito, stato_followup, data_prossimo_ricontatto, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      utenteId,
      appuntamentoId,
      sportelloId,
      operatoreNome,
      nowStr,
      canale,
      tipologiaRichiesta,
      bandiTrattati,
      esito,
      statoFollowup,
      dataProssimoRicontatto,
      note
    ]);

    res.json({ success: true, id: ins.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete interaction from SQL database
app.delete('/api/crm/interazioni/:id', (req, res) => {
  try {
    const { id } = req.params;
    run('DELETE FROM interazioni WHERE id = ?', [id]);
    res.json({ success: true, message: 'Interazione eliminata dal database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BANDI & AI MATCHING
// ----------------------------------------------------

app.get('/api/bandi', (req, res) => {
  try {
    const { ris3, livello, stato } = req.query;
    let sql = 'SELECT * FROM bandi WHERE 1=1';
    const params: any[] = [];
    if (ris3) {
      sql += ' AND area_ris3 LIKE ?';
      params.push(`%${ris3}%`);
    }
    if (livello) {
      sql += ' AND livello = ?';
      params.push(livello);
    }
    if (stato) {
      sql += ' AND stato = ?';
      params.push(stato);
    }
    sql += ' ORDER BY scadenza ASC';
    const rows = queryAll(sql, params).map((b: any) => {
      let allegatiList: any[] = [];
      if (b.allegati) {
        try {
          allegatiList = typeof b.allegati === 'string' ? JSON.parse(b.allegati) : b.allegati;
        } catch {
          allegatiList = [];
        }
      }
      return {
        ...b,
        allegati: Array.isArray(allegatiList) ? allegatiList : []
      };
    });
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const handleCreateBando = (req: express.Request, res: express.Response) => {
  try {
    const {
      titolo,
      ente,
      livello,
      area_ris3,
      areaRis3,
      beneficiari,
      scadenza,
      link,
      scheda_semplificata,
      schedaSemplificata,
      stato,
      allegati
    } = req.body;

    const allegatiJson = JSON.stringify(Array.isArray(allegati) ? allegati : []);

    const ins = run(`
      INSERT INTO bandi (titolo, ente, livello, area_ris3, beneficiari, scadenza, link, scheda_semplificata, stato, allegati)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      titolo,
      ente || 'Regione Molise',
      livello || 'REGIONALE',
      area_ris3 || areaRis3 || 'ICT',
      beneficiari || '',
      scadenza || '',
      link || '',
      scheda_semplificata || schedaSemplificata || '',
      stato || 'ATTIVO',
      allegatiJson
    ]);

    res.json({ success: true, id: ins.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/bandi', handleCreateBando);
app.post('/api/crm/bandi', handleCreateBando);

const handleUpdateBando = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const {
      titolo,
      ente,
      livello,
      area_ris3,
      areaRis3,
      beneficiari,
      scadenza,
      link,
      scheda_semplificata,
      schedaSemplificata,
      stato,
      allegati
    } = req.body;

    const existing = queryOne('SELECT * FROM bandi WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Bando non trovato' });

    const allegatiJson = allegati !== undefined
      ? JSON.stringify(Array.isArray(allegati) ? allegati : [])
      : (existing.allegati || '[]');

    run(`
      UPDATE bandi SET
        titolo = ?,
        ente = ?,
        livello = ?,
        area_ris3 = ?,
        beneficiari = ?,
        scadenza = ?,
        link = ?,
        scheda_semplificata = ?,
        stato = ?,
        allegati = ?
      WHERE id = ?
    `, [
      titolo !== undefined ? titolo : existing.titolo,
      ente !== undefined ? ente : existing.ente,
      livello !== undefined ? livello : existing.livello,
      (area_ris3 || areaRis3) !== undefined ? (area_ris3 || areaRis3) : existing.area_ris3,
      beneficiari !== undefined ? beneficiari : existing.beneficiari,
      scadenza !== undefined ? scadenza : existing.scadenza,
      link !== undefined ? link : existing.link,
      (scheda_semplificata || schedaSemplificata) !== undefined ? (scheda_semplificata || schedaSemplificata) : existing.scheda_semplificata,
      stato !== undefined ? stato : existing.stato,
      allegatiJson,
      id
    ]);

    res.json({ success: true, message: 'Bando aggiornato con successo' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.put('/api/bandi/:id', handleUpdateBando);
app.put('/api/crm/bandi/:id', handleUpdateBando);

const handleDeleteBando = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    run('DELETE FROM bandi WHERE id = ?', [id]);
    res.json({ success: true, message: 'Bando eliminato' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.delete('/api/bandi/:id', handleDeleteBando);
app.delete('/api/crm/bandi/:id', handleDeleteBando);

// AI Matching endpoint
app.post('/api/ai/match-bandi', async (req, res) => {
  try {
    const { utenteId, customProfile } = req.body;
    let profileToMatch = customProfile;

    if (utenteId && !profileToMatch) {
      const u = queryOne('SELECT * FROM utenti WHERE id = ?', [utenteId]);
      if (u) {
        if (u.tipo === 'IMPRESA') {
          const pi = queryOne('SELECT * FROM profili_impresa WHERE utente_id = ?', [utenteId]);
          profileToMatch = {
            tipo: 'IMPRESA',
            denominazione: pi?.denominazione,
            ruolo: pi?.ruolo,
            comune: pi?.comune_sede,
            ateco: pi?.ateco_codice,
            areaRis3: pi?.ateco_area,
            dimensione: pi?.dimensione,
            faseVita: pi?.fase_vita,
            innovazione: pi?.grado_innovazione,
            usoAi: pi?.uso_ai,
            criticita: pi?.criticita_rilevate
          };
        } else {
          const pa = queryOne('SELECT * FROM profili_aspirante WHERE utente_id = ?', [utenteId]);
          profileToMatch = {
            tipo: 'ASPIRANTE',
            comune: pa?.comune_residenza,
            statoIdea: pa?.stato_idea,
            areaRis3: pa?.settore_interesse,
            condizioneAttuale: pa?.condizione_attuale,
            fasciaEta: pa?.fascia_eta,
            haPartitaIva: pa?.ha_partita_iva
          };
        }
      }
    }

    if (!profileToMatch) {
      return res.status(400).json({ error: 'Profilo utente mancante' });
    }

    const grants = queryAll("SELECT * FROM bandi WHERE stato = 'ATTIVO'");
    const result = await matchBandiForProfile(profileToMatch, grants);
    res.json(result);
  } catch (err: any) {
    console.error('AI match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// HERO SHOWCASE CONFIGURATION (CAROUSEL / WEB TV / DIGITALE)
// ----------------------------------------------------
const DEFAULT_HERO_CONFIG = {
  activeMode: 'webtv', // 'webtv' | 'carousel' | 'digital'
  autoplayIntervalSeconds: 5,
  webtvConfig: {
    badge: 'ON AIR',
    subtitle: 'La Bottega delle Opportunità',
    ctaText: 'Prenota un appuntamento per questo bando',
    selectedVideoId: null
  },
  carouselSlides: [
    {
      id: 'slide-1',
      title: 'Bandi FESR Molise: Transizione Digitale & Green',
      subtitle: 'Contributi a fondo perduto fino all\'80% per PMI, professionisti e nuove imprese del Molise',
      tag: 'BANDO ATTIVO 2026',
      tagColor: 'emerald',
      imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80',
      ctaText: 'Prenota Orientamento Tecnico',
      ctaAction: 'booking',
      grantTitle: 'Incentivi Innovazione Digitale FESR Molise'
    },
    {
      id: 'slide-2',
      title: 'Nuova Imprenditoria Giovanile & Femminile',
      subtitle: 'Percorsi guidati di scoperta imprenditoriale (EDP) nei 12 sportelli territoriali regionali',
      tag: 'SUPPORTO STARTUP',
      tagColor: 'purple',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
      ctaText: 'Accompagnamento Aspiranti Imprese',
      ctaAction: 'booking_aspirante',
      grantTitle: 'Autoimpiego e Creazione d\'Impresa Molise'
    },
    {
      id: 'slide-3',
      title: 'Web TV "La Bottega delle Opportunità"',
      subtitle: 'Video-pillole settimanali e testimonianze dirette delle imprese che ce l\'hanno fatta',
      tag: 'CANALE MULTIMEDIALE',
      tagColor: 'red',
      imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1000&q=80',
      ctaText: 'Guarda le Puntate Ufficiali',
      ctaAction: 'webtv_modal',
      grantTitle: ''
    }
  ],
  digitalContentConfig: {
    title: 'Hub Risorse Digitali & Notiziario Flash',
    badge: 'AGGIORNAMENTO LIVE',
    items: [
      {
        id: 'item-1',
        title: 'Guida Operativa Bandi FESR FSE+ 2026',
        category: 'DOCUMENTAZIONE',
        description: 'Vademecum con requisiti di ammissibilità, criteri di premialità e check-list documentale.',
        link: 'https://sviluppoitaliamolise.it',
        type: 'guide',
        dateBadge: 'Aggiornato oggi'
      },
      {
        id: 'item-2',
        title: 'Podcast: Storie di Imprese Resilienti nel Molise',
        category: 'AUDIO & PODCAST',
        description: 'Ascolta le testimonianze degli artigiani e innovatori che hanno aperto grazie agli sportelli.',
        link: 'https://sviluppoitaliamolise.it',
        type: 'podcast',
        dateBadge: 'Episodio 4'
      },
      {
        id: 'item-3',
        title: 'Avviso Chiusura: Bando Internazionalizzazione',
        category: 'SCADENZA IMMINENTE',
        description: 'Lo sportello telematico chiude a fine mese. Verifica i punteggi con il tuo referente di zona.',
        link: '#prenota',
        type: 'deadline',
        dateBadge: '14 giorni'
      }
    ]
  }
};

app.get('/api/hero-showcase', (req, res) => {
  try {
    const row = queryOne("SELECT valore FROM configurazioni WHERE chiave = 'hero_showcase'");
    if (!row || !row.valore) {
      return res.json(DEFAULT_HERO_CONFIG);
    }
    const parsed = JSON.parse(row.valore);
    res.json({ ...DEFAULT_HERO_CONFIG, ...parsed });
  } catch (err: any) {
    res.json(DEFAULT_HERO_CONFIG);
  }
});

app.put('/api/hero-showcase', (req, res) => {
  try {
    const newConfig = req.body;
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Configurazione non valida' });
    }
    const jsonStr = JSON.stringify(newConfig);
    run(
      `INSERT INTO configurazioni (chiave, valore) VALUES ('hero_showcase', ?)
       ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore`,
      [jsonStr]
    );
    res.json({ success: true, config: newConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// WEB TV & QR CODES
// ----------------------------------------------------

app.get(['/api/webtv', '/api/webtv/video'], (req, res) => {
  try {
    const rows = queryAll(`
      SELECT v.*, b.titolo as bando_titolo 
      FROM video_webtv v 
      LEFT JOIN bandi b ON v.bando_id = b.id 
      ORDER BY v.data_pubblicazione DESC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/webtv/video', '/api/crm/webtv', '/api/crm/webtv/video'], (req, res) => {
  try {
    const titolo = req.body.titolo;
    const urlYoutube = req.body.urlYoutube || req.body.url_youtube || '';
    let yId = req.body.youtubeId || req.body.youtube_id;
    if (!yId && urlYoutube) {
      if (urlYoutube.includes('v=')) {
        yId = urlYoutube.split('v=')[1].substring(0, 11);
      } else if (urlYoutube.includes('youtu.be/')) {
        yId = urlYoutube.split('youtu.be/')[1].substring(0, 11);
      }
    }
    if (!yId) yId = 'dQw4w9WgXcQ';
    const rubrica = req.body.rubrica || 'Orientamento Bandi';
    const descrizione = req.body.descrizione || '';
    const bandoId = req.body.bandoId || req.body.bando_id || null;
    const pubDate = req.body.dataPubblicazione || req.body.data_pubblicazione || new Date().toISOString().substring(0, 10);

    const ins = run(`
      INSERT INTO video_webtv (titolo, url_youtube, youtube_id, rubrica, descrizione, bando_id, data_pubblicazione, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [titolo, urlYoutube, yId, rubrica, descrizione, bandoId, pubDate]);

    res.json({ success: true, id: ins.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update video
app.put(['/api/webtv/video/:id', '/api/crm/webtv/:id', '/api/crm/webtv/video/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const titolo = req.body.titolo;
    const urlYoutube = req.body.urlYoutube || req.body.url_youtube;
    const youtubeId = req.body.youtubeId || req.body.youtube_id;
    const rubrica = req.body.rubrica;
    const descrizione = req.body.descrizione;
    const bandoId = req.body.bandoId || req.body.bando_id;

    run(`
      UPDATE video_webtv
      SET titolo = COALESCE(?, titolo),
          url_youtube = COALESCE(?, url_youtube),
          youtube_id = COALESCE(?, youtube_id),
          rubrica = COALESCE(?, rubrica),
          descrizione = COALESCE(?, descrizione),
          bando_id = COALESCE(?, bando_id)
      WHERE id = ?
    `, [titolo || null, urlYoutube || null, youtubeId || null, rubrica || null, descrizione || null, bandoId || null, id]);

    res.json({ success: true, message: 'Video aggiornato nel database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete video
app.delete(['/api/webtv/video/:id', '/api/crm/webtv/:id', '/api/crm/webtv/video/:id'], (req, res) => {
  try {
    const { id } = req.params;
    run('DELETE FROM video_webtv WHERE id = ?', [id]);
    res.json({ success: true, message: 'Video eliminato con successo dal database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webtv/video/:id/view', (req, res) => {
  try {
    run('UPDATE video_webtv SET views = views + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/qrcodes', (req, res) => {
  try {
    const rows = queryAll('SELECT * FROM qr_codes ORDER BY creato_il DESC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qrcodes', (req, res) => {
  try {
    const { label, comune, evento, canale, targetUrl } = req.body;
    const codice = `QR-${(comune || 'MOLISE').substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const url = targetUrl || `https://sviluppoitaliamolise.it/sportello?src=qr&comune=${encodeURIComponent(comune || '')}&codice=${codice}`;

    const ins = run(`
      INSERT INTO qr_codes (codice, label, comune, evento, canale, url, scansioni, creato_il)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `, [codice, label, comune || '', evento || '', canale || 'Affissione', url]);

    res.json({ success: true, id: ins.lastInsertRowid, codice, url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qrcodes/:codice/scan', (req, res) => {
  try {
    run('UPDATE qr_codes SET scansioni = scansioni + 1 WHERE codice = ?', [req.params.codice]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DASHBOARD CRUSCOTTO & STATISTICHE
// ----------------------------------------------------

app.get('/api/crm/cruscotto', (req, res) => {
  try {
    // Total users
    const totalUsers = queryOne('SELECT COUNT(*) as count FROM utenti')?.count || 0;
    const impreseCount = queryOne("SELECT COUNT(*) as count FROM utenti WHERE tipo = 'IMPRESA'")?.count || 0;
    const aspirantiCount = queryOne("SELECT COUNT(*) as count FROM utenti WHERE tipo = 'ASPIRANTE'")?.count || 0;

    // Appointments by state
    const apptsTotal = queryOne('SELECT COUNT(*) as count FROM appuntamenti')?.count || 0;
    const apptsPrenotati = queryOne("SELECT COUNT(*) as count FROM appuntamenti WHERE stato IN ('RICHIESTO', 'CONFERMATO')")?.count || 0;
    const apptsSvolti = queryOne("SELECT COUNT(*) as count FROM appuntamenti WHERE stato IN ('SVOLTO', 'FOLLOWUP', 'CHIUSO_POSITIVO', 'CHIUSO_NEGATIVO')")?.count || 0;
    const apptsAnnullati = queryOne("SELECT COUNT(*) as count FROM appuntamenti WHERE stato = 'ANNULLATO'")?.count || 0;
    const apptsNoShow = queryOne("SELECT COUNT(*) as count FROM appuntamenti WHERE stato = 'NOSHOW'")?.count || 0;

    // Positive follow-up KPI: target >= 10%
    // Positive follow ups are appuntamenti with stato = 'CHIUSO_POSITIVO' or interazioni with esito = 'DOMANDA_PRESENTATA' / 'ESITO_POSITIVO'
    const positiveFollowup = queryOne("SELECT COUNT(*) as count FROM appuntamenti WHERE stato = 'CHIUSO_POSITIVO'")?.count || 0;
    const totalConcluded = Math.max(1, apptsSvolti);
    const followUpRatePercent = Math.round((positiveFollowup / totalConcluded) * 100);

    // Appointments by sportello (with target 250 users/year)
    const sportelliStats = queryAll(`
      SELECT s.id, s.nome, s.comune, s.giorni, s.orario, s.cadenza,
             COUNT(a.id) as appuntamenti_count,
             COUNT(a.id) as usersCount,
             250 as target_annuo,
             ROUND((COUNT(a.id) * 100.0 / 250), 1) as percentuale_target
      FROM sportelli s
      LEFT JOIN appuntamenti a ON s.id = a.sportello_id AND a.stato != 'ANNULLATO'
      GROUP BY s.id
      ORDER BY appuntamenti_count DESC
    `);

    // Needs breakdown
    const bisogniStats = queryAll(`
      SELECT categoria_bisogno as categoria, COUNT(*) as count
      FROM appuntamenti
      WHERE categoria_bisogno IS NOT NULL AND categoria_bisogno != ''
      GROUP BY categoria_bisogno
      ORDER BY count DESC
    `);

    // RIS3 areas breakdown
    const ris3Stats = queryAll(`
      SELECT ateco_area as area, COUNT(*) as count
      FROM profili_impresa
      WHERE ateco_area IS NOT NULL AND ateco_area != ''
      GROUP BY ateco_area
      UNION ALL
      SELECT settore_interesse as area, COUNT(*) as count
      FROM profili_aspirante
      WHERE settore_interesse IS NOT NULL AND settore_interesse != ''
      GROUP BY settore_interesse
    `);

    // Channels breakdown
    const canaliStats = queryAll(`
      SELECT canale_accesso as canale, COUNT(*) as count
      FROM utenti
      GROUP BY canale_accesso
      ORDER BY count DESC
    `);

    // Today / Tomorrow appointments
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayTomorrowAppts = queryAll(`
      SELECT a.*, s.nome as sportello_nome, s.comune as sportello_comune,
             u.email as utente_email, u.telefono as utente_telefono, u.tipo as utente_tipo,
             pi.denominazione as impresa_denominazione,
             pa.nome as aspirante_nome, pa.cognome as aspirante_cognome
      FROM appuntamenti a
      JOIN sportelli s ON a.sportello_id = s.id
      JOIN utenti u ON a.utente_id = u.id
      LEFT JOIN profili_impresa pi ON u.id = pi.utente_id
      LEFT JOIN profili_aspirante pa ON u.id = pa.utente_id
      WHERE date(a.data_ora) >= date(?)
      ORDER BY a.data_ora ASC
      LIMIT 10
    `, [todayStr]);

    res.json({
      totali: {
        totalUsers,
        impreseCount,
        aspirantiCount,
        apptsTotal,
        apptsPrenotati,
        apptsSvolti,
        apptsAnnullati,
        apptsNoShow,
        positiveFollowup,
        followUpRatePercent,
        kpiTarget: 10
      },
      sportelliStats,
      bisogniStats,
      categoryStats: bisogniStats,
      ris3Stats,
      canaliStats,
      todayTomorrowAppts,
      todayAppts: todayTomorrowAppts
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint manutenzione CRM: rimozione sicura dei dati di prova dal database
app.post('/api/crm/maintenance/purge-test-data', (req, res) => {
  try {
    const result = purgeSampleTestData();
    res.json({ success: true, message: 'Dati di prova rimossi con successo dal database SQLite.', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  await getDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sportello Imprese server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
