import React from 'react';
import { WebTvVideo } from '../../types';
import { X, Calendar, Play, Tag, ExternalLink, Share2 } from 'lucide-react';

interface WebTvModalProps {
  video: WebTvVideo | null;
  onClose: () => void;
  onBookForVideo: (video: WebTvVideo) => void;
}

export const WebTvModal: React.FC<WebTvModalProps> = ({ video, onClose, onBookForVideo }) => {
  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-800 flex flex-col">
        
        {/* Top bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-xs uppercase font-bold text-red-400">Web TV • La Bottega delle Opportunità</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Embed */}
        <div className="aspect-video bg-black w-full">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id || 'dQw4w9WgXcQ'}?autoplay=1`}
            title={video.titolo}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Details and CTA */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs bg-red-600/20 text-red-300 font-bold px-2.5 py-1 rounded-full border border-red-500/30 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>{video.rubrica}</span>
            </span>

            <span className="text-xs text-slate-400">
              Pubblicato il {new Date(video.data_pubblicazione).toLocaleDateString('it-IT')}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white leading-snug">
            {video.titolo}
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            {video.descrizione}
          </p>

          {video.bando_titolo && (
            <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
              <span className="text-sky-400 font-semibold block mb-0.5">Bando collegato:</span>
              <span className="text-white font-bold">{video.bando_titolo}</span>
            </div>
          )}

          {/* Book Appointment CTA */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                onClose();
                onBookForVideo(video);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Prenota un appuntamento per approfondire questo bando</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
