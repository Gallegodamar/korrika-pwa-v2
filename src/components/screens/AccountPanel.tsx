import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle2, XCircle, Clock, ShieldAlert, BadgeCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { changeMyUsername, mapAccountApiError } from '../../services/accountApi';
import { useShallow } from 'zustand/react/shallow';

const formatChangeDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('eu-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

const getHistorySourceLabel = (source: string) => {
  if (source === 'self_service') return 'Zuk egina';
  if (source === 'admin_panel') return 'Administrazioak egina';
  return 'Sistemak egina';
};

const AccountPanel: React.FC = React.memo(() => {
  const {
    user,
    accountIdentity,
    usernameHistory,
    pendingUsername,
    usernameChangeError,
    usernameChangeNotice,
    loadingAccount,
    setPendingUsername,
    setUsernameChangeError,
    setUsernameChangeNotice,
    fetchAccountIdentity,
    fetchRegisteredPlayers
  } = useAppStore(useShallow((state) => ({
    user: state.user,
    accountIdentity: state.accountIdentity,
    usernameHistory: state.usernameHistory,
    pendingUsername: state.pendingUsername,
    usernameChangeError: state.usernameChangeError,
    usernameChangeNotice: state.usernameChangeNotice,
    loadingAccount: state.loadingAccount,
    setPendingUsername: state.setPendingUsername,
    setUsernameChangeError: state.setUsernameChangeError,
    setUsernameChangeNotice: state.setUsernameChangeNotice,
    fetchAccountIdentity: state.fetchAccountIdentity,
    fetchRegisteredPlayers: state.fetchRegisteredPlayers
  })));

  const [changingUsername, setChangingUsername] = useState(false);
  const isAdmin = Boolean(accountIdentity?.is_admin);

  const currentUsername =
    accountIdentity?.current_username ||
    user?.user_metadata?.username ||
    user?.email ||
    'Jokalaria';
  const previousUsernames = accountIdentity?.previous_usernames || [];

  const handleSubmitUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameChangeError(null);
    setUsernameChangeNotice(null);

    if (!pendingUsername.trim()) return;

    try {
      setChangingUsername(true);
      const result = await changeMyUsername(pendingUsername.trim());
      await Promise.all([fetchAccountIdentity(), fetchRegisteredPlayers(true)]);
      setUsernameChangeNotice(
        `${result.old_username.toUpperCase()} \u2192 ${result.new_username.toUpperCase()}`
      );
      setPendingUsername('');
    } catch (err: any) {
      if (err?.code || err?.details || err?.hint) {
        setUsernameChangeError(mapAccountApiError(err));
      } else {
        setUsernameChangeError(err?.message || 'Ezin izan da erabiltzaile izena aldatu.');
      }
    } finally {
      setChangingUsername(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
  };

  return (
    <motion.section variants={itemVariants} className="w-full">
      <div className="glassmorphism rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-sky-500">
          <User size={100} />
        </div>

        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <User size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-sky-700/80 mb-1">
                Kontuaren Izena
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
                  {currentUsername.toUpperCase()}
                </h3>
                <BadgeCheck className="text-sky-500" size={20} />
              </div>
            </div>
          </div>
          {loadingAccount && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100 shadow-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-sky-500"></div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">Karga</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitUsernameChange} className="space-y-4 relative z-10 bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-sky-100">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2">
              Erabiltzaile izen berria
            </label>
            <div className="relative">
              <input
                type="text"
                value={pendingUsername}
                onChange={(e) => setPendingUsername(e.target.value)}
                placeholder="Idatzi hemen..."
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={32}
                className="w-full rounded-xl border-2 border-sky-100 bg-white px-4 py-3.5 text-base sm:text-lg font-bold text-gray-800 outline-none transition-all focus:border-sky-400 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.15)] placeholder:text-gray-400"
              />
            </div>
            <p className="mt-2 text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <ShieldAlert size={14} className="text-sky-500/70" />
              3-32 karaktere: a-z, 0-9 eta _. Zuriunerik ez. (Bakarrik saio berrietarako)
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {usernameChangeError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3"
              >
                <XCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs sm:text-sm font-bold text-rose-700 leading-snug">{usernameChangeError}</p>
              </motion.div>
            )}
            {usernameChangeNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3"
              >
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs sm:text-sm font-bold text-emerald-700 leading-snug">{usernameChangeNotice}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={changingUsername || loadingAccount || !pendingUsername.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 hover:shadow-lg disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {changingUsername ? 'Aldatzen...' : 'Gorde izen berria'}
          </motion.button>
        </form>

        {isAdmin && (previousUsernames.length > 0 || usernameHistory.length > 0) && (
          <div className="mt-6 pt-6 border-t border-sky-100/50 space-y-5 relative z-10">
            {previousUsernames.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  Aurreko erabiltzaile izenak
                </p>
                <div className="flex flex-wrap gap-2">
                  {previousUsernames.map((username) => (
                    <span
                      key={username}
                      className="rounded-lg bg-sky-50/80 px-3 py-1.5 text-[11px] sm:text-xs font-black text-sky-700/70 border border-sky-100/50"
                    >
                      {username}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {usernameHistory.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} />
                  Azken aldaketak
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {usernameHistory.map((entry) => (
                    <article
                      key={`${entry.change_id}-${entry.changed_at}`}
                      className="rounded-xl border border-sky-50 bg-white/60 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-500 max-w-[40%] truncate">
                          {(entry.old_username || currentUsername).toUpperCase()}
                        </span>
                        <span className="text-sky-400 text-xs font-black">\u2192</span>
                        <span className="text-xs sm:text-sm font-black text-sky-700 max-w-[40%] truncate">
                          {entry.new_username.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400/80">
                        {formatChangeDate(entry.changed_at)}
                      </p>
                      <p className="mt-2 inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-700">
                        {getHistorySourceLabel(entry.source)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
});

AccountPanel.displayName = 'AccountPanel';
export default AccountPanel;
