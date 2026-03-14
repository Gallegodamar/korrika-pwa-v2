import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GameState } from '../../types';
import { useShallow } from 'zustand/react/shallow';

type ResultsFeedback = {
  text: string;
  emoji: string;
};

const FEEDBACK_PERFECT = [
  { text: "Zuzenean lekukoa hartzera!", emoji: '🏆' },
  { text: "AEK-ko irakaslea zara edo zer?", emoji: '🤓' },
  { text: "Bikain! Euskaltzaindiak deituko dizu laster.", emoji: '👑' },
  { text: "Txapeldun! Ez dugu hitzik.", emoji: '🤩' },
  { text: "Hobeezina! KORRIKAren hurrengo leloa zuk asmatu.", emoji: '✍️' }
];

const FEEDBACK_GOOD = [
  { text: "Oso ondo! Bihar gehiago.", emoji: '🏃' },
  { text: "Aupa zu! Ia-ia perfektua.", emoji: '🔥' },
  { text: "Maila itzela erakutsi duzu!", emoji: '💪' },
  { text: "Zein ondo! Lekukoa eramateko prest.", emoji: '🙌' },
  { text: "Ez zara makala, ez horixe!", emoji: '😏' }
];

const FEEDBACK_AVERAGE = [
  { text: "Ertaina. Jarraitu trebatzen.", emoji: '🤝' },
  { text: "Tira, tira... badago zer hobetu.", emoji: '😅' },
  { text: "Gutxienez euskaltegian eman zenuen izena.", emoji: '😬' },
  { text: "Beno, erdi-ipurdika ibili zara.", emoji: '🧐' },
  { text: "Edukia irakurri duzu behintzat?", emoji: '👀' }
];

const FEEDBACK_BAD = [
  { text: "Bihar saiatu berriz, mesedez.", emoji: '😢' },
  { text: "Uy, uy, uy... euskaltegira bueltatu beharko duzu.", emoji: '🤦' },
  { text: "Hau marka hau... galduta zabiltza.", emoji: '🤷' },
  { text: "Ez zaitez despistatu, bihar hobeto egin behar da.", emoji: '⚠️' },
  { text: "Lagun, KORRIKAn furgonetatik ez zara jaitsi.", emoji: '🚐' }
];

const FEEDBACK_ZERO = [
  { text: "Bat ere ez? Serio?", emoji: '💀' },
  { text: "Amonak hobeto egingo luke begiak itxita.", emoji: '👵' },
  { text: "Hau negargarria da... esnatu!", emoji: '🥶' },
  { text: "Txantxetan ari zara, ezta?", emoji: '🤡' },
  { text: "Zeroski totala. Zoaz euskaltegira orain bertan!", emoji: '🚨' }
];

const getResultFeedback = (score: number, totalQuestions: number): ResultsFeedback => {
  const total = totalQuestions || 10;

  let pool;
  if (score === total) {
    pool = FEEDBACK_PERFECT;
  } else if (score >= total * 0.8) {
    pool = FEEDBACK_GOOD;
  } else if (score >= total * 0.5) {
    pool = FEEDBACK_AVERAGE;
  } else if (score > 0) {
    pool = FEEDBACK_BAD;
  } else {
    pool = FEEDBACK_ZERO;
  }

  return pool[Math.floor(Math.random() * pool.length)];
};

