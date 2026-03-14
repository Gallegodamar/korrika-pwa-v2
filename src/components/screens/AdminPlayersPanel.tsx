import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  History,
  PencilLine,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Users
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import {
  AdminUserDirectoryEntry,
  adminChangeUsername,
  adminClearUserGameResults,
  getAdminUsers,
  getAdminUsernameTimeline
} from '../../services/adminApi';
import { UsernameHistoryEntry } from '../../services/accountApi';
import { DAYS_COUNT } from '../../utils/constants';

const formatAdminDate = (value: string | null) => {
  if (!value) return 'Ez dago datarik';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('eu-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

const getTimelineSourceLabel = (entry: UsernameHistoryEntry) => {
  if (entry.source === 'self_service') return 'Jokalariak aldatua';
  if (entry.source === 'admin_panel') return 'Administrazioak aldatua';
  return 'Sistemak erregistratua';
};

const AdminPlayersPanel: React.FC = React.memo(() => {
  const {
    user,
    fetchLeaderboards,
    fetchUserDailyPlays
  } = useAppStore(useShallow((state) => ({
    user: state.user,
    fetchLeaderboards: state.fetchLeaderboards,
    fetchUserDailyPlays: state.fetchUserDailyPlays
  })));

  const [searchInput, setSearchInput] = useState('');
  const [directory, setDirectory] = useState<AdminUserDirectoryEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<UsernameHistoryEntry[]>([]);
  const [renameInput, setRenameInput] = useState('');
  const [deleteScope, setDeleteScope] = useState<'all' | string>('all');
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [savingRename, setSavingRename] = useState(false);
  const [deletingResults, setDeletingResults] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDirectory = useCallback(async (searchValue: string) => {
    setLoadingDirectory(true);
    setDirectoryError(null);

    try {
      const nextEntries = await getAdminUsers(searchValue, 100);
      setDirectory(nextEntries);
      setSelectedUserId((current) => {
        if (current && nextEntries.some((entry) => entry.user_id === current)) {
          return current;
        }
        return nextEntries[0]?.user_id ?? null;
      });
    } catch (error) {
      setDirectory([]);
      setSelectedUserId(null);
      setDirectoryError(error instanceof Error ? error.message : 'Ezin izan dira jokalariak kargatu.');
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  const loadTimeline = useCallback(async (userId: string) => {
    setLoadingTimeline(true);
    setTimelineError(null);

    try {
      const nextTimeline = await getAdminUsernameTimeline(userId);
      setTimeline(nextTimeline);
    } catch (error) {
      setTimeline([]);
      setTimelineError(error instanceof Error ? error.message : 'Ezin izan da izen-historia kargatu.');
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  useEffect(() => {
    void loadDirectory('');
  }, [loadDirectory]);

  useEffect(() => {
    if (!selectedUserId) {
      setTimeline([]);
      return;
    }

    void loadTimeline(selectedUserId);
  }, [loadTimeline, selectedUserId]);

  const selectedUser = useMemo(
    () => directory.find((entry) => entry.user_id === selectedUserId) ?? null,
    [directory, selectedUserId]
  );
  const isOwnAccountSelected = Boolean(selectedUser && user?.id === selectedUser.user_id);

  useEffect(() => {
    setRenameInput(selectedUser?.current_username ?? '');
    setDeleteScope('all');
    setActionError(null);
    setActionNotice(null);
  }, [selectedUser?.current_username, selectedUser?.user_id]);

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadDirectory(searchInput);
  };

  const handleRefresh = async () => {
      await loadDirectory(searchInput);
      if (selectedUserId) {
        await loadTimeline(selectedUserId);
      }
  };

  const handleRename = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser || isOwnAccountSelected) return;

    setSavingRename(true);
    setActionError(null);
    setActionNotice(null);

    try {
      const result = await adminChangeUsername(selectedUser.user_id, renameInput, 'admin_console');
      await Promise.all([
        loadDirectory(searchInput),
        loadTimeline(selectedUser.user_id),
        fetchLeaderboards(true)
      ]);
      setActionNotice(
        `${result.old_username.toUpperCase()} -> ${result.new_username.toUpperCase()}`
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ezin izan da izena aldatu.');
    } finally {
      setSavingRename(false);
    }
  };

  const handleDeleteResults = async () => {
    if (!selectedUser || isOwnAccountSelected) return;

    const targetDayIndex = deleteScope === 'all' ? null : Number(deleteScope);
    const confirmationMessage =
      targetDayIndex === null
        ? `${selectedUser.current_username.toUpperCase()} erabiltzailearen emaitza guztiak ezabatu nahi dituzu?`
        : `${selectedUser.current_username.toUpperCase()} erabiltzailearen ${targetDayIndex + 1}. eguneko emaitza ezabatu nahi duzu?`;

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setDeletingResults(true);
    setActionError(null);
    setActionNotice(null);

    try {
      const result = await adminClearUserGameResults(selectedUser.user_id, targetDayIndex);
      await Promise.all([
        loadDirectory(searchInput),
        fetchLeaderboards(true),
        user?.id === selectedUser.user_id ? fetchUserDailyPlays(undefined, true) : Promise.resolve()
      ]);
      setActionNotice(`${result.deleted_rows} emaitza ezabatu dira.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ezin izan dira emaitzak ezabatu.');
    } finally {
      setDeletingResults(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <Users size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Jokalariak</h3>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">
              Bilatu eta kudeatu
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2">
          <label className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Erabiltzaile izena bilatu"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-sky-400"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-sky-600 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-sky-700"
          >
            Bilatu
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-600"
            aria-label="Eguneratu"
            title="Eguneratu"
          >
            <RefreshCw size={16} />
          </button>
        </form>

        {directoryError && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {directoryError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {loadingDirectory && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-500">
              Jokalari-zerrenda kargatzen...
            </div>
          )}

          {!loadingDirectory && directory.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-black text-slate-700">Ez da jokalaririk aurkitu.</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Egiaztatu bilaketa edo kargatu datuak berriro
              </p>
            </div>
          )}

          {directory.map((entry) => {
            const isSelected = entry.user_id === selectedUserId;

            return (
              <button
                key={entry.user_id}
                type="button"
                onClick={() => setSelectedUserId(entry.user_id)}
                className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
                  isSelected
                    ? 'border-sky-300 bg-sky-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-slate-900">
                      {entry.current_username.toUpperCase()}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {entry.played_days} egun jokatuak
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {entry.total_points} puntu
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                    {entry.rename_count} izen-aldaketa
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {entry.self_service_change_count} norberak
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    {entry.admin_change_count} administrazioz
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
      >
        {!selectedUser && (
          <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <Shield className="mb-3 text-slate-300" size={36} />
            <p className="text-lg font-black text-slate-700">Hautatu jokalari bat</p>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
              Hemen ikusiko dituzu kontuaren izen-historia, jokoaren datuak eta administrazio-ekintzak.
            </p>
          </div>
        )}

        {selectedUser && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-[1.5rem] bg-[linear-gradient(135deg,#e0f2fe,#ffffff)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-600">
                  Kontu aktiboa
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  {selectedUser.current_username.toUpperCase()}
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Sortua: {formatAdminDate(selectedUser.created_at)}
                </p>
                <p className="text-sm font-medium text-slate-600">
                  Azken partida: {formatAdminDate(selectedUser.last_played_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
                  {selectedUser.played_days} egun
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
                  {selectedUser.total_points} puntu
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-600 shadow-sm">
                  {selectedUser.status}
                </span>
              </div>
            </div>

            {isOwnAccountSelected && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                Zure kontua hautatu duzu. Zure izena aldatzeko, erabili Profila atala. Emaitzak ezabatzeko admin-ekintza hau desgaituta dago.
              </div>
            )}

            {(actionError || actionNotice) && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  actionError
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {actionError || actionNotice}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Izen zaharrak
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {selectedUser.previous_usernames.length}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Norberak egindakoak
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {selectedUser.self_service_change_count}
                </p>
              </article>
              <article className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Administrazioz egindakoak
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {selectedUser.admin_change_count}
                </p>
              </article>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-sky-600" />
                  <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                    Izenen historia
                  </h4>
                </div>

                {selectedUser.previous_usernames.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedUser.previous_usernames.map((username) => (
                      <span
                        key={username}
                        className="rounded-full border border-sky-100 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-700"
                      >
                        {username}
                      </span>
                    ))}
                  </div>
                )}

                {timelineError && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {timelineError}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {loadingTimeline && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center text-sm font-bold text-slate-500">
                      Historia kargatzen...
                    </div>
                  )}

                  {!loadingTimeline && timeline.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm font-bold text-slate-500">
                      Ez dago aldaketa erregistraturik.
                    </div>
                  )}

                  {timeline.map((entry) => (
                    <article
                      key={`${entry.change_id}-${entry.changed_at}`}
                      className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-700">
                          {(entry.old_username || 'hasierakoa').toUpperCase()}
                        </span>
                        <span className="text-xs font-black text-sky-500">{'->'}</span>
                        <span className="text-sm font-black text-slate-900">
                          {entry.new_username.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                          {getTimelineSourceLabel(entry)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {formatAdminDate(entry.changed_at)}
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          Arrazoia: {entry.reason}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <form
                  onSubmit={handleRename}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <PencilLine size={18} className="text-fuchsia-600" />
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                      Izena aldatu
                    </h4>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Administrazioz egindako aldaketak historian markatuta geratzen dira.
                  </p>
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(event) => setRenameInput(event.target.value)}
                    disabled={savingRename || isOwnAccountSelected}
                    placeholder="Erabiltzaile izen berria"
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={savingRename || isOwnAccountSelected || !renameInput.trim()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingRename ? <RefreshCw size={16} className="animate-spin" /> : <PencilLine size={16} />}
                    Izena eguneratu
                  </button>
                </form>

                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Trash2 size={18} className="text-rose-600" />
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-rose-800">
                      Joko datuak ezabatu
                    </h4>
                  </div>
                  <p className="mt-2 text-sm font-medium text-rose-700">
                    Honek sailkapenean eta eguneroko historian eragina du. Eragiketa hau ezin da desegin.
                  </p>

                  <label className="mt-4 block">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
                      Ezabatu beharreko zatia
                    </span>
                    <select
                      value={deleteScope}
                      onChange={(event) => setDeleteScope(event.target.value)}
                      disabled={deletingResults || isOwnAccountSelected}
                      className="mt-2 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="all">Emaitza guztiak</option>
                      {Array.from({ length: DAYS_COUNT }).map((_, index) => (
                        <option key={index} value={String(index)}>
                          {index + 1}. eguneko emaitzak
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={handleDeleteResults}
                    disabled={deletingResults || isOwnAccountSelected}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingResults ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Emaitzak ezabatu
                  </button>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-slate-500" />
                    <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                      Oharra
                    </h4>
                  </div>
                  <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                    <p>Jokalariak berak egindako izen-aldaketak eta administrazioak egindakoak bereizita geratzen dira.</p>
                    <p>Izena aldatzean, sailkapeneko aurreko emaitzen izena ere eguneratzen da koherentzia mantentzeko.</p>
                    <p>Desadostasunik badago, eguneratu zerrenda eta historiaren panela berriro.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
});

AdminPlayersPanel.displayName = 'AdminPlayersPanel';

export default AdminPlayersPanel;
