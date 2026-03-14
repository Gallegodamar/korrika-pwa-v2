import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Medal, Trophy } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { GameState } from '../../types';
import { buildRanking, RankingEntry } from '../../utils/ranking';

type RankingRow = RankingEntry & {
  position: number;
};

const TOP_VISIBLE_ROWS = 10;

const getPositionStyles = (position: number) => {
  if (position === 1) {
    return {
      rowClass: 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-white',
      pointsClass: 'text-yellow-500',
      labelClass: 'bg-yellow-100 text-yellow-700',
      medalClass: 'text-yellow-500'
    };
  }

  if (position === 2) {
    return {
      rowClass: 'border-slate-200 bg-gradient-to-r from-slate-50 to-white',
      pointsClass: 'text-slate-500',
      labelClass: 'bg-slate-200 text-slate-600',
      medalClass: 'text-slate-400'
    };
  }

  if (position === 3) {
    return {
      rowClass: 'border-orange-200 bg-gradient-to-r from-orange-50 to-white',
      pointsClass: 'text-orange-500',
      labelClass: 'bg-orange-100 text-orange-700',
      medalClass: 'text-orange-500'
    };
  }

  return {
    rowClass: 'border-slate-200 bg-white/80',
    pointsClass: 'text-pink-500',
    labelClass: 'bg-slate-100 text-slate-500',
    medalClass: 'text-slate-300'
  };
};

const RankingScreen: React.FC = React.memo(() => {
  const {
    user,
    accountIdentity,
    players,
    leaderboardRows,
    registeredPlayers,
    loadingRanking,
    gameState,
    setGameState,
    setCurrentTab
  } = useAppStore(useShallow((state) => ({
    user: state.user,
    accountIdentity: state.accountIdentity,
    players: state.players,
    leaderboardRows: state.leaderboardRows,
    registeredPlayers: state.registeredPlayers,
    loadingRanking: state.loadingRanking,
    gameState: state.gameState,
    setGameState: state.setGameState,
    setCurrentTab: state.setCurrentTab
  })));

  const isCompetitionResults = gameState === GameState.RANKING;

  const currentPlayerName = useMemo(() => {
    const identityName = accountIdentity?.current_username?.trim();
    if (identityName) return identityName.toUpperCase();

    const userMetadata = user?.user_metadata as { username?: string; name?: string } | undefined;
    const metadataName = userMetadata?.username?.trim() || userMetadata?.name?.trim();
    if (metadataName) return metadataName.toUpperCase();

    const fallbackEmailName = user?.email?.split('@')[0]?.trim();
    return fallbackEmailName ? fallbackEmailName.toUpperCase() : '';
  }, [accountIdentity?.current_username, user?.email, user?.user_metadata]);

  const rankingRows = useMemo<RankingRow[]>(() => {
    if (isCompetitionResults) {
      return [...players]
        .sort((left, right) => right.score - left.score)
        .map((player, index) => ({
          id: `${player.name}-${index}`,
          userId: null,
          playerName: player.name,
          points: player.score,
          games: 1,
          position: index + 1
        }));
    }

    return buildRanking(leaderboardRows, registeredPlayers).map((entry, index) => ({
      ...entry,
      position: index + 1
    }));
  }, [isCompetitionResults, leaderboardRows, players, registeredPlayers]);

  const visibleRows = useMemo(() => {
    if (isCompetitionResults) return rankingRows;
    return rankingRows.slice(0, TOP_VISIBLE_ROWS);
  }, [isCompetitionResults, rankingRows]);

  const currentUserRow = useMemo(() => {
    if (isCompetitionResults) return null;

    const byUserId = user?.id
      ? rankingRows.find((row) => row.userId === user.id)
      : null;

    const byPlayerName = currentPlayerName
      ? rankingRows.find((row) => row.playerName === currentPlayerName)
      : null;

    const matchedRow = byUserId ?? byPlayerName ?? null;
    if (!matchedRow || matchedRow.position <= TOP_VISIBLE_ROWS) {
      return null;
    }

    return matchedRow;
  }, [currentPlayerName, isCompetitionResults, rankingRows, user?.id]);

  const handleBack = () => {
    if (isCompetitionResults) {
      setGameState(GameState.HOME);
      return;
    }

    setCurrentTab('home');
  };

  const title = isCompetitionResults ? 'Sailkapena' : 'Sailkapen orokorra';
  const subtitle = isCompetitionResults
    ? 'Azken lehiaren emaitzak'
    : 'Lehen 10 jokalariak eta zure postua';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative flex-1 overflow-hidden pt-4 pb-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-[12%] h-40 w-40 rounded-full bg-yellow-300/12 blur-3xl" />
        <div className="absolute right-[5%] top-[34%] h-52 w-52 rounded-full bg-pink-400/12 blur-3xl" />
      </div>

      <div className="px-4 pb-6 text-center">
        <div className="inline-flex items-center justify-center rounded-[1.5rem] bg-yellow-100 p-4 shadow-sm">
          <Trophy className="text-yellow-500" size={36} strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-3xl font-black italic text-pink-500">{title}</h2>
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        {!isCompetitionResults && loadingRanking && rankingRows.length === 0 && (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 text-center shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Sailkapena eguneratzen...
            </p>
          </div>
        )}

        {rankingRows.length === 0 && (!loadingRanking || isCompetitionResults) && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-sm">
            <p className="text-lg font-black text-slate-800">Oraindik ez dago emaitzarik.</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Jokatu eta bete sailkapena
            </p>
          </div>
        )}

        {visibleRows.length > 0 && (
          <div className="space-y-2.5">
            {visibleRows.map((row) => {
              const styles = getPositionStyles(row.position);
              const hasMedal = row.position <= 3;

              return (
                <article
                  key={row.id}
                  className={`flex items-center justify-between gap-3 rounded-[1.35rem] border px-4 py-3 shadow-sm transition-shadow hover:shadow-md ${styles.rowClass}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${styles.medalClass}`}>
                      {hasMedal ? (
                        <Medal size={26} strokeWidth={2.4} />
                      ) : (
                        <span className="text-2xl font-black">{row.position}.</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-black text-slate-800">
                          {row.playerName}
                        </p>
                        {!isCompetitionResults && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${styles.labelClass}`}>
                            {row.games} saio
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-3xl font-black leading-none ${styles.pointsClass}`}>
                      {row.points}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {currentUserRow && (
          <div className="mt-5">
            <div className="mb-2 px-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Zure postua
              </p>
            </div>

            <article className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-pink-200 bg-pink-50/70 px-4 py-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-pink-500">
                  <span className="text-2xl font-black">{currentUserRow.position}.</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-black text-slate-800">
                      {currentUserRow.playerName}
                    </p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-pink-600">
                      {currentUserRow.games} saio
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black leading-none text-pink-500">
                  {currentUserRow.points}
                </p>
              </div>
            </article>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-safe-bottom">
        <button
          type="button"
          onClick={handleBack}
          className="flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm transition-colors hover:border-pink-300 hover:text-pink-600"
        >
          <ChevronLeft size={18} strokeWidth={3} />
          Itzuli hasierara
        </button>
      </div>
    </motion.div>
  );
});

RankingScreen.displayName = 'RankingScreen';

export default RankingScreen;
