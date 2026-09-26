import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MOLISE_COORDS, MOLISE_RILIEVO_BOUNDS } from '../data/moliseGeo';
import { SPORTELLI_LIST, AREE, nomeBreve, SportelloInfo } from '../data/sportelliList';

interface MoliseMapProps {
  selectedSportello?: SportelloInfo | null;
  selectedSportelloId?: number | string | null;
  sportelli?: SportelloInfo[] | any[];
  userCoords?: { lat: number; lng: number } | null;
  filtroArea?: string;
  onSelectSportello: (sportello: SportelloInfo | any) => void;
}

const LBL_POS: Record<string, string> = {
  Isernia: 'r',
  Fornelli: 'l',
};

function getMarkerLabel(nome: string) {
  const n = nomeBreve(nome);
  const p = LBL_POS[n] || 'b';
  const st = 'font-size="12.5" font-weight="700" fill="#1e293b" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" style="paint-order:stroke"';
  if (p === 'r') return `<text x="17" y="4.5" text-anchor="start" ${st}>${n}</text>`;
  if (p === 'l') return `<text x="-17" y="4.5" text-anchor="end" ${st}>${n}</text>`;
  return `<text y="27" text-anchor="middle" ${st}>${n}</text>`;
}

export const MoliseMap: React.FC<MoliseMapProps> = ({
  selectedSportello,
  selectedSportelloId,
  sportelli,
  userCoords,
  filtroArea,
  onSelectSportello,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
      minZoom: 8,
      maxZoom: 12,
      zoomSnap: 0.25,
    });

    // Background polygon for non-Molise area masking
    const worldMask: [number, number][] = [
      [60, -10],
      [60, 40],
      [25, 40],
      [25, -10],
    ];
    L.polygon([worldMask, MOLISE_COORDS], {
      stroke: false,
      fillColor: '#f1f5f9',
      fillOpacity: 0.85,
      interactive: false,
    }).addTo(map);

    // Molise boundary outline
    const reg = L.polygon(MOLISE_COORDS, {
      color: '#0284c7',
      weight: 2.5,
      opacity: 0.85,
      fill: true,
      fillColor: '#e0f2fe',
      fillOpacity: 0.35,
      interactive: false,
    }).addTo(map);

    const bounds = reg.getBounds();
    map.fitBounds(bounds, { padding: [18, 18] });
    map.setMaxBounds(MOLISE_RILIEVO_BOUNDS);

    const group = L.layerGroup().addTo(map);
    markersGroupRef.current = group;
    mapInstanceRef.current = map;

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersGroupRef.current || !mapContainerRef.current) return;
    markersGroupRef.current.clearLayers();
    const box = mapContainerRef.current.parentElement;

    const listToRender = (sportelli && sportelli.length > 0) ? sportelli : SPORTELLI_LIST;

    listToRender.forEach((s) => {
      const A = AREE[s.area as keyof typeof AREE] || { col: '#0284c7', nome: 'Molise', soft: '#e0f2fe' };
      const isSelected = Boolean(
        (selectedSportello && selectedSportello.id === s.id) ||
        (selectedSportelloId !== undefined && selectedSportelloId !== null && String(selectedSportelloId) === String(s.id))
      );
      const isDimmed = Boolean(filtroArea && s.area !== filtroArea);

      const html = `
        <svg width="1" height="1">
          <g class="mk" style="cursor:pointer;opacity:${isDimmed ? 0.25 : 1};transition:opacity .2s">
            ${isSelected ? `
              <circle r="24" fill="${A.col}" opacity=".18">
                <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".35;0;.35" dur="2s" repeatCount="indefinite"/>
              </circle>
            ` : ''}
            <circle r="${isSelected ? 16 : 12}" fill="${isSelected ? A.col : '#ffffff'}" stroke="${A.col}" stroke-width="${isSelected ? 4 : 3}"/>
            <g fill="${isSelected ? '#ffffff' : A.col}">
              <circle cy="${isSelected ? -5.5 : -4.5}" r="${isSelected ? 2 : 1.6}"/>
              <rect x="${isSelected ? -1.7 : -1.4}" y="${isSelected ? -2.2 : -1.8}" width="${isSelected ? 3.4 : 2.8}" height="${isSelected ? 8 : 6.5}" rx="1.4"/>
            </g>
            ${isSelected ? '' : getMarkerLabel(s.nome)}
            ${isSelected ? `
              <g transform="translate(0,-30)">
                <rect x="${-(nomeBreve(s.nome).length * 3.9 + 14)}" y="-22" width="${nomeBreve(s.nome).length * 7.8 + 28}" height="26" rx="13" fill="#0f172a"/>
                <text text-anchor="middle" y="-4.5" font-size="12.5" font-weight="700" fill="#ffffff">${nomeBreve(s.nome)}</text>
              </g>
            ` : ''}
          </g>
        </svg>
      `;

      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          className: 'mk-ic',
          html,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        zIndexOffset: isSelected ? 1000 : (isDimmed ? -500 : 0),
        keyboard: false,
      }).addTo(markersGroupRef.current!);

      const element = marker.getElement()?.querySelector('.mk');
      if (element) {
        element.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (tipRef.current) tipRef.current.classList.add('hidden');
          onSelectSportello(s);
        });

        element.addEventListener('mouseenter', () => {
          if (isSelected || !tipRef.current || !box) return;
          const rect = element.getBoundingClientRect();
          const boxRect = box.getBoundingClientRect();
          tipRef.current.textContent = nomeBreve(s.nome);
          tipRef.current.style.left = `${rect.left + rect.width / 2 - boxRect.left}px`;
          tipRef.current.style.top = `${rect.top - boxRect.top - 6}px`;
          tipRef.current.classList.remove('hidden');
        });

        element.addEventListener('mouseleave', () => {
          if (tipRef.current) tipRef.current.classList.add('hidden');
        });
      }
    });

    if (userCoords && userCoords.lat && userCoords.lng) {
      const userHtml = `
        <div style="position:relative;width:24px;height:24px;margin-left:-12px;margin-top:-12px">
          <span style="position:absolute;inset:0;border-radius:9999px;background-color:#38bdf8;opacity:0.75;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></span>
          <span style="position:relative;display:flex;width:24px;height:24px;border-radius:9999px;background-color:#0284c7;border:3px solid #ffffff;box-shadow:0 4px 6px -1px rgba(0,0,0,0.2);align-items:center;justify-content:center">
            <span style="width:8px;height:8px;border-radius:9999px;background-color:#ffffff"></span>
          </span>
        </div>
      `;
      L.marker([userCoords.lat, userCoords.lng], {
        icon: L.divIcon({
          className: 'user-loc-ic',
          html: userHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        zIndexOffset: 1200,
      }).addTo(markersGroupRef.current!);
    }
  }, [selectedSportello, selectedSportelloId, sportelli, userCoords, filtroArea, onSelectSportello]);

  return (
    <div className="relative" style={{ padding: '12px 16px 8px' }}>
      <div id="molise-map" ref={mapContainerRef} role="img" aria-label="Mappa degli sportelli in Molise" />
      <div
        ref={tipRef}
        id="map-tip"
        style={{ zIndex: 1000 }}
        className="pointer-events-none absolute hidden -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-lg transition-all"
      />
    </div>
  );
};