const ResultsScreen: React.FC = React.memo(() => {
  const {
    players,
    currentPlayerIdx,
    reviewDayIndex,
    progress,
    sequentialSimulationProgress,
    setGameState,
    setReviewDayIndex,
    setIsSimulationRun
  } = useAppStore(useShallow((state) => ({
    players: state.players,
    currentPlayerIdx: state.currentPlayerIdx,
    reviewDayIndex: state.reviewDayIndex,
    progress: state.progress,
    sequentialSimulationProgress: state.sequentialSimulationProgress,
    setGameState: state.setGameState,
    setReviewDayIndex: state.setReviewDayIndex,
    setIsSimulationRun: state.setIsSimulationRun
  })));

  const handleBack = () => {
    setReviewDayIndex(null);
    setIsSimulationRun(false);
    setGameState(GameState.HOME);
  };

  const backLabel = reviewDayIndex !== null ? 'Itzuli ibilbidera' : 'Itzuli hasierara';

  // Determinar de dónde sacar los resultados basados en si estamos revisando el histórico o el fin de partida.
  const activeProgressArr = sequentialSimulationProgress.length > 0 ? sequentialSimulationProgress : progress;
  const reviewedDay = reviewDayIndex !== null && reviewDayIndex >= 0 ? activeProgressArr[reviewDayIndex] : undefined;

  const resultsAnswers = reviewedDay?.answers ?? (players[currentPlayerIdx]?.answers ?? []);
  const resultsScore = reviewedDay?.score ?? (players[currentPlayerIdx]?.score ?? 0);
  const resultsTotal = Math.max(resultsAnswers.length, 1);

  // Usamos useMemo para que la frase aleatoria no cambie constantemente si React re-renderiza el componente visualmente.
  const resultsFeedback = React.useMemo(() => getResultFeedback(resultsScore, resultsTotal), [resultsScore, resultsTotal]);

  const successRatio = Math.round(((resultsScore || 0) / Math.max(resultsTotal, 1)) * 100);
  const isPerfect = successRatio === 100;
  const isGood = successRatio >= 50;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center pt-2 sm:pt-6 pb-24 px-4 sm:px-6 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full flex flex-col space-y-6"
      >
        {/* Tarjeta Gigante de Score */}
        <motion.div variants={itemVariants} className="w-full glassmorphism rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden text-center shadow-xl">
          <div className={`absolute top-0 right-0 p-6 opacity-10 pointer-events-none select-none ${isPerfect ? 'text-yellow-400' : isGood ? 'text-pink-400' : 'text-slate-400'}`}>
            <Trophy size={120} />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-600/80 mb-2 relative z-10">
            {reviewDayIndex !== null
              ? `${reviewDayIndex + 1}. eguneko emaitza`
              : 'Azken Emaitza'}
          </p>

          <div className="flex flex-col items-center justify-center gap-2 mb-6 relative z-10">
            <span className="text-6xl sm:text-7xl drop-shadow-md">{resultsFeedback.emoji}</span>
            <h2 className="text-2xl sm:text-3xl font-black italic text-slate-800 leading-tight">
              {resultsFeedback.text}
            </h2>
          </div>

          <div className={`rounded-3xl p-5 backdrop-blur-md border ${isGood ? 'bg-pink-50 border-pink-200' : 'bg-slate-50 border-slate-200'} relative z-10`}>
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-3">
              <p className={`text-5xl sm:text-6xl font-black drop-shadow-sm ${isGood ? 'text-pink-600' : 'text-slate-700'}`}>
                {resultsScore}
                <span className="text-2xl sm:text-3xl font-bold opacity-50"> / {resultsTotal}</span>
              </p>
              <div className={`text-sm sm:text-base font-black px-4 py-1.5 rounded-full ${isGood ? 'bg-pink-200 text-pink-700' : 'bg-slate-200 text-slate-600'} mb-1 sm:mb-2`}>
                %{successRatio} Zuzena
              </div>
            </div>

            {/* Progress Bar moderna */}
            <div className="mt-5 h-3 rounded-full bg-slate-200/50 overflow-hidden relative shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${successRatio}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className={`absolute top-0 left-0 h-full rounded-full ${isPerfect ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : isGood ? 'korrika-bg-gradient' : 'bg-slate-400'}`}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-sm sm:text-base shadow-lg hover:bg-slate-700 active:scale-95 transition-all relative z-10"
          >
            <ArrowLeft size={20} />
            {backLabel}
          </motion.button>
        </motion.div>

        {/* Desglose de Respuestas */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-800 drop-shadow-sm">Xehetasuna</h3>
            <span className="text-xs sm:text-sm font-black uppercase text-pink-600 bg-pink-100 shadow-sm px-3 py-1 rounded-full">{resultsAnswers.length} galdera</span>
          </div>

          <div className="space-y-4">
            {resultsAnswers.map((answer, idx) => {
              const selectedKey = answer.selectedOption;
              const correctKey = answer.question.respuesta_correcta;
              const selectedText = selectedKey ? answer.question.opciones[selectedKey] : null;
              const correctText = answer.question.opciones[correctKey];

              return (
                <motion.article
                  variants={itemVariants}
                  key={`${answer.question.id}-${idx}`}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all p-5 sm:p-6"
                >
                  {/* Indicador lateral de color */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${answer.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'}`} />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 pl-2">
                    <p className="flex-1 text-sm sm:text-base font-black text-slate-800 leading-snug">
                      <span className="text-slate-400 mr-1">{idx + 1}.</span> {answer.question.pregunta}
                    </p>
                    <div className="shrink-0 flex items-center self-start gap-1.5 pt-1 sm:pt-0">
                      {answer.isCorrect ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={14} /> Zuzena
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-full bg-rose-100/80 text-rose-700 border border-rose-200">
                          <XCircle size={14} /> Okerra
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 pl-2">
                    <div className={`rounded-xl border p-3 shadow-inner ${answer.isCorrect ? 'border-emerald-100 bg-emerald-50/50' : 'border-rose-100 bg-rose-50/50'}`}>
                      <p className={`text-[10px] sm:text-xs font-black uppercase mb-1 flex items-center gap-1 ${answer.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Zure aukera
                      </p>
                      <p className={`text-sm sm:text-base font-bold leading-snug ${answer.isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {selectedKey ? `${selectedKey.toUpperCase()}) ${selectedText}` : <span className="flex items-center gap-1 opacity-70"><AlertCircle size={16} /> Erantzun gabe</span>}
                      </p>
                    </div>

                    {!answer.isCorrect && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 relative shadow-inner">
                        <p className="text-[10px] sm:text-xs font-black uppercase text-slate-500 mb-1">Erantzun zuzena</p>
                        <p className="text-sm sm:text-base font-black text-slate-700 leading-snug">{`${correctKey.toUpperCase()}) ${correctText}`}</p>
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
});

ResultsScreen.displayName = 'ResultsScreen';
export default ResultsScreen;
