import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

const DB_FILE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'sportello.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Error reading existing sportello.db, creating fresh:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    fs.writeFileSync(DB_FILE_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Failed to persist sportello.db:', err);
  }
}

// Helper to run query with params safely and return objects
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  const res = dbInstance.exec("SELECT last_insert_rowid() as id, changes() as ch");
  const lastInsertRowid = res.length && res[0].values.length ? (res[0].values[0][0] as number) : 0;
  const changes = res.length && res[0].values.length ? (res[0].values[0][1] as number) : 0;
  saveDb();
  return { lastInsertRowid, changes };
}

function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS sportelli (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comune TEXT NOT NULL,
      nome TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      telefono TEXT DEFAULT '0874 011011',
      email TEXT DEFAULT 'sportelloimprese@sviluppoitaliamolise.it',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      giorni TEXT NOT NULL,
      orario TEXT NOT NULL,
      cadenza TEXT NOT NULL,
      attivo INTEGER DEFAULT 1,
      operatori_assegnati TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS utenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      telefono TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('IMPRESA', 'ASPIRANTE')),
      data_creazione TEXT NOT NULL,
      ultimo_accesso TEXT NOT NULL,
      canale_accesso TEXT DEFAULT 'Sito Web',
      note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS profili_impresa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL UNIQUE,
      denominazione TEXT NOT NULL,
      partita_iva TEXT NOT NULL,
      nome_referente TEXT NOT NULL,
      cognome_referente TEXT NOT NULL,
      ruolo TEXT NOT NULL,
      comune_sede TEXT NOT NULL,
      ateco_codice TEXT DEFAULT '',
      ateco_area TEXT DEFAULT '',
      dimensione TEXT DEFAULT '',
      fase_vita TEXT DEFAULT '',
      grado_innovazione INTEGER DEFAULT 3,
      uso_ai INTEGER DEFAULT 1,
      criticita_rilevate TEXT DEFAULT '',
      strumenti_suggeriti TEXT DEFAULT '',
      FOREIGN KEY(utente_id) REFERENCES utenti(id)
    );

    CREATE TABLE IF NOT EXISTS profili_aspirante (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      comune_residenza TEXT NOT NULL,
      stato_idea TEXT DEFAULT '',
      settore_interesse TEXT DEFAULT '',
      condizione_attuale TEXT DEFAULT '',
      fascia_eta TEXT DEFAULT '',
      ha_partita_iva TEXT DEFAULT 'No',
      FOREIGN KEY(utente_id) REFERENCES utenti(id)
    );

    CREATE TABLE IF NOT EXISTS consensi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      accettato INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      ip TEXT DEFAULT '127.0.0.1',
      user_agent TEXT DEFAULT '',
      FOREIGN KEY(utente_id) REFERENCES utenti(id)
    );

    CREATE TABLE IF NOT EXISTS appuntamenti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice TEXT NOT NULL UNIQUE,
      utente_id INTEGER NOT NULL,
      sportello_id INTEGER NOT NULL,
      data_ora TEXT NOT NULL,
      durata_minuti INTEGER DEFAULT 30,
      modalita TEXT NOT NULL CHECK(modalita IN ('PRESENZA', 'VIDEOCALL')),
      videocall_link TEXT DEFAULT '',
      stato TEXT NOT NULL CHECK(stato IN ('RICHIESTO', 'CONFERMATO', 'SVOLTO', 'NOSHOW', 'FOLLOWUP', 'CHIUSO_POSITIVO', 'CHIUSO_NEGATIVO', 'ANNULLATO')),
      motivo_testo TEXT NOT NULL,
      categoria_bisogno TEXT NOT NULL,
      token_modifica TEXT NOT NULL UNIQUE,
      creato_il TEXT NOT NULL,
      note_operatore TEXT DEFAULT '',
      followup_date TEXT DEFAULT '',
      followup_esito TEXT DEFAULT '',
      FOREIGN KEY(utente_id) REFERENCES utenti(id),
      FOREIGN KEY(sportello_id) REFERENCES sportelli(id)
    );

    CREATE TABLE IF NOT EXISTS interazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id INTEGER NOT NULL,
      appuntamento_id INTEGER,
      sportello_id INTEGER NOT NULL,
      operatore_nome TEXT NOT NULL,
      data_ora TEXT NOT NULL,
      canale TEXT NOT NULL CHECK(canale IN ('SPORTELLO', 'TELEFONO', 'WHATSAPP', 'VIDEOCALL', 'EVENTO', 'HACKATHON')),
      tipologia_richiesta TEXT NOT NULL,
      bandi_trattati TEXT DEFAULT '',
      esito TEXT NOT NULL,
      stato_followup TEXT DEFAULT 'PROGRAMMATO',
      data_prossimo_ricontatto TEXT DEFAULT '',
      note TEXT DEFAULT '',
      FOREIGN KEY(utente_id) REFERENCES utenti(id)
    );

    CREATE TABLE IF NOT EXISTS bandi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      ente TEXT NOT NULL,
      livello TEXT NOT NULL CHECK(livello IN ('REGIONALE', 'NAZIONALE', 'EUROPEO')),
      area_ris3 TEXT NOT NULL,
      beneficiari TEXT NOT NULL,
      scadenza TEXT NOT NULL,
      link TEXT NOT NULL,
      scheda_semplificata TEXT NOT NULL,
      stato TEXT NOT NULL CHECK(stato IN ('ATTIVO', 'CHIUSO')),
      allegati TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS video_webtv (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      url_youtube TEXT NOT NULL,
      youtube_id TEXT NOT NULL,
      rubrica TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      bando_id INTEGER,
      data_pubblicazione TEXT NOT NULL,
      views INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codice TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      comune TEXT DEFAULT '',
      evento TEXT DEFAULT '',
      canale TEXT NOT NULL,
      url TEXT NOT NULL,
      scansioni INTEGER DEFAULT 0,
      creato_il TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS configurazioni (
      chiave TEXT PRIMARY KEY,
      valore TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crm_operatori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT NOT NULL,
      ruolo TEXT NOT NULL,
      sportello_id INTEGER DEFAULT NULL,
      sportello_nome TEXT DEFAULT 'Tutti gli Sportelli',
      attivo INTEGER DEFAULT 1,
      creato_il TEXT NOT NULL,
      ultimo_accesso TEXT DEFAULT NULL,
      note TEXT DEFAULT ''
    );
  `);

  migrateSportelliColumns(db);
  migrateBandiColumns(db);
  seedCrmOperatori(db);
  seedInitialData(db);

  // Rimozione automatica o controllata dei dati fittizi di prova se siamo in produzione o richiesta esplicita
  if (process.env.NODE_ENV === 'production' || process.env.PURGE_SAMPLE_DATA === 'true') {
    purgeSampleTestData(db);
  }
}

function migrateSportelliColumns(db: Database) {
  try {
    const colsRes = db.exec("PRAGMA table_info(sportelli)");
    if (colsRes.length && colsRes[0].values) {
      const colNames = colsRes[0].values.map((v: any[]) => v[1]);
      
      if (!colNames.includes('responsabile_nome')) {
        db.run("ALTER TABLE sportelli ADD COLUMN responsabile_nome TEXT DEFAULT ''");
      }
      if (!colNames.includes('responsabile_email')) {
        db.run("ALTER TABLE sportelli ADD COLUMN responsabile_email TEXT DEFAULT ''");
      }
      if (!colNames.includes('responsabile_telefono')) {
        db.run("ALTER TABLE sportelli ADD COLUMN responsabile_telefono TEXT DEFAULT ''");
      }
      if (!colNames.includes('online_attivo')) {
        db.run("ALTER TABLE sportelli ADD COLUMN online_attivo INTEGER DEFAULT 1");
      }
      if (!colNames.includes('link_videocall')) {
        db.run("ALTER TABLE sportelli ADD COLUMN link_videocall TEXT DEFAULT ''");
      }
      if (!colNames.includes('note_accesso')) {
        db.run("ALTER TABLE sportelli ADD COLUMN note_accesso TEXT DEFAULT ''");
      }
      if (!colNames.includes('provincia')) {
        db.run("ALTER TABLE sportelli ADD COLUMN provincia TEXT DEFAULT ''");
      }

      // Populate intelligent defaults for existing records
      db.run(`
        UPDATE sportelli SET 
          provincia = CASE 
            WHEN comune LIKE '%Isernia%' OR comune LIKE '%Venafro%' OR comune LIKE '%Agnone%' OR comune LIKE '%Frosolone%' OR comune LIKE '%Fornelli%' THEN 'IS'
            ELSE 'CB'
          END
        WHERE provincia IS NULL OR provincia = '';
      `);

      db.run(`
        UPDATE sportelli SET online_attivo = 1 WHERE online_attivo IS NULL;
      `);

      db.run(`
        UPDATE sportelli SET 
          responsabile_nome = CASE
            WHEN comune LIKE '%Campobasso%' THEN 'Dott. Marco Rossi'
            WHEN comune LIKE '%Termoli%' THEN 'Dott. Paolo Bianchi'
            WHEN comune LIKE '%Isernia%' THEN 'Dott.ssa Anna Moretti'
            WHEN comune LIKE '%Venafro%' THEN 'Dott. Luca Ferrara'
            WHEN comune LIKE '%Agnone%' THEN 'Dott.ssa Giulia De Angelis'
            WHEN comune LIKE '%Campochiaro%' THEN 'Ing. Roberto Santoro'
            WHEN comune LIKE '%Riccia%' THEN 'Dott. Marco Rossi'
            WHEN comune LIKE '%Santa Croce%' THEN 'Dott. Paolo Bianchi'
            WHEN comune LIKE '%Montenero%' THEN 'Dott. Paolo Bianchi'
            WHEN comune LIKE '%Trivento%' THEN 'Dott.ssa Elena Conti'
            WHEN comune LIKE '%Frosolone%' THEN 'Dott.ssa Anna Moretti'
            WHEN comune LIKE '%Fornelli%' THEN 'Dott. Luca Ferrara'
            ELSE 'Responsabile Territoriale SIM'
          END
        WHERE responsabile_nome IS NULL OR responsabile_nome = '';
      `);

      db.run(`
        UPDATE sportelli SET
          responsabile_email = 'sportelloimprese@sviluppoitaliamolise.it'
        WHERE responsabile_email IS NULL OR responsabile_email = '';
      `);

      db.run(`
        UPDATE sportelli SET
          link_videocall = 'https://meet.jit.si/SportelloImpreseMolise_' || id
        WHERE link_videocall IS NULL OR link_videocall = '';
      `);

      saveDb();
    }
  } catch (e) {
    console.warn('Sportelli migration warning:', e);
  }
}

function migrateBandiColumns(db: Database) {
  try {
    const colsRes = db.exec("PRAGMA table_info(bandi)");
    if (colsRes.length && colsRes[0].values) {
      const colNames = colsRes[0].values.map((v: any[]) => v[1]);
      if (!colNames.includes('allegati')) {
        db.run("ALTER TABLE bandi ADD COLUMN allegati TEXT DEFAULT '[]'");
        
        // Add sample official attachments to existing default bandi
        db.run(`
          UPDATE bandi SET allegati = json_array(
            json_object('id', 'att-b1-1', 'nome', 'Avviso_Pubblico_Transizione_5_0.pdf', 'dimensione', '1.8 MB', 'tipo', 'application/pdf', 'data_caricamento', '2026-08-10'),
            json_object('id', 'att-b1-2', 'nome', 'Formulario_Domanda_Allegato_A.docx', 'dimensione', '420 KB', 'tipo', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'data_caricamento', '2026-08-10'),
            json_object('id', 'att-b1-3', 'nome', 'Guida_Spese_Ammissibili_FESR.pdf', 'dimensione', '950 KB', 'tipo', 'application/pdf', 'data_caricamento', '2026-08-11')
          ) WHERE id = 1 AND (allegati IS NULL OR allegati = '[]' OR allegati = '');
        `);

        db.run(`
          UPDATE bandi SET allegati = json_array(
            json_object('id', 'att-b2-1', 'nome', 'Bando_Nuova_Impresa_Molise.pdf', 'dimensione', '1.2 MB', 'tipo', 'application/pdf', 'data_caricamento', '2026-07-20'),
            json_object('id', 'att-b2-2', 'nome', 'Modello_Business_Plan_Semplicato.xlsx', 'dimensione', '510 KB', 'tipo', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data_caricamento', '2026-07-20')
          ) WHERE id = 2 AND (allegati IS NULL OR allegati = '[]' OR allegati = '');
        `);

        db.run(`
          UPDATE bandi SET allegati = json_array(
            json_object('id', 'att-b3-1', 'nome', 'Disciplinare_Filiera_Agrifood.pdf', 'dimensione', '2.1 MB', 'tipo', 'application/pdf', 'data_caricamento', '2026-08-01')
          ) WHERE id = 3 AND (allegati IS NULL OR allegati = '[]' OR allegati = '');
        `);

        saveDb();
      }
    }
  } catch (e) {
    console.warn('Bandi migration warning:', e);
  }
}

function seedCrmOperatori(db: Database) {
  try {
    const check = db.exec("SELECT COUNT(*) FROM crm_operatori");
    if (check.length && check[0].values.length && (check[0].values[0][0] as number) > 0) {
      // Table already populated, just ensure admin has ADMIN role
      db.run("UPDATE crm_operatori SET ruolo = 'ADMIN' WHERE username = 'admin' AND ruolo = 'COORDINATORE'");
      saveDb();
      return;
    }

    db.run(`
      INSERT OR IGNORE INTO crm_operatori (id, username, password, nome, cognome, email, ruolo, sportello_id, sportello_nome, attivo, creato_il, note)
      VALUES 
        (1, 'admin', 'molise2027', 'Marco', 'Rossi', 'm.rossi@sviluppoitaliamolise.it', 'ADMIN', NULL, 'Tutti gli Sportelli (Sede Centrale)', 1, '2026-08-01 09:00:00', 'Account Amministratore di Sistema CRM'),
        (2, 'operatore.cb', 'sportello.cb', 'Chiara', 'Mancini', 'c.mancini@sviluppoitaliamolise.it', 'OPERATORE', 1, 'Campobasso - Sede SIM', 1, '2026-08-01 09:30:00', 'Operatore presidio Campobasso'),
        (3, 'operatore.is', 'sportello.is', 'Luca', 'Colalillo', 'l.colalillo@sviluppoitaliamolise.it', 'OPERATORE', 2, 'Isernia - Centro Sviluppo', 1, '2026-08-01 10:00:00', 'Operatore presidio Isernia'),
        (4, 'contact.center', 'contact2027', 'Elena', 'Pagano', 'contact@sviluppoitaliamolise.it', 'CONTACT_CENTER', NULL, 'Contact Center Regionale', 1, '2026-08-01 10:30:00', 'Operatore canale telefonico e chat'),
        (5, 'comunicazione', 'webtv2027', 'Andrea', 'Valente', 'comunicazione@sviluppoitaliamolise.it', 'COMUNICAZIONE', NULL, 'Ufficio Comunicazione & Web TV', 1, '2026-08-01 11:00:00', 'Gestione pillole Web TV e QR code'),
        (6, 'regione.molise', 'regione2027', 'Antonio', 'Di Iorio', 'sviluppoeconomico@regione.molise.it', 'ENTE', NULL, 'Regione Molise - Assessorato', 1, '2026-08-01 11:30:00', 'Accesso Ente Promotore e monitoraggio KPI'),
        (7, 'coordinatore', 'coord2027', 'Valeria', 'D''Amico', 'v.damico@sviluppoitaliamolise.it', 'COORDINATORE', NULL, 'Coordinamento Generale (12 Sportelli)', 1, '2026-08-01 08:30:00', 'Coordinatore Generale Rete Sportelli Territoriali');
    `);
    saveDb();
  } catch (err) {
    console.error('Error seeding crm_operatori:', err);
  }
}

function seedInitialData(db: Database) {
  // Check if sportelli already populated
  const check = db.exec("SELECT COUNT(*) FROM sportelli");
  if (check.length && check[0].values.length && (check[0].values[0][0] as number) > 0) {
    return;
  }

  // 12 Sportelli from Page 7
  const sportelli = [
    { comune: "Campobasso (sede SIM)", nome: "Sede Centrale Sviluppo Italia Molise", indirizzo: "Via Vico 4, 86100 Campobasso (CB)", lat: 41.5603, lng: 14.6627, giorni: "Lunedì, Mercoledì, Venerdì", orario: "09:30 - 12:00", cadenza: "Settimanale (3 gg)", operatori: "Dott. Marco Rossi, Dott.ssa Elena Conti" },
    { comune: "Termoli", nome: "Sportello Territoriale di Termoli", indirizzo: "Piazza Sant'Antonio 1, 86039 Termoli (CB)", lat: 42.0006, lng: 14.9946, giorni: "Mercoledì", orario: "09:30 - 12:00", cadenza: "Settimanale", operatori: "Dott. Paolo Bianchi" },
    { comune: "Isernia", nome: "Sportello Territoriale di Isernia", indirizzo: "Piazza San Francesco 2, 86170 Isernia (IS)", lat: 41.5960, lng: 14.2306, giorni: "Giovedì", orario: "09:30 - 12:00", cadenza: "Settimanale", operatori: "Dott.ssa Anna Moretti" },
    { comune: "Venafro", nome: "Sportello Territoriale di Venafro", indirizzo: "Piazza Cavour 8, 86079 Venafro (IS)", lat: 41.4850, lng: 14.0450, giorni: "Martedì", orario: "15:00 - 17:00", cadenza: "Settimanale", operatori: "Dott. Luca Ferrara" },
    { comune: "Agnone", nome: "Sportello Territoriale Alto Molise - Agnone", indirizzo: "Salita San Pietro 5, 86081 Agnone (IS)", lat: 41.8083, lng: 14.3778, giorni: "Martedì", orario: "09:30 - 12:00", cadenza: "Settimanale", operatori: "Dott.ssa Giulia De Angelis" },
    { comune: "Campochiaro (Incubatore)", nome: "Incubatore Regionale delle Imprese", indirizzo: "Zona Industriale Campochiaro, 86020 Campochiaro (CB)", lat: 41.4500, lng: 14.5167, giorni: "Mercoledì", orario: "09:30 - 12:00", cadenza: "Settimanale", operatori: "Ing. Roberto Santoro" },
    { comune: "Riccia", nome: "Sportello Territoriale Fortore - Riccia", indirizzo: "Corso Garibaldi 42, 86016 Riccia (CB)", lat: 41.4833, lng: 14.8333, giorni: "Venerdì", orario: "09:30 - 12:00", cadenza: "Quindicinale", operatori: "Dott. Marco Rossi" },
    { comune: "Santa Croce di Magliano", nome: "Sportello Basso Molise Interno", indirizzo: "Via Municipio 12, 86047 Santa Croce di Magliano (CB)", lat: 41.7128, lng: 14.9906, giorni: "Martedì", orario: "15:00 - 17:00", cadenza: "Quindicinale", operatori: "Dott. Paolo Bianchi" },
    { comune: "Montenero di Bisaccia", nome: "Sportello Costa Nord - Montenero", indirizzo: "Piazza della Libertà 3, 86036 Montenero di Bisaccia (CB)", lat: 41.9500, lng: 14.7833, giorni: "Mercoledì", orario: "15:30 - 17:00", cadenza: "Quindicinale", operatori: "Dott. Paolo Bianchi" },
    { comune: "Trivento", nome: "Sportello Valle del Trigno - Trivento", indirizzo: "Centro Polifunzionale, Corso Beniamino Mastroiacovo, 86029 Trivento (CB)", lat: 41.7833, lng: 14.5500, giorni: "Lunedì", orario: "15:00 - 17:00", cadenza: "Quindicinale", operatori: "Dott.ssa Elena Conti" },
    { comune: "Frosolone", nome: "Sportello Montagnola Molisana - Frosolone", indirizzo: "Corso Vittorio Emanuele 18, 86098 Frosolone (IS)", lat: 41.6000, lng: 14.4500, giorni: "Lunedì", orario: "09:30 - 12:00", cadenza: "Quindicinale", operatori: "Dott.ssa Anna Moretti" },
    { comune: "Fornelli", nome: "Sportello Valle del Volturno - Fornelli", indirizzo: "Via Roma 4, 86070 Fornelli (IS)", lat: 41.6056, lng: 14.1417, giorni: "Giovedì", orario: "15:00 - 17:00", cadenza: "Quindicinale", operatori: "Dott. Luca Ferrara" }
  ];

  for (const s of sportelli) {
    db.run(`
      INSERT INTO sportelli (comune, nome, indirizzo, lat, lng, giorni, orario, cadenza, operatori_assegnati)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [s.comune, s.nome, s.indirizzo, s.lat, s.lng, s.giorni, s.orario, s.cadenza, s.operatori]);
  }

  // Bandi
  const bandi = [
    {
      titolo: "Voucher Digitalizzazione e Transizione 5.0 Molise",
      ente: "Regione Molise - PR FESR FSE+ 2021-2027",
      livello: "REGIONALE",
      area_ris3: "ICT",
      beneficiari: "Micro, Piccole e Medie Imprese attive in Molise",
      scadenza: "2026-11-30",
      link: "https://www.sviluppoitaliamolise.it/bandi/transizione-5-0",
      scheda_semplificata: "Contributo a fondo perduto fino al 70% (max 30.000€) per investimenti in software gestionali, e-commerce b2b/b2c, cloud computing, intelligenza artificiale e cybersecurity per le PMI del Molise."
    },
    {
      titolo: "Fondo Nuova Impresa e Autoimprenditorialità Giovani e Donne",
      ente: "Sviluppo Italia Molise - Azione 1.4.2",
      livello: "REGIONALE",
      area_ris3: "Tecnologie per la transizione",
      beneficiari: "Aspiranti imprenditori, disoccupati, under 35 e donne",
      scadenza: "2026-12-15",
      link: "https://www.sviluppoitaliamolise.it/bandi/nuova-impresa",
      scheda_semplificata: "Finanziamento agevolato a tasso zero combinato con fondo perduto fino a 40.000€ per l'avvio di nuove imprese sul territorio regionale, con affiancamento tutor gratuito."
    },
    {
      titolo: "Sostegno alle Filiere Agrifood di Qualità e Tipicità",
      ente: "Regione Molise - Assessorato Agricoltura e FESR",
      livello: "REGIONALE",
      area_ris3: "Agrifood",
      beneficiari: "Aziende agricole, trasformatori agroalimentari, consorzi DOP/IGP",
      scadenza: "2026-10-31",
      link: "https://www.sviluppoitaliamolise.it/bandi/agrifood-qualita",
      scheda_semplificata: "Incentivi per ammodernamento impianti, certificazioni biologiche, tracciabilità blockchain e promozione dell'eccellenza alimentare molisana nei mercati internazionali."
    },
    {
      titolo: "Bando Valorizzazione Borghi, Turismo Esperienziale e Cultura",
      ente: "Regione Molise / Ministero della Cultura",
      livello: "REGIONALE",
      area_ris3: "Industrie culturali, turistiche e creative",
      beneficiari: "PMI del turismo, ospitalità diffusa, guide, cooperative di comunità",
      scadenza: "2026-12-31",
      link: "https://www.sviluppoitaliamolise.it/bandi/turismo-esperienziale",
      scheda_semplificata: "Contributi fino a 50.000€ per la creazione di nuovi itinerari naturalistici, alberghi diffusi, festival identitari e servizi turistici digitali nelle aree interne."
    },
    {
      titolo: "Smart&Start Italia - Startup Innovative Molise",
      ente: "Invitalia / Ministero delle Imprese e del Made in Italy",
      livello: "NAZIONALE",
      area_ris3: "ICT",
      beneficiari: "Startup innovative costituite da non più di 60 mesi",
      scadenza: "2026-12-31",
      link: "https://www.invitalia.it/smart-and-start",
      scheda_semplificata: "Mutuo a tasso zero fino all'80% delle spese ammissibili (fino a 1,5M€) con quota a fondo perduto fino al 30% per progetti ad alto valore tecnologico nel Mezzogiorno."
    },
    {
      titolo: "Fondo di Garanzia e Microcredito Regionale Molise",
      ente: "Regione Molise - SIM",
      livello: "REGIONALE",
      area_ris3: "Tecnologie per la transizione",
      beneficiari: "Piccole imprese, ditte individuali, liberi professionisti",
      scadenza: "2026-12-31",
      link: "https://www.sviluppoitaliamolise.it/microcredito",
      scheda_semplificata: "Garanzia pubblica fino all'80% e finanziamenti diretti fino a 25.000€ per esigenze di liquidità, scorte e piccoli investimenti senza garanzie reali personali."
    }
  ];

  for (const b of bandi) {
    db.run(`
      INSERT INTO bandi (titolo, ente, livello, area_ris3, beneficiari, scadenza, link, scheda_semplificata, stato)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATTIVO')
    `, [b.titolo, b.ente, b.livello, b.area_ris3, b.beneficiari, b.scadenza, b.link, b.scheda_semplificata]);
  }

  // Web TV Videos (Page 12)
  const videos = [
    {
      titolo: "Storie d'impresa: Dal formaggio tradizionale all'e-commerce europeo",
      url_youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtube_id: "dQw4w9WgXcQ",
      rubrica: "Storie d'impresa",
      descrizione: "Intervista a Michele Di Nunzio, Caseificio dell'Alto Molise: 'L'ho fatto io. Ora tocca a te. Con il voucher digitalizzazione di Sviluppo Italia abbiamo aperto l'export in Germania e Francia'.",
      bando_id: 1,
      pubblicato_il: "2026-08-20",
      views: 342
    },
    {
      titolo: "Pillole sui bandi: Come preparare la domanda per il Voucher 5.0",
      url_youtube: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      youtube_id: "ScMzIvxBSi4",
      rubrica: "Pillole sui bandi",
      descrizione: "La guida semplice e pratica dell'esperto SIM per non commettere errori nell'invio telematico del bando transizione digitale.",
      bando_id: 1,
      pubblicato_il: "2026-08-26",
      views: 512
    },
    {
      titolo: "Scadenze della settimana: I bandi attivi a Settembre 2026",
      url_youtube: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
      youtube_id: "3JZ_D3ELwOQ",
      rubrica: "Scadenze della settimana",
      descrizione: "Riepilogo delle finestre di presentazione per il turismo nei borghi e l'autoimprenditorialità giovanile.",
      bando_id: 2,
      pubblicato_il: "2026-09-01",
      views: 198
    },
    {
      titolo: "Protagonisti del Molise: Termoli Innovation Hub",
      url_youtube: "https://www.youtube.com/watch?v=L_LUpnjgPso",
      youtube_id: "L_LUpnjgPso",
      rubrica: "Protagonisti del Molise",
      descrizione: "Viaggio all'interno delle nuove realtà tecnologiche costiere nate grazie al supporto di Sviluppo Italia Molise.",
      bando_id: 5,
      pubblicato_il: "2026-08-15",
      views: 420
    }
  ];

  for (const v of videos) {
    db.run(`
      INSERT INTO video_webtv (titolo, url_youtube, youtube_id, rubrica, descrizione, bando_id, data_pubblicazione, views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [v.titolo, v.url_youtube, v.youtube_id, v.rubrica, v.descrizione, v.bando_id, v.pubblicato_il, v.views]);
  }

  // QR Codes initial catalog (Page 11 & 12)
  const qrCodes = [
    { codice: "QR-CAMP-001", label: "Manifesto Ufficiale Campobasso Centro", comune: "Campobasso", evento: "Affissione Urbana 2026", canale: "Manifesto", url: "https://sviluppoitaliamolise.it/sportello?src=qr&comune=Campobasso", scansioni: 142 },
    { codice: "QR-TERM-002", label: "Comune di Termoli - Ufficio URP", comune: "Termoli", evento: "Sede Comunale", canale: "Sede Comunale", url: "https://sviluppoitaliamolise.it/sportello?src=qr&comune=Termoli", scansioni: 89 },
    { codice: "QR-ISER-003", label: "Polo Civico Isernia", comune: "Isernia", evento: "Spazio Pubblico", canale: "Spazio Pubblico", url: "https://sviluppoitaliamolise.it/sportello?src=qr&comune=Isernia", scansioni: 67 },
    { codice: "QR-WEBTV-004", label: "Web TV La Bottega delle Opportunità", comune: "", evento: "Web TV", canale: "Web TV", url: "https://sviluppoitaliamolise.it/sportello?src=webtv", scansioni: 215 }
  ];

  for (const q of qrCodes) {
    db.run(`
      INSERT INTO qr_codes (codice, label, comune, evento, canale, url, scansioni, creato_il)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [q.codice, q.label, q.comune, q.evento, q.canale, q.url, q.scansioni]);
  }

  // I dati di prova vengono inseriti SOLO se esplicitamente abilitati in locale con SEED_SAMPLE_DATA=true e MAI in produzione
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_SAMPLE_DATA === 'true') {
    seedSampleCrmData(db);
  }
}

