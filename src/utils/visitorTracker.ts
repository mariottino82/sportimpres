/**
 * Client-side Visitor Tracking Utility for Sportello Imprese Molise
 * Traccia in modo anonimo e nel rispetto del GDPR le visite al portale pubblico.
 * Non traccia le sessioni interne degli operatori in backoffice CRM.
 */

function getOrCreateVisitorId(): string {
  try {
    const key = 'sim_visitatore_id';
    let id = localStorage.getItem(key);
    if (!id || id.length < 8) {
      id = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'anon_' + Math.random().toString(36).substring(2, 10);
  }
}

let lastTrackedPath = '';
let lastTrackedTime = 0;

export function trackPlatformVisit(customPath?: string): void {
  try {
    // Non tracciare le sessioni dell'area riservata CRM
    const currentPath = customPath || window.location.pathname + window.location.hash;
    if (window.location.search.includes('admin=true') || currentPath.includes('/admin')) {
      return;
    }

    // Debounce: evita doppi tracciamenti entro 5 secondi sulla stessa pagina
    const now = Date.now();
    if (currentPath === lastTrackedPath && (now - lastTrackedTime) < 5000) {
      return;
    }
    lastTrackedPath = currentPath;
    lastTrackedTime = now;

    const visitorId = getOrCreateVisitorId();
    const referrer = document.referrer || '';

    // Usa fetch asincrono non bloccante
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath,
        referrer,
        visitorId
      }),
      keepalive: true
    }).catch(() => {
      // Ignora silenziosamente eventuali errori di rete per non disturbare l'utente
    });
  } catch {
    // Fail-safe
  }
}
