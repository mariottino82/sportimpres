import React, { useState, useEffect } from 'react';
import { HeroShowcaseConfig, CarouselSlide, WebTvVideo, CrmOperator } from '../../types';
import {
  Play,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  FileText,
  Headphones,
  AlertCircle,
  ExternalLink,
  Tv,
  CheckCircle2
} from 'lucide-react';

interface HeroShowcaseWidgetProps {
  onStartBooking: (params?: { userType?: 'IMPRESA' | 'ASPIRANTE'; initialSportelloId?: number; source?: string; grantTitle?: string }) => void;
  onOpenWebTvModal?: (video: WebTvVideo) => void;
  onWatchVideo?: (video: WebTvVideo) => void;
  videos: WebTvVideo[];
  onOpenCrmShowcaseConfig?: () => void;
}

export const HeroShowcaseWidget: React.FC<HeroShowcaseWidgetProps> = ({
  onStartBooking,
  onOpenWebTvModal,
  onWatchVideo,
  videos,
  onOpenCrmShowcaseConfig
}) => {
  const handleVideoClick = onOpenWebTvModal || onWatchVideo || (() => {});
  const [config, setConfig] = useState<HeroShowcaseConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Check if current user is logged in as Admin or Comunicazione
  const [canManage, setCanManage] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_auth_session');
      if (saved) {
        const user: CrmOperator = JSON.parse(saved);
        if (user && (user.ruolo === 'ADMIN' || user.ruolo === 'COMUNICAZIONE')) {
          setCanManage(true);
        }
      }
    } catch {
      setCanManage(false);
    }
  }, []);

  // Fetch Hero Showcase config
  useEffect(() => {
    fetch('/api/hero-showcase')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.activeMode) {
          setConfig(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching hero showcase config:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Autoplay for carousel
  useEffect(() => {
    if (!config || config.activeMode !== 'carousel' || isPaused) return;
    const slidesCount = config.carouselSlides?.length || 0;
    if (slidesCount <= 1) return;

    const intervalSeconds = config.autoplayIntervalSeconds || 5;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slidesCount);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [config, isPaused]);

  // If loading, show clean skeleton
  if (loading && !config) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-pulse p-8 flex flex-col items-center justify-center min-h-[340px]">
        <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  const activeMode = config?.activeMode || 'webtv';
  const slides = config?.carouselSlides || [];
  const currentSlide: CarouselSlide | undefined = slides[currentSlideIndex] || slides[0];

  // Resolve featured video for Web TV mode
  let featuredVideo: WebTvVideo | null = null;
  if (videos.length > 0) {
    if (config?.webtvConfig?.selectedVideoId) {
      featuredVideo = videos.find((v) => v.id === config.webtvConfig.selectedVideoId) || videos[0];
    } else {
      featuredVideo = videos[0];
    }
  }

  const handleNextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }
  };

  const handlePrevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const handleSlideCta = (slide: CarouselSlide) => {
    if (slide.ctaAction === 'booking_impresa') {
      onStartBooking({ userType: 'IMPRESA', grantTitle: slide.grantTitle });
    } else if (slide.ctaAction === 'booking_aspirante') {
      onStartBooking({ userType: 'ASPIRANTE', grantTitle: slide.grantTitle });
    } else if (slide.ctaAction === 'webtv_modal') {
      if (featuredVideo) {
        handleVideoClick(featuredVideo);
      } else if (videos.length > 0) {
        handleVideoClick(videos[0]);
      }
    } else if (slide.ctaAction === 'external_link' && slide.externalLink) {
      window.open(slide.externalLink, '_blank', 'noopener,noreferrer');
    } else {
      onStartBooking({ grantTitle: slide.grantTitle });
    }
  };

  const getTagColorClasses = (color?: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-600 text-white border-emerald-500';
      case 'purple':
        return 'bg-purple-600 text-white border-purple-500';
      case 'amber':
        return 'bg-amber-600 text-white border-amber-500';
      case 'red':
        return 'bg-red-600 text-white border-red-500';
      case 'blue':
      default:
        return 'bg-sky-600 text-white border-sky-500';
    }
  };

  return (
    <div
      id="hero-showcase-box"
      className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Admin / Comunicazione Quick-Edit Trigger Badge */}
      {canManage && (
        <div className="absolute top-2.5 right-2.5 z-30">
          <button
            onClick={() => {
              if (onOpenCrmShowcaseConfig) {
                onOpenCrmShowcaseConfig();
              } else {
                // Navigate to admin mode communications tab
                window.location.href = '/?admin=true&tab=comunicazione&subtab=vetrina';
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-950 text-white text-[10px] font-bold shadow-md border border-slate-700/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            title="Sezione riservata ad Admin e Staff Comunicazione: personalizza i contenuti di questo box"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Configura Vetrina</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: CAROUSEL DI IMMAGINI                             */}
      {/* ========================================================= */}
      {activeMode === 'carousel' && currentSlide && (
        <div className="flex flex-col">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-display">
                In Primo Piano • Territorio & Opportunità
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono pr-20 sm:pr-0">
              <span>{currentSlideIndex + 1}</span>
              <span className="text-slate-500">/</span>
              <span>{slides.length}</span>
            </div>
          </div>

          {/* Slide Visual Stage */}
          <div className="relative aspect-[16/9] sm:aspect-[16/9] w-full bg-slate-950 overflow-hidden select-none">
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover opacity-85 transition-transform duration-700 hover:scale-105"
            />
            {/* Dark gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent flex flex-col justify-between p-4 sm:p-5">
              
              {/* Top Tag */}
              <div className="flex items-start justify-between">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-sm ${getTagColorClasses(currentSlide.tagColor)}`}>
                  {currentSlide.tag}
                </span>
              </div>

              {/* Bottom Caption */}
              <div className="space-y-1.5 z-10">
                <h3 className="text-white font-extrabold text-base sm:text-lg leading-snug drop-shadow-md font-display">
                  {currentSlide.title}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 drop-shadow-sm leading-relaxed">
                  {currentSlide.subtitle}
                </p>
              </div>
            </div>

            {/* Previous / Next Arrow Controls */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-xs shadow-md"
                  aria-label="Slide precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-xs shadow-md"
                  aria-label="Prossima slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Action Footer & Indicators */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlideIndex
                      ? 'w-6 bg-sky-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Vai alla slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleSlideCta(currentSlide)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{currentSlide.ctaText || 'Approfondisci e Prenota'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: WEB TV UFFICIALE                                  */}
      {/* ========================================================= */}
      {activeMode === 'webtv' && (
        <div className="flex flex-col">
          {/* Web TV Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-xs shrink-0">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <div className="min-w-0 pr-16 sm:pr-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block truncate">
                  Web TV Ufficiale
                </span>
                <h3 className="text-sm font-bold text-white truncate">
                  {config?.webtvConfig?.subtitle || 'La Bottega delle Opportunità'}
                </h3>
              </div>
            </div>
            <span className="text-[10px] bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded-full border border-red-500/30 shrink-0 hidden xs:inline">
              {config?.webtvConfig?.badge || 'ON AIR'}
            </span>
          </div>

          {/* Video Player Embed / Thumbnail */}
          {featuredVideo ? (
            <div className="relative group aspect-[16/9] bg-slate-900 overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80`}
                alt={featuredVideo.titolo}
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xs">
                    {featuredVideo.rubrica}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleVideoClick(featuredVideo!)}
                    className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 mx-auto cursor-pointer"
                    title="Guarda il video completo"
                  >
                    <Play className="w-5 h-5 fill-red-600 ml-0.5" />
                  </button>
                  <h4 className="text-white font-bold text-sm line-clamp-2 text-center drop-shadow-sm">
                    {featuredVideo.titolo}
                  </h4>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
              <Tv className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-xs text-slate-400">Nessun video in evidenza disponibile al momento.</p>
            </div>
          )}

          {/* Video Description & Direct Booking Button with Tracked Source */}
          {featuredVideo && (
            <div className="p-4 space-y-3 bg-slate-50/60">
              <p className="text-xs text-slate-600 line-clamp-2">
                {featuredVideo.descrizione}
              </p>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => onStartBooking({ source: `webtv_${featuredVideo!.id}`, grantTitle: featuredVideo!.bando_titolo || featuredVideo!.titolo })}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{config?.webtvConfig?.ctaText || 'Prenota un appuntamento per questo bando'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: HUB RISORSE DIGITALI & BACHECA                   */}
      {/* ========================================================= */}
      {activeMode === 'digital' && (
        <div className="flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 pr-16 sm:pr-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-300 block">
                  {config?.digitalContentConfig?.badge || 'AGGIORNAMENTO LIVE'}
                </span>
                <h3 className="text-sm font-bold text-white truncate">
                  {config?.digitalContentConfig?.title || 'Hub Risorse Digitali & Notiziario'}
                </h3>
              </div>
            </div>
            <span className="text-[10px] bg-sky-500/20 text-sky-200 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30 hidden xs:inline">
              DIGITALE
            </span>
          </div>

          {/* Cards List */}
          <div className="p-4 space-y-3 bg-slate-50/50">
            {config?.digitalContentConfig?.items?.map((item) => {
              const isDeadline = item.type === 'deadline';
              const isPodcast = item.type === 'podcast';

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition-all flex items-start gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isDeadline
                        ? 'bg-amber-100 text-amber-700'
                        : isPodcast
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {isDeadline ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : isPodcast ? (
                      <Headphones className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {item.dateBadge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.dateBadge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (item.link === '#prenota') {
                        onStartBooking();
                      } else if (item.link.startsWith('http')) {
                        window.open(item.link, '_blank', 'noopener,noreferrer');
                      } else {
                        onStartBooking();
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors shrink-0 self-center cursor-pointer"
                    title="Accedi al contenuto"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Aggiornato quotidianamente dai nostri esperti
            </span>
            <button
              onClick={() => onStartBooking()}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Richiedi Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
