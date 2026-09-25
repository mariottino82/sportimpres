export interface EventoItem {
  id?: number;
  data: string;
  tipo: 'EVENTO' | 'WORKSHOP' | 'BANDO';
  titolo: string;
  testo: string;
  luogo?: string;
  ora?: string;
  nota?: string;
  bottone?: string;
  link?: string;
  hasManifesto?: boolean;
  manifesto_url?: string;
  attivo?: number;
}

export const EVENTI_DEFAULT: EventoItem[] = [
  {
    data: "2026-09-28",
    tipo: "EVENTO",
    titolo: "Inaugurazione Sportello Imprese – Sede di Trivento",
    testo: "Inaugurazione della nuova sede di Trivento presso il Centro Polifunzionale Comunale, Sala consiliare C.so G. Marconi.",
    luogo: "Trivento",
    ora: "18:00",
    nota: "Lunedì 28 settembre",
    bottone: "Vedi manifesto",
    hasManifesto: true
  },
  {
    data: "2026-10-15",
    tipo: "WORKSHOP",
    titolo: "Workshop di esempio: dall'idea al business plan",
    testo: "Laboratorio pratico per aspiranti imprenditori, in presenza e online.",
    luogo: "Termoli + online",
    ora: "15:00",
    nota: "Gratuito",
    link: "#",
    bottone: "Iscriviti"
  },
  {
    data: "2026-10-22",
    tipo: "BANDO",
    titolo: "News di esempio: apertura avviso agevolazioni",
    testo: "Sintesi della notizia con scadenze principali e requisiti.",
    luogo: "",
    ora: "",
    nota: "Serve aiuto?",
    link: "#sportelli",
    bottone: "Prenota consulenza"
  }
];

export const MESI_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const MESI_ESTESI_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"
];
