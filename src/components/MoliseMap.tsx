import React from 'react';
import { Sportello } from '../types';
import { MapPin, Navigation } from 'lucide-react';

interface MoliseMapProps {
  sportelli: Sportello[];
  selectedSportelloId?: number | null;
  userCoords?: { lat: number; lng: number } | null;
  onSelectSportello: (sportello: Sportello) => void;
  className?: string;
}

export const MoliseMap: React.FC<MoliseMapProps> = ({
  sportelli,
  selectedSportelloId,
  userCoords,
  onSelectSportello,
  className = ''
}) => {
  // Molise geographic bounds: Lat ~ 41.35 to 42.15, Long ~ 13.95 to 15.15
  const minLat = 41.35;
  const maxLat = 42.15;
  const minLng = 13.95;
  const maxLng = 15.15;

  const projectToPercent = (lat: number, lng: number) => {
    // x: longitude left to right
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // y: latitude top (high lat) to bottom (low lat)
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    };
  };

  return (
    <div className={`relative bg-gradient-to-br from-sky-50/70 via-slate-50 to-indigo-50/50 rounded-2xl border border-sky-200/80 p-4 sm:p-6 overflow-hidden shadow-sm ${className}`}>
      {/* Molise outline stylized background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
        <svg viewBox="0 0 400 300" className="w-full h-full object-contain">
          <path
            d="M 60,160 Q 110,60 220,50 Q 320,40 370,120 Q 380,220 280,260 Q 180,270 110,240 Z"
            fill="#0284c7"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between mb-3 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{sportelli.length > 0 ? `${sportelli.length} Sportelli sul territorio del Molise` : 'Sportelli sul territorio del Molise'}</span>
        </div>
        {userCoords && (
          <div className="flex items-center gap-1 text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
            <Navigation className="w-3 h-3 text-sky-600" />
            <span>La tua posizione rilevata</span>
          </div>
        )}
      </div>

      {/* Map Interactive Canvas */}
      <div className="relative w-full aspect-[16/10] bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-inner overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40"></div>

        {/* Region Labels */}
        <div className="absolute top-2 left-3 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
          Provincia di Isernia
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] uppercase font-bold tracking-widest text-slate-400 select-none">
          Provincia di Campobasso
        </div>
        <div className="absolute top-2 right-8 text-[9px] uppercase font-semibold text-sky-600/70 select-none flex items-center gap-1">
          <span>Costa Adriatica</span>
          <span className="text-xs">🌊</span>
        </div>

        {/* User position indicator */}
        {userCoords && (() => {
          const userPos = projectToPercent(userCoords.lat, userCoords.lng);
          return (
            <div
              style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 animate-ping absolute"></div>
                <div className="w-5 h-5 rounded-full bg-sky-600 border-2 border-white shadow-md flex items-center justify-center">
                  <Navigation className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Desks Pins */}
        {sportelli.map((s) => {
          const pos = projectToPercent(s.lat, s.lng);
          const isSelected = selectedSportelloId === s.id;
          const isCampobassoSim = s.comune.includes('SIM');

          return (
            <button
              key={s.id}
              onClick={() => onSelectSportello(s)}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group z-10 transition-all duration-200 focus:outline-none`}
              title={`${s.nome} (${s.comune})`}
            >
              <div className="relative flex flex-col items-center">
                {/* Pin badge */}
                <div
                  className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-md transition-transform duration-200 flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? 'bg-sky-600 text-white scale-110 ring-2 ring-sky-300 ring-offset-1'
                      : isCampobassoSim
                      ? 'bg-purple-700 text-white hover:scale-105'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-sky-50 hover:border-sky-400 hover:scale-105'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : isCampobassoSim ? 'text-amber-300' : 'text-sky-600'}`} />
                  <span>{s.comune.replace(' (sede SIM)', '')}</span>
                  {s.distanzaKm !== undefined && (
                    <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                      {s.distanzaKm}km
                    </span>
                  )}
                </div>

                {/* Pin stem */}
                <div className={`w-1.5 h-1.5 rotate-45 -mt-0.5 ${isSelected ? 'bg-sky-600' : isCampobassoSim ? 'bg-purple-700' : 'bg-white border-r border-b border-slate-300'}`}></div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-500">
        Clicca su uno sportello per selezionarlo e visualizzare orari e disponibilità.
      </div>
    </div>
  );
};