export function purgeSampleTestData(db?: Database): { removedAppts: number; removedUsers: number } {
  const targetDb = db || dbInstance;
  if (!targetDb) return { removedAppts: 0, removedUsers: 0 };

  try {
    // Rimuove interazioni collegate ad appuntamenti o utenti di test
    targetDb.run(`
      DELETE FROM interazioni WHERE appuntamento_id IN (
        SELECT id FROM appuntamenti WHERE codice IN ('SI-2026-000101', 'SI-2026-000102', 'SI-2026-000085')
      ) OR utente_id IN (
        SELECT id FROM utenti WHERE email IN ('info@molisetech.it', 'chiara.marini@email.it', 'direzione@agricolasamnium.it')
      )
    `);

    // Rimuove appuntamenti di test
    targetDb.run(`
      DELETE FROM appuntamenti WHERE codice IN ('SI-2026-000101', 'SI-2026-000102', 'SI-2026-000085')
    `);

    // Rimuove profili e consensi di test
    targetDb.run(`
      DELETE FROM profili_impresa WHERE utente_id IN (
        SELECT id FROM utenti WHERE email IN ('info@molisetech.it', 'direzione@agricolasamnium.it')
      )
    `);
    targetDb.run(`
      DELETE FROM profili_aspirante WHERE utente_id IN (
        SELECT id FROM utenti WHERE email IN ('chiara.marini@email.it')
      )
    `);
    targetDb.run(`
      DELETE FROM consensi WHERE utente_id IN (
        SELECT id FROM utenti WHERE email IN ('info@molisetech.it', 'chiara.marini@email.it', 'direzione@agricolasamnium.it')
      )
    `);

    // Rimuove gli utenti di test
    targetDb.run(`
      DELETE FROM utenti WHERE email IN ('info@molisetech.it', 'chiara.marini@email.it', 'direzione@agricolasamnium.it')
    `);

    saveDb();
    console.log('[Database] Pulizia completata: nessun dato di prova presente nel database.');
    return { removedAppts: 3, removedUsers: 3 };
  } catch (err) {
    console.error('Errore durante la pulizia dei dati di prova:', err);
    return { removedAppts: 0, removedUsers: 0 };
  }
}

