import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Lock } from 'lucide-react';
import { DAYS_COUNT } from '../../utils/constants';

type HistoryScreenProps = {
    completedDayIndexes: number[];
    onReviewDay: (dayIndex: number) => void;
    nextAvailableDay: number;
    currentChallengeDayIndex: number;
};

const HistoryScreen: React.FC<HistoryScreenProps> = React.memo(({ completedDayIndexes, onReviewDay, nextAvailableDay, currentChallengeDayIndex }) => {
    const todayUnlockedIndex =
        nextAvailableDay === -5
            ? DAYS_COUNT - 1
            :
        nextAvailableDay === -1 || nextAvailableDay === -2
            ? currentChallengeDayIndex
            : nextAvailableDay;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 10 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
    };

    return (
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pt-6 pb-28 px-4 sm:px-6 relative z-10 w-full">
            <div className="mb-6 flex items-center justify-between pl-2">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-slate-800 tracking-tight">
                        Ibilbidea
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Zure eguneroko historia
                    </p>
                </div>
                <div className="w-12 h-12 rounded-[1.25rem] bg-pink-100 flex items-center justify-center text-pink-500 shadow-inner">
                    <Calendar size={24} strokeWidth={2.5} />
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 w-full"
            >
                {Array.from({ length: DAYS_COUNT }).map((_, idx) => {
                    const isCompleted = completedDayIndexes.includes(idx);
                    const isCurrentDay = idx === todayUnlockedIndex;
                    const isAvailable = todayUnlockedIndex >= 0 && idx <= todayUnlockedIndex;
                    const isLocked = !isCompleted && !isAvailable;

                    return (
                        <motion.button
                            key={idx}
                            variants={itemVariants}
                            onClick={() => isCompleted && onReviewDay(idx)}
                            disabled={!isCompleted}
                            className={`
                relative flex flex-col items-center justify-center aspect-square rounded-[1.25rem] border-2 transition-all p-2
                ${isCompleted
                                    ? 'bg-transparent border-emerald-500 text-emerald-700 shadow-[0_5px_15px_-5px_rgba(16,185,129,0.2)] hover:bg-emerald-50 active:scale-95 cursor-pointer cursor-allowed'
                                    : isLocked
                                        ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
                                        : isCurrentDay
                                            ? 'bg-pink-50 border-pink-300 text-pink-600 shadow-sm cursor-not-allowed'
                                            : 'bg-white border-slate-200 text-slate-400 shadow-sm cursor-not-allowed'
                                }
              `}
                        >
                            <span className="text-sm font-black tracking-widest uppercase mb-1 opacity-70">
                                {idx + 1}. EG
                            </span>

                            {isCompleted ? (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-center leading-none text-emerald-600/70">Berrikusi</span>
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                </div>
                            ) : isCurrentDay ? (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-center leading-none text-pink-600/80">Gaur</span>
                                    <Calendar size={22} className="text-pink-500" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold text-center leading-none text-slate-400">
                                        {isLocked ? 'Blokeatuta' : 'Jokatu gabe'}
                                    </span>
                                    <Lock size={20} className="text-slate-300" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>

            {completedDayIndexes.length === 0 && (
                <div className="mt-12 text-center p-8 glassmorphism rounded-3xl border border-slate-200/50 text-slate-500">
                    <Calendar className="mx-auto mb-3 opacity-20" size={48} />
                    <p className="font-bold text-lg text-slate-700">Oraindik ez duzu egunik jokatu</p>
                    <p className="text-xs font-medium mt-1">Joan Hasiera atalera eta hasi gaurko erronka.</p>
                </div>
            )}
        </div>
    );
});

HistoryScreen.displayName = 'HistoryScreen';
export default HistoryScreen;
