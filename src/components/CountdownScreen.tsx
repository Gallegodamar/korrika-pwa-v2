import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

type CountdownScreenProps = {
  onComplete: () => void;
  startFrom?: number;
};

const CountdownScreen: React.FC<CountdownScreenProps> = React.memo(
  ({ onComplete, startFrom = 3 }) => {
    const { players, currentPlayerIdx } = useAppStore(useShallow((state) => ({
      players: state.players,
      currentPlayerIdx: state.currentPlayerIdx
    })));
    const playerName = players[currentPlayerIdx]?.name ?? 'Jokalaria';
    const [countdown, setCountdown] = useState(startFrom);

    useEffect(() => {
      setCountdown(startFrom);
    }, [startFrom, playerName]);

    useEffect(() => {
      if (countdown <= 0) {
        // Un ligero delay antes de lanzar onComplete para mostrar "HASI" fluidamente
        const timer = setTimeout(() => onComplete(), 800);
        return () => clearTimeout(timer);
      }

      const timerId = window.setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => window.clearTimeout(timerId);
    }, [countdown, onComplete]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
      >
        {/* Efectos de fondo radial premium */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="absolute w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[60vw] h-[60vw] max-w-[300px] max-h-[300px] bg-fuchsia-400/20 rounded-full blur-2xl"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block glassmorphism px-8 py-3 rounded-full border border-pink-200/50 shadow-xl bg-white/50 backdrop-blur-md"
          >
            <span className="text-pink-600 font-bold uppercase tracking-[0.25em] text-sm sm:text-base">
              {playerName}
            </span>
            <span className="text-gray-500 font-medium uppercase tracking-widest text-xs sm:text-sm ml-2">
              prest?
            </span>
          </motion.div>

          <div className="h-48 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
                transition={{
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className="text-[clamp(6rem,30vw,12rem)] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-fuchsia-700 filter drop-shadow-md"
              >
                {countdown === 0 ? 'HASI!' : countdown}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }
);

CountdownScreen.displayName = 'CountdownScreen';

export default CountdownScreen;