function seedSampleCrmData(db: Database) {
  // CRITICO: Non inserire MAI dati di prova in produzione (quando si pubblica sul server Ubuntu)
  if (process.env.NODE_ENV === 'production' || process.env.SEED_SAMPLE_DATA !== 'true') {
    return;
  }

  // Insert initial enterprise user
  db.run(`
    INSERT INTO utenti (id, email, telefono, tipo, data_creazione, ultimo_accesso, canale_accesso)
    VALUES (1, 'info@molisetech.it', '+39 340 1234567', 'IMPRESA', '2026-09-01 10:15:00', '2026-09-01 10:15:00', 'QR Code Campobasso')
  `);
  db.run(`
    INSERT INTO profili_impresa (utente_id, denominazione, partita_iva, nome_referente, cognome_referente, ruolo, comune_sede, ateco_codice, ateco_area, dimensione, fase_vita, grado_innovazione, uso_ai, criticita_rilevate, strumenti_suggeriti)
    VALUES (1, 'Molise Tech Solutions S.r.l.', '01894560702', 'Giovanni', 'Valente', 'Amministratore', 'Campobasso', '62.01.00', 'ICT', 'Piccola (10-49)', 'In crescita', 4, 3, 'Necessità di reperire sviluppatori specializzati e investire in server GPU', 'Voucher Transizione 5.0 e Smart&Start')
  `);
  db.run(`
    INSERT INTO consensi (utente_id, tipo, accettato, timestamp)
    VALUES (1, 'PRIVACY', 1, '2026-09-01 10:15:00'), (1, 'NEWSLETTER', 1, '2026-09-01 10:15:00'), (1, 'GEOLOCALIZZAZIONE', 1, '2026-09-01 10:15:00')
  `);

  // Insert initial aspirante user
  db.run(`
    INSERT INTO utenti (id, email, telefono, tipo, data_creazione, ultimo_accesso, canale_accesso)
    VALUES (2, 'chiara.marini@email.it', '+39 333 9876543', 'ASPIRANTE', '2026-09-01 11:30:00', '2026-09-01 11:30:00', 'Sito Web')
  `);
  db.run(`
    INSERT INTO profili_aspirante (utente_id, nome, cognome, comune_residenza, stato_idea, settore_interesse, condizione_attuale, fascia_eta, ha_partita_iva)
    VALUES (2, 'Chiara', 'Marini', 'Termoli', 'Ho un progetto scritto', 'Industrie culturali, turistiche e creative', 'Occupato', '30-40', 'No')
  `);
  db.run(`
    INSERT INTO consensi (utente_id, tipo, accettato, timestamp)
    VALUES (2, 'PRIVACY', 1, '2026-09-01 11:30:00'), (2, 'NEWSLETTER', 1, '2026-09-01 11:30:00')
  `);

  // Third user: Agricola Samnium
  db.run(`
    INSERT INTO utenti (id, email, telefono, tipo, data_creazione, ultimo_accesso, canale_accesso)
    VALUES (3, 'direzione@agricolasamnium.it', '+39 328 4455667', 'IMPRESA', '2026-08-25 09:00:00', '2026-08-25 09:00:00', 'Contact Center')
  `);
  db.run(`
    INSERT INTO profili_impresa (utente_id, denominazione, partita_iva, nome_referente, cognome_referente, ruolo, comune_sede, ateco_codice, ateco_area, dimensione, fase_vita, grado_innovazione, uso_ai, criticita_rilevate, strumenti_suggeriti)
    VALUES (3, 'Azienda Agricola Samnium Bio', '01456780709', 'Antonio', 'D''Amico', 'Titolare', 'Bojano', '01.11.00', 'Agrifood', 'Micro (fino a 9 addetti)', 'Consolidata', 3, 1, 'Costi elevati per certificazione biologica e packaging compostabile', 'Bando Filiere Agrifood')
  `);
  db.run(`
    INSERT INTO consensi (utente_id, tipo, accettato, timestamp)
    VALUES (3, 'PRIVACY', 1, '2026-08-25 09:00:00')
  `);

  // Insert appointments
  db.run(`
    INSERT INTO appuntamenti (codice, utente_id, sportello_id, data_ora, durata_minuti, modalita, videocall_link, stato, motivo_testo, categoria_bisogno, token_modifica, creato_il, note_operatore)
    VALUES ('SI-2026-000101', 1, 1, '2026-09-07 10:00:00', 30, 'PRESENZA', '', 'CONFERMATO', 'Vorremmo accedere al voucher per la digitalizzazione delle nostre procedure interne e assunzione di 2 programmatori.', 'Bandi e finanziamenti', 'token-abc-101', '2026-09-01 10:15:00', 'Referente molto preparato, portare visura aggiornata.')
  `);

  db.run(`
    INSERT INTO appuntamenti (codice, utente_id, sportello_id, data_ora, durata_minuti, modalita, videocall_link, stato, motivo_testo, categoria_bisogno, token_modifica, creato_il, note_operatore)
    VALUES ('SI-2026-000102', 2, 2, '2026-09-09 10:30:00', 30, 'VIDEOCALL', 'https://meet.jit.si/SportelloImpreseMolise-SI-2026-000102', 'CONFERMATO', 'Progetto di avvio di una guida multimediale ed esperienziale per il turismo dei borghi costieri e dell''entroterra.', 'Avvio di una nuova impresa / apertura Partita IVA', 'token-def-102', '2026-09-01 11:30:00', 'Inviare link videocall')
  `);

  db.run(`
    INSERT INTO appuntamenti (codice, utente_id, sportello_id, data_ora, durata_minuti, modalita, videocall_link, stato, motivo_testo, categoria_bisogno, token_modifica, creato_il, note_operatore, followup_date, followup_esito)
    VALUES ('SI-2026-000085', 3, 1, '2026-08-28 09:30:00', 30, 'PRESENZA', '', 'CHIUSO_POSITIVO', 'Consulenza su bandi per transizione green in agricoltura.', 'Innovazione e digitalizzazione', 'token-ghi-085', '2026-08-25 09:00:00', 'Colloquio completato con successo. Ha presentato domanda su bando Agrifood.', '2026-09-28', 'Accesso a bando confermato')
  `);

  // Insert interactions
  db.run(`
    INSERT INTO interazioni (utente_id, appuntamento_id, sportello_id, operatore_nome, data_ora, canale, tipologia_richiesta, bandi_trattati, esito, stato_followup, data_prossimo_ricontatto, note)
    VALUES (3, 3, 1, 'Dott. Marco Rossi', '2026-08-28 10:00:00', 'SPORTELLO', 'Richiesta agevolazioni filiere agroalimentari', 'Bando Sostegno Filiere Agrifood', 'DOMANDA_PRESENTATA', 'COMPLETATO', '2026-09-28', 'Impresa assistita nella predisposizione documentale.')
  `);

  db.run(`
    INSERT INTO interazioni (utente_id, sportello_id, operatore_nome, data_ora, canale, tipologia_richiesta, bandi_trattati, esito, stato_followup, data_prossimo_ricontatto, note)
    VALUES (2, 2, 'Dott. Paolo Bianchi', '2026-09-01 11:35:00', 'TELEFONO', 'Informazioni preliminari su bando autoimprenditorialità', 'Fondo Nuova Impresa', 'INFORMATIVA_FORNITA', 'PROGRAMMATO', '2026-09-09', 'Chiariti requisiti under 35, confermato appuntamento.')
  `);
}
