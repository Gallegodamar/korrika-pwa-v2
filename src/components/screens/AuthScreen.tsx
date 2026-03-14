import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GameState } from '../../types';
import { loginWithUsername } from '../../services/authApi';
import { useShallow } from 'zustand/react/shallow';

const AuthScreen: React.FC = React.memo(() => {
  const {
    setUser,
    setGameState,
    setCurrentTab,
    loadingAuth,
    setLoadingAuth,
    setDailyPlayLockMessage
  } = useAppStore(useShallow((state) => ({
    setUser: state.setUser,
    setGameState: state.setGameState,
    setCurrentTab: state.setCurrentTab,
    loadingAuth: state.loadingAuth,
    setLoadingAuth: state.setLoadingAuth,
    setDailyPlayLockMessage: state.setDailyPlayLockMessage
  })));

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      setLocalError('Idatzi erabiltzaile izena saioa hasteko.');
      return;
    }

    setLoadingAuth(true);
    try {
      const session = await loginWithUsername(normalizedUsername, password);

      if (session.user) {
        setUser(session.user);
        setDailyPlayLockMessage(null);
        setCurrentTab('home');
        setGameState(GameState.HOME);
      }
    } catch (err: any) {
      console.error('Supabase Login Error:', err);
      setLocalError(err.message || 'Errorea saioa hastean');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleDevBypass = (e: React.MouseEvent) => {
    e.preventDefault();
    setUser({
      id: 'dev-bypass-id',
      app_metadata: { provider: 'email' },
      user_metadata: { name: 'admin' },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as any);
    setCurrentTab('home');
    setGameState(GameState.HOME);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full relative z-10 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glassmorphism p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-white/60 backdrop-blur-md w-full max-w-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-pink-500">
          <Lock size={120} />
        </div>

        <div className="text-center mb-6 sm:mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl korrika-bg-gradient shadow-lg shadow-pink-500/30 text-white mb-4">
            <User size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-slate-800 tracking-tight flex items-center justify-center gap-2">
            Sartu <span className="text-pink-500">Lekukoan</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-2">
            Erabiltzaile kodea behar duzu
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
              Erabiltzailea (k_XXXX)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setLocalError(null);
                }}
                placeholder="Idatzi zure kodea"
                className="w-full bg-white/50 border-2 border-white focus:border-pink-400 rounded-2xl pl-11 pr-4 py-3.5 text-base sm:text-lg font-bold text-slate-700 outline-none transition-all shadow-inner focus:shadow-[0_0_0_4px_rgba(236,72,153,0.15)] placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">
              Pasahitza
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError(null);
                }}
                placeholder="********"
                className="w-full bg-white/50 border-2 border-white focus:border-pink-400 rounded-2xl pl-11 pr-12 py-3.5 text-base sm:text-lg font-bold text-slate-700 outline-none transition-all shadow-inner focus:shadow-[0_0_0_4px_rgba(236,72,153,0.15)] placeholder:text-slate-300 tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 inset-y-0 flex items-center justify-center p-2 text-slate-400 hover:text-pink-500 transition-colors rounded-xl hover:bg-pink-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {localError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50/80 backdrop-blur-sm p-3.5 rounded-2xl border border-rose-200/50 flex items-start gap-3 mt-4 overflow-hidden"
              >
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs sm:text-sm text-rose-700 font-bold leading-snug">{localError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loadingAuth || !username || !password}
            type="submit"
            className="w-full korrika-bg-gradient text-white py-4 mt-6 rounded-[1.25rem] font-black uppercase tracking-widest italic text-sm sm:text-base shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loadingAuth ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sartzen...
                </>
              ) : (
                'SARTU'
              )}
            </span>
          </motion.button>

          {import.meta.env.DEV && (
            <button
              onClick={handleDevBypass}
              type="button"
              className="w-full mt-4 bg-slate-50/80 text-slate-500 border border-slate-200 py-3 rounded-[1.25rem] font-bold text-[11px] sm:text-xs hover:bg-slate-100 hover:text-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <AlertTriangle size={14} className="text-amber-500" />
              Sartu Simulagailuan (Dev)
            </button>
          )}
        </form>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-8"
      >
        AEK - EUSKARA BIZIRIK
      </motion.p>
    </div>
  );
});

AuthScreen.displayName = 'AuthScreen';
export default AuthScreen;
