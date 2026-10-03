import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type Database from 'better-sqlite3';

export interface VisitRecord {
  id?: number;
  visitatore_hash: string;
  ip_anonymized: string;
  data_ora: string;
  data: string;
  ora: string;
  user_agent: string;
  device: string;
  browser: string;
  os: string;
  pagina: string;
  referente: string;
  canale: string;
  is_unique_today: number;
}

export interface DailyStats {
  data: string;
  visite_totali: number;
  visitatori_unici: number;
  visite_mobile: number;
  visite_desktop: number;
  pagine_viste: number;
  aggiornato_il: string;
}

const BACKUP_FILE = path.resolve(process.cwd(), 'server', 'visitor_stats_backup.json');

/**
 * Inizializza in modo 100% NON INVASIVO le tabelle per le statistiche visitatori.
 * Non tocca alcuna tabella esistente (appuntamenti, utenti, ecc.).
 */
export function initVisitorTables(db: Database.Database): void {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS visitatori_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitatore_hash TEXT NOT NULL,
        ip_anonymized TEXT DEFAULT '',
        data_ora TEXT NOT NULL,
        data TEXT NOT NULL,
        ora TEXT NOT NULL,
        user_agent TEXT DEFAULT '',
        device TEXT DEFAULT 'Desktop',
        browser TEXT DEFAULT '',
        os TEXT DEFAULT '',
        pagina TEXT DEFAULT '/',
        referente TEXT DEFAULT '',
        canale TEXT DEFAULT 'Diretto',
        is_unique_today INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS visitatori_giornalieri (
        data TEXT PRIMARY KEY,
        visite_totali INTEGER DEFAULT 0,
        visitatori_unici INTEGER DEFAULT 0,
        visite_mobile INTEGER DEFAULT 0,
        visite_desktop INTEGER DEFAULT 0,
        pagine_viste INTEGER DEFAULT 0,
        aggiornato_il TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_visitatori_log_data ON visitatori_log(data);
      CREATE INDEX IF NOT EXISTS idx_visitatori_log_hash_data ON visitatori_log(visitatore_hash, data);
    `);
  } catch (err: any) {
    console.error('[VisitorTracker] Errore inizializzazione tabelle visitatori:', err.message);
  }
}

/**
 * Azzera completamente tutte le statistiche e il registro accessi dei visitatori
 */
export function resetVisitorStats(db: Database.Database): { success: boolean; message: string } {
  try {
    db.exec(`
      DELETE FROM visitatori_log;
      DELETE FROM visitatori_giornalieri;
    `);
    if (fs.existsSync(BACKUP_FILE)) {
      try {
        fs.unlinkSync(BACKUP_FILE);
      } catch (e) {
        // ignore
      }
    }
    console.log('[VisitorTracker] Statistiche visitatori azzerate con successo.');
    return { success: true, message: 'Statistiche visitatori azzerate con successo' };
  } catch (err: any) {
    console.error('[VisitorTracker] Errore azzeramento statistiche:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Anonimizza l'indirizzo IP secondo principi GDPR (mascheramento dell'ultimo ottetto/blocco)
 */
function anonymizeIp(ip: string): string {
  if (!ip) return '0.0.0.0';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::`;
  }
  return 'anonymized';
}

function parseUserAgent(ua: string | undefined): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Desktop', browser: 'Chrome', os: 'Windows' };

  let device = 'Desktop';
  if (/mobile|android|iphone|ipod/i.test(ua)) {
    device = 'Mobile';
  } else if (/ipad|tablet/i.test(ua)) {
    device = 'Tablet';
  }

  let browser = 'Altro';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';

  let os = 'Altro';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

function parseCanale(referrer: string | undefined, urlPath: string | undefined): string {
  if (urlPath && (urlPath.includes('source=qr') || urlPath.includes('qrcode'))) {
    return 'QR Code Territoriale';
  }
  if (!referrer || referrer.trim() === '') {
    return 'Accesso Diretto';
  }
  const refLower = referrer.toLowerCase();
  if (refLower.includes('google') || refLower.includes('bing') || refLower.includes('yahoo') || refLower.includes('duckduckgo')) {
    return 'Motore di Ricerca (Google/Bing)';
  }
  if (refLower.includes('facebook') || refLower.includes('instagram') || refLower.includes('linkedin') || refLower.includes('t.co') || refLower.includes('twitter')) {
    return 'Social Network';
  }
  if (refLower.includes('regione.molise.it') || refLower.includes('sviluppoitaliamolise')) {
    return 'Portale Istituzionale';
  }
  return 'Siti Referenti';
}

