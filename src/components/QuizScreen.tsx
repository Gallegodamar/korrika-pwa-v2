import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Question } from '../types';

type QuizScreenProps = {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (selectedOption: string | null) => void;
  timerKey: string;
  secondsPerQuestion?: number;
};

type QuestionTimerProps = {
  timerKey: string;
  secondsPerQuestion: number;
  onTimeout: () => void;
};

const QuestionTimer: React.FC<QuestionTimerProps> = React.memo(({ timerKey, secondsPerQuestion, onTimeout }) => {
  const [timer, setTimer] = useState(secondsPerQuestion);
  const timeoutTriggeredRef = useRef(false);

  useEffect(() => {
    timeoutTriggeredRef.current = false;
    setTimer(secondsPerQuestion);
  }, [timerKey, secondsPerQuestion]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (!timeoutTriggeredRef.current) {
            timeoutTriggeredRef.current = true;
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [onTimeout, timerKey]);

  const isLowTime = timer <= 5;
  const progressRatio = timer / secondsPerQuestion;

  return (
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-sm">
        <circle
          cx="50%" cy="50%" r="45%"
          className="fill-none stroke-white/50 stroke-[4]"
        />
        <circle
          cx="50%" cy="50%" r="45%"
          className={`fill-none stroke-[4] transition-all duration-1000 ease-linear ${isLowTime ? 'stroke-red-500 shadow-red-500' : 'stroke-pink-500 shadow-pink-500'}`}
          strokeDasharray="100"
          strokeDashoffset={100 - (progressRatio * 100)}
          pathLength="100"
        />
      </svg>
      <motion.div
        animate={isLowTime ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className={`bg-white/90 backdrop-blur-md shadow-inner w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-black ${isLowTime ? 'text-red-600' : 'text-slate-800'}`}
      >
        {timer}
      </motion.div>
    </div>
  );
});

QuestionTimer.displayName = 'QuestionTimer';

const QuizScreen: React.FC<QuizScreenProps> = React.memo(
  ({
    question,
    questionIndex,
    totalQuestions,
    onAnswer,
    timerKey,
    secondsPerQuestion = 20
  }) => {
    const { players, currentPlayerIdx } = useAppStore();
    const playerName = players[currentPlayerIdx]?.name ?? 'Jokalaria';
    const answeredRef = useRef(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    useEffect(() => {
      answeredRef.current = false;
      setSelectedKey(null);
    }, [timerKey]);

    const optionEntries = useMemo(() => Object.entries(question.opciones), [question]);
    const handleTimeout = useCallback(() => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      onAnswer(null);
    }, [onAnswer]);

    // Variantes Framer para las tarjetas de preguntas
    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10, scale: 0.98 },
      show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } }
    };

    return (
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto py-4 px-4 sm:px-6 relative z-10 overflow-hidden">
        {/* Encabezado e Información */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 truncate">{playerName}</span>
              <span className="text-[10px] sm:text-xs font-bold text-pink-500 uppercase px-2 py-0.5 rounded-md bg-pink-100/90 shadow-sm truncate text-right border border-pink-200">{question.categoryName}</span>
            </div>
            {/* Barra de Progreso Mejorada */}
            <div className="flex gap-1.5 h-2 w-full">
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-300 ${i === questionIndex
                    ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)] scale-110'
                    : i < questionIndex
                      ? 'bg-emerald-400 opacity-60'
                      : 'bg-white/60 shadow-inner'
                    }`}
                />
              ))}
            </div>
          </div>
          <QuestionTimer
            timerKey={timerKey}
            secondsPerQuestion={secondsPerQuestion}
            onTimeout={handleTimeout}
          />
        </div>

        {/* Caja de Pregunta y Respuestas */}
        <motion.div
          key={timerKey}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 flex flex-col min-h-0 w-full"
        >
          {/* Cuestión */}
          <motion.div variants={itemVariants} className="glassmorphism rounded-[2rem] p-6 sm:p-8 mb-4 sm:mb-6 flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-800">
              <AlertCircle size={80} />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 leading-snug lg:leading-normal relative z-10">
              "{question.pregunta}"
            </h3>
          </motion.div>

          {/* Opciones */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto pb-6 custom-scrollbar">
            {optionEntries.map(([key, value]) => {
              const isSelected = selectedKey === key;
              const isOtherSelected = selectedKey !== null && !isSelected;

              return (
                <motion.button
                  variants={itemVariants}
                  key={key}
                  whileHover={!selectedKey ? { scale: 1.02 } : {}}
                  whileTap={!selectedKey ? { scale: 0.96 } : {}}
                  onClick={() => {
                    if (answeredRef.current) return;
                    answeredRef.current = true;
                    setSelectedKey(key);
                    // Añadir una ligera vibración al seleccionar si el dispositivo lo soporta
                    if (navigator.vibrate) navigator.vibrate(50);

                    setTimeout(() => {
                      onAnswer(key);
                    }, 400);
                  }}
                  disabled={selectedKey !== null}
                  className={`group relative w-full text-left px-5 sm:px-6 py-4 rounded-3xl border shadow-sm transition-all flex items-center gap-4 ${isSelected
                    ? "border-pink-500 bg-pink-50/90 shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-[1.02] z-10"
                    : isOtherSelected
                      ? "border-white/20 bg-white/40 opacity-50 grayscale-[50%]"
                      : "border-white/40 bg-white/70 backdrop-blur-md hover:shadow-lg hover:border-pink-300 hover:bg-white"
                    }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-3xl transition-colors ${isSelected ? "bg-pink-500" : "bg-transparent group-hover:bg-pink-400"
                    }`} />

                  <span className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 transition-all ${isSelected
                    ? "bg-pink-500 text-white shadow-md scale-110"
                    : "bg-pink-50 text-pink-600 group-hover:bg-pink-100 group-hover:text-pink-700"
                    }`}>
                    {isSelected ? <Check strokeWidth={4} className="w-6 h-6 sm:w-8 sm:h-8" /> : key.toUpperCase()}
                  </span>

                  <span className={`font-bold text-base sm:text-lg leading-tight break-words pr-2 transition-colors ${isSelected ? "text-pink-800" : "text-slate-700"
                    }`}>
                    {value}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }
);

QuizScreen.displayName = 'QuizScreen';
export default QuizScreen;
