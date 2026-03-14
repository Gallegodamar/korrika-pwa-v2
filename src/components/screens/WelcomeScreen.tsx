import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Route, Sparkles } from 'lucide-react';

type WelcomeScreenProps = {
  onContinue: () => void;
};

const MESSAGE_LINES = [
  'Kaixo! Ongi etorri!',
  'Korrikaren inguruko jolas honetara.',
  'Eutsi hamaika egunez!',
  'Parte hartu, ikasi eta gozatu.'
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = React.memo(({ onContinue }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 220, damping: 22 }
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8 custom-scrollbar">
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex min-h-full w-full max-w-4xl items-center justify-center"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 left-[8%] h-40 w-40 rounded-full bg-pink-400/18 blur-3xl" />
          <div className="absolute right-[8%] top-[14%] h-52 w-52 rounded-full bg-amber-300/16 blur-3xl" />
          <div className="absolute -bottom-8 left-[20%] h-48 w-48 rounded-full bg-fuchsia-400/12 blur-3xl" />
          <div className="absolute bottom-[8%] right-[12%] h-44 w-44 rounded-full bg-sky-300/14 blur-3xl" />
        </div>

        <motion.div
          variants={itemVariants}
          className="relative w-full overflow-hidden rounded-[2.75rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(255,246,250,0.9))] p-6 shadow-[0_24px_80px_-28px_rgba(233,30,99,0.4)] backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.15),transparent_28%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full border-[18px] border-pink-100/60" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 -translate-x-10 translate-y-8 rounded-full border-[16px] border-amber-100/70" />

          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.9fr] lg:gap-8">
            <div className="space-y-5">
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-pink-600 shadow-sm"
              >
                <Sparkles size={14} />
                Lehenengo geldialdia
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-3">
                <h2 className="max-w-xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 sm:text-5xl">
                  {MESSAGE_LINES[0]}
                </h2>
                <p className="max-w-2xl text-lg font-semibold leading-relaxed text-slate-600 sm:text-xl">
                  {MESSAGE_LINES[1]}
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-3">
                <div className="inline-flex items-center rounded-[1.75rem] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_35px_-18px_rgba(236,72,153,0.75)] sm:text-base">
                  {MESSAGE_LINES[2]}
                </div>
                <p className="max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
                  {MESSAGE_LINES[3]}
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="grid gap-3 sm:grid-cols-2"
              >
                <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-4 shadow-sm">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                    <CalendarDays size={18} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Erritmoa</p>
                  <p className="mt-1 text-base font-black text-slate-800">11 eguneko erronka</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-4 shadow-sm">
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <Route size={18} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Helburua</p>
                  <p className="mt-1 text-base font-black text-slate-800">Ikasi eta gozatu bidean</p>
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onContinue}
                className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.6rem] bg-slate-900 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_45px_-22px_rgba(15,23,42,0.8)] transition-all hover:bg-slate-800 sm:w-auto sm:min-w-[16rem]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                <span className="relative z-10">Hasi erronka</span>
                <ArrowRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" size={18} />
              </motion.button>
            </div>

            <motion.aside
              variants={itemVariants}
              className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-5 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)] sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.34),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.28),transparent_26%)]" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-pink-200">Prest?</p>
                <h3 className="mt-3 text-2xl font-black uppercase leading-tight">
                  Zure korrika gaur hasten da
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Egun bakoitza etapa bat da. Eutsi erritmoari, ikasi bidean eta iritsi helmugara indartsu.
                </p>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                    <span>11 egun</span>
                    <span>KORRIKA</span>
                  </div>
                  <div className="mt-4 grid grid-cols-11 gap-1.5">
                    {Array.from({ length: 11 }, (_, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0.45, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + idx * 0.04, duration: 0.25 }}
                        className={`h-3 rounded-full ${idx === 10 ? 'bg-amber-300' : idx % 2 === 0 ? 'bg-pink-400' : 'bg-white/55'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Giroa</p>
                    <p className="mt-1 text-sm font-bold text-white">Jolasa, kultura eta motibazioa egunero</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Helmuga</p>
                    <p className="mt-1 text-sm font-bold text-white">Parte hartu eta gozatu amaierara arte</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

export default WelcomeScreen;