/**
 * Registra un accesso di un visitatore
 */
export function recordVisit(
  db: Database.Database,
  clientData: {
    ip?: string;
    userAgent?: string;
    path?: string;
    referrer?: string;
    visitorId?: string;
  }
): { success: boolean; isNewToday: boolean } {
  try {
    const rawIp = clientData.ip || '127.0.0.1';
    const anonymizedIp = anonymizeIp(rawIp);
    const ua = clientData.userAgent || '';
    const { device, browser, os } = parseUserAgent(ua);
    const pagina = clientData.path ? clientData.path.split('?')[0].slice(0, 100) : '/';
    const referente = clientData.referrer ? clientData.referrer.slice(0, 200) : '';
    const canale = parseCanale(clientData.referrer, clientData.path);

    const now = new Date();
    const dataStr = now.toISOString().substring(0, 10);
    const oraStr = now.toTimeString().substring(0, 8);
    const dataOraStr = `${dataStr} ${oraStr}`;

    // Identificatore visitatore univoco giornaliero
    const vId = clientData.visitorId || crypto.createHash('sha256').update(`${anonymizedIp}-${ua}`).digest('hex').substring(0, 16);
    const visitorHash = crypto.createHash('sha256').update(`${vId}-${dataStr}`).digest('hex').substring(0, 20);

    // Verifica se è il primo accesso odierno di questo visitatore
    const existing = db.prepare('SELECT id FROM visitatori_log WHERE visitatore_hash = ? AND data = ? LIMIT 1').get(visitorHash, dataStr);
    const isUniqueToday = existing ? 0 : 1;

    // Inserisci nel log
    db.prepare(`
      INSERT INTO visitatori_log 
      (visitatore_hash, ip_anonymized, data_ora, data, ora, user_agent, device, browser, os, pagina, referente, canale, is_unique_today)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      visitorHash,
      anonymizedIp,
      dataOraStr,
      dataStr,
      oraStr,
      ua.slice(0, 250),
      device,
      browser,
      os,
      pagina,
      referente,
      canale,
      isUniqueToday
    );

    // Aggiorna tabella aggregata giornaliera
    const isMobile = device === 'Mobile' || device === 'Tablet' ? 1 : 0;
    const isDesktop = isMobile ? 0 : 1;

    db.prepare(`
      INSERT INTO visitatori_giornalieri (data, visite_totali, visitatori_unici, visite_mobile, visite_desktop, pagine_viste, aggiornato_il)
      VALUES (?, 1, ?, ?, ?, 1, ?)
      ON CONFLICT(data) DO UPDATE SET
        visite_totali = visite_totali + 1,
        visitatori_unici = visitatori_unici + excluded.visitatori_unici,
        visite_mobile = visite_mobile + excluded.visite_mobile,
        visite_desktop = visite_desktop + excluded.visite_desktop,
        pagine_viste = pagine_viste + 1,
        aggiornato_il = excluded.aggiornato_il
    `).run(
      dataStr,
      isUniqueToday,
      isMobile,
      isDesktop,
      dataOraStr
    );

    return { success: true, isNewToday: isUniqueToday === 1 };
  } catch (err: any) {
    console.error('[VisitorTracker] Errore salvataggio visita:', err.message);
    return { success: false, isNewToday: false };
  }
}

/**
 * Recupera tutte le statistiche aggregate e dettagliate per la visualizzazione in Area Riservata
 */
export function getVisitorAnalytics(db: Database.Database): any {
  try {
    const todayStr = new Date().toISOString().substring(0, 10);
    const past7Str = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const past30Str = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    // Totali storici da visitatori_giornalieri
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(visite_totali), 0) as visite_totali,
        COALESCE(SUM(visitatori_unici), 0) as visitatori_unici,
        COALESCE(SUM(visite_mobile), 0) as visite_mobile,
        COALESCE(SUM(visite_desktop), 0) as visite_desktop,
        COALESCE(SUM(pagine_viste), 0) as pagine_viste
      FROM visitatori_giornalieri
    `).get() as any;

    // Totale oggi
    const todayStats = db.prepare(`
      SELECT 
        COALESCE(visite_totali, 0) as visite_oggi,
        COALESCE(visitatori_unici, 0) as unici_oggi,
        COALESCE(visite_mobile, 0) as mobile_oggi,
        COALESCE(visite_desktop, 0) as desktop_oggi
      FROM visitatori_giornalieri
      WHERE data = ?
    `).get(todayStr) as any;

    // Ultimi 7 giorni
    const last7 = db.prepare(`
      SELECT COALESCE(SUM(visite_totali), 0) as visite_7gg, COALESCE(SUM(visitatori_unici), 0) as unici_7gg
      FROM visitatori_giornalieri
      WHERE data >= ?
    `).get(past7Str) as any;

    // Ultimi 30 giorni
    const last30 = db.prepare(`
      SELECT COALESCE(SUM(visite_totali), 0) as visite_30gg, COALESCE(SUM(visitatori_unici), 0) as unici_30gg
      FROM visitatori_giornalieri
      WHERE data >= ?
    `).get(past30Str) as any;

    // Trend degli ultimi 14 giorni (ordinati per data)
    const trend = db.prepare(`
      SELECT data, visite_totali as visite, visitatori_unici as unici, visite_mobile as mobile, visite_desktop as desktop, pagine_viste as pagine
      FROM visitatori_giornalieri
      ORDER BY data DESC
      LIMIT 14
    `).all() as any[];

    // Ripartizione dispositivi dal log recente (o fallback aggregato)
    const deviceStats = db.prepare(`
      SELECT device, COUNT(*) as count
      FROM visitatori_log
      GROUP BY device
      ORDER BY count DESC
    `).all() as any[];

    // Ripartizione browser dal log recente
    const browserStats = db.prepare(`
      SELECT browser, COUNT(*) as count
      FROM visitatori_log
      WHERE browser != ''
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 6
    `).all() as any[];

    // Ripartizione canali/sorgenti di traffico
    const canaliStats = db.prepare(`
      SELECT canale, COUNT(*) as count
      FROM visitatori_log
      WHERE canale != ''
      GROUP BY canale
      ORDER BY count DESC
      LIMIT 6
    `).all() as any[];

    // Pagine più visitate
    const pagineStats = db.prepare(`
      SELECT pagina, COUNT(*) as count
      FROM visitatori_log
      WHERE pagina != ''
      GROUP BY pagina
      ORDER BY count DESC
      LIMIT 8
    `).all() as any[];

    // Ultimi 25 accessi recenti anonimizzati per monitoraggio in tempo reale
    const ultimiAccessi = db.prepare(`
      SELECT id, data_ora, data, ora, device, browser, os, pagina, canale
      FROM visitatori_log
      ORDER BY id DESC
      LIMIT 25
    `).all() as any[];

    const visiteTot = Number(totals?.visite_totali) || 0;
    const visiteMob = Number(totals?.visite_mobile) || 0;
    const percMobile = visiteTot > 0 ? Math.round((visiteMob / visiteTot) * 100) : 55;

    return {
      totali: {
        visiteTotali: visiteTot,
        visitatoriUniciTotali: Number(totals?.visitatori_unici) || 0,
        visiteOggi: Number(todayStats?.visite_oggi) || 0,
        visitatoriUniciOggi: Number(todayStats?.unici_oggi) || 0,
        visiteUltimi7Giorni: Number(last7?.visite_7gg) || 0,
        visitatoriUniciUltimi7Giorni: Number(last7?.unici_7gg) || 0,
        visiteUltimi30Giorni: Number(last30?.visite_30gg) || 0,
        visitatoriUniciUltimi30Giorni: Number(last30?.unici_30gg) || 0,
        percentualeMobile: percMobile,
        percentualeDesktop: 100 - percMobile,
        pagineVisteTotali: Number(totals?.pagine_viste) || 0
      },
      trend: trend.reverse(), // Da meno recente a più recente per il grafico
      dispositivi: deviceStats,
      browser: browserStats,
      canali: canaliStats,
      paginePiuViste: pagineStats,
      ultimiAccessi
    };
  } catch (err: any) {
    console.error('[VisitorTracker] Errore elaborazione analytics:', err.message);
    return {
      totali: {
        visiteTotali: 0,
        visitatoriUniciTotali: 0,
        visiteOggi: 0,
        visitatoriUniciOggi: 0,
        visiteUltimi7Giorni: 0,
        visiteUltimi30Giorni: 0,
        percentualeMobile: 50,
        percentualeDesktop: 50,
        pagineVisteTotali: 0
      },
      trend: [],
      dispositivi: [],
      browser: [],
      canali: [],
      paginePiuViste: [],
      ultimiAccessi: []
    };
  }
}
