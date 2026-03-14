import React from 'react';
import { motion } from 'framer-motion';
import { Play, Trophy, Lock, Star, Shield } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

// ---- SUBCOMPONENTE EDUKIA ---- //
type EdukiaCardProps = {
  contentDayIndex: number;
};

const EdukiaCard: React.FC<EdukiaCardProps> = React.memo(({ contentDayIndex }) => {
  const { edukiak, loadingEdukiak } = useAppStore(useShallow((state) => ({
    edukiak: state.edukiak,
    loadingEdukiak: state.loadingEdukiak
  })));
  const activeEdukia = edukiak[contentDayIndex] || null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="glassmorphism rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Star size={80} />
        </div>
        {loadingEdukiak ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-2 bg-pink-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-2 bg-pink-200 rounded"></div>
                <div className="h-2 bg-pink-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : activeEdukia ? (
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 mb-3">
              <Star size={12} className="fill-current" />
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-none">
                Eguneko edukia
              </p>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight mb-2">
              {activeEdukia.title}
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
              {activeEdukia.content}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Lock size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">Ez dago edukirik egun honetarako.</p>
          </div>
        )}
      </div>
    </motion.section>
  );
});
EdukiaCard.displayName = 'EdukiaCard';

// ---- COMPONENTE PRINCIPAL HOMESCREEN ---- //
type HomeScreenExtractedProps = {
  // Estas son las unicas props externas que el App envia por logica dura local 
  // que es difícil meter a store, como la validación de tiempo local
  showDailyPlayButton: boolean;
  onStartDailyPlay: () => void;
  dailyPlayButtonDisabled: boolean;
  validatingDailyStart: boolean;
  nextAvailableDay: number;
  currentChallengeDayIndex: number;
  timeUntilStart: number;
  formatCountdown: (ms: number) => string;
  dailyPlayLockMessage: string | null;
  isAdmin: boolean;
  onOpenSupervisor: () => void;
  startSequentialSimulation: () => void;
  stopSequentialSimulation: () => void;
  saveChallengeStartDate: (setSaving: (saving: boolean) => void) => Promise<void>;
  resetChallengeStartDate: (setSaving: (saving: boolean) => void) => Promise<void>;
};

const HomeScreen: React.FC<HomeScreenExtractedProps> = React.memo((props) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center pt-2 sm:pt-6 pb-24 px-4 sm:px-6 relative z-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col items-center space-y-6"
      >


        {/* Tarjeta de Contenido Educativo */}
        <EdukiaCard contentDayIndex={props.currentChallengeDayIndex} />

        {/* Panel de Botón Jugar Gigante */}
        <motion.section variants={itemVariants} className="w-full">
          {props.showDailyPlayButton ? (
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={props.onStartDailyPlay}
                disabled={props.dailyPlayButtonDisabled}
                className="relative group overflow-hidden w-full korrika-bg-gradient text-white px-4 py-6 rounded-3xl font-black text-xl sm:text-2xl leading-none uppercase italic shadow-[0_10px_30px_var(--color-korrika-glow)] hover:scale-[1.02] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Play className="fill-current" />
                  {props.validatingDailyStart
                    ? 'Egiaztatzen...'
                    : props.nextAvailableDay === -4
                      ? `Erronka hasteko: ${props.formatCountdown(props.timeUntilStart)}`
                      : props.nextAvailableDay === -1 || props.nextAvailableDay === -2
                        ? 'Gaurko saioa egina'
                        : `${props.nextAvailableDay + 1}. eguneko jolasa hasi`}
                </span>
              </button>
              {props.dailyPlayLockMessage && (
                <p className="text-xs font-bold text-red-500 text-center bg-red-50 border border-red-100 rounded-2xl px-4 py-3 shadow-inner">
                  {props.dailyPlayLockMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="glassmorphism rounded-3xl p-6 flex flex-col items-center text-center">
              <Trophy size={48} className="text-amber-400 mb-3 drop-shadow-md" />
              <h2 className="text-lg font-black uppercase text-slate-800">
                Erronka Amaituta
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">11 eguneko ibilbidea osatu duzu.</p>
            </div>
          )}
        </motion.section>



        {/* Tablero Administrativo (Kudeaketa Panela) */}
        {props.isAdmin && (
          <motion.div variants={itemVariants} className="w-full">
            <div className="rounded-[20px] border border-amber-200 bg-[#FFFAF0] p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-amber-800">
                    Ikuskaritza
                  </h2>
                  <p className="mt-2 text-sm font-medium text-amber-900">
                    Erronkaren egutegia, jokalarien datuak eta galdera-bankua toki bakarrean kudeatu.
                  </p>
                </div>
              </div>

              <button
                onClick={props.onOpenSupervisor}
                className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-4 text-[11px] font-black uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Ireki ikuskaritza panela
              </button>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
});

HomeScreen.displayName = 'HomeScreen';
export default HomeScreen;
