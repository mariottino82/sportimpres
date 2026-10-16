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
  locandina_tipo?: 'image' | 'pdf' | '';
  locandina_nome?: string;
  attivo?: number;
}

export const EVENTI_DEFAULT: EventoItem[] = [];

export const MESI_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const MESI_ESTESI_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"
];
