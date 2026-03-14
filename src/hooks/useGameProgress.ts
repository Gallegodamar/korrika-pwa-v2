import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getLocalDateKey, mapStoredAnswersToUserAnswers } from '../utils/helpers';
import { normalizeUsername } from '../services/accountApi';
import { DAYS_COUNT, LEGACY_ADMIN_USERS } from '../utils/constants';
import { useShallow } from 'zustand/react/shallow';

export const useGameProgress = (simulationToday: Date | null) => {
    const {
        user,
        accountIdentity,
        challengeStartDate,
        progress,
        userDailyPlays,
        sequentialSimulationActive,
        sequentialSimulationProgress
    } = useAppStore(useShallow((state) => ({
        user: state.user,
        accountIdentity: state.accountIdentity,
        challengeStartDate: state.challengeStartDate,
        progress: state.progress,
        userDailyPlays: state.userDailyPlays,
        sequentialSimulationActive: state.sequentialSimulationActive,
        sequentialSimulationProgress: state.sequentialSimulationProgress
    })));

    const currentUsername = useMemo(() => {
        const identityUsername = normalizeUsername(accountIdentity?.current_username ?? '');
        if (identityUsername) return identityUsername;

        const metadataUsernameRaw = (user?.user_metadata as { username?: string } | undefined)?.username;
        const metadataUsername = normalizeUsername(metadataUsernameRaw ?? '');
        if (metadataUsername) return metadataUsername;

        const fallbackEmailUsername = normalizeUsername(user?.email?.split('@')[0] ?? '');
        return fallbackEmailUsername || 'gonbidatua';
    }, [accountIdentity?.current_username, user?.email, user?.user_metadata]);

    const userDisplayName = currentUsername.toUpperCase();
    const isAdmin = Boolean(accountIdentity?.is_admin) || LEGACY_ADMIN_USERS.includes(currentUsername);

    const currentChallengeDayIndex = useMemo(() => {
        const today = simulationToday ? new Date(simulationToday) : new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(`${challengeStartDate}T00:00:00`);
        const elapsedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (elapsedDays < 0) return 0;
        if (elapsedDays >= DAYS_COUNT) return DAYS_COUNT - 1;
        return elapsedDays;
    }, [challengeStartDate, simulationToday]);

    const effectiveDailyProgress = useMemo(() => {
        if (sequentialSimulationActive) return sequentialSimulationProgress;

        const merged = [...progress];
        userDailyPlays.forEach((play) => {
            const existing = merged[play.day_index];
            const serverAnswers = mapStoredAnswersToUserAnswers(play.answers ?? []);
            const existingAnswers = existing?.answers ?? [];
            const mergedAnswers = serverAnswers.length > 0 ? serverAnswers : existingAnswers;
            const mergedScore = typeof play.correct_answers === 'number' ? play.correct_answers : existing?.score ?? 0;
            merged[play.day_index] = {
                dayIndex: play.day_index,
                score: mergedScore,
                completed: true,
                date: play.played_at || existing?.date || new Date().toISOString(),
                answers: mergedAnswers,
                players: existing?.players
            };
        });
        return merged;
    }, [progress, sequentialSimulationActive, sequentialSimulationProgress, userDailyPlays]);

    const nextAvailableDay = useMemo(() => {
        const today = simulationToday ? new Date(simulationToday) : new Date();
        today.setHours(0, 0, 0, 0);
        const sourceProgress = effectiveDailyProgress;

        const start = new Date(`${challengeStartDate}T00:00:00`);
        const todayIndex = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        if (todayIndex < 0) return -4;
        if (todayIndex >= DAYS_COUNT) return -5;
        const todayProgress = sourceProgress[todayIndex];
        if (todayProgress?.completed) {
            const playedDate = getLocalDateKey(todayProgress.date);
            const todayDate = getLocalDateKey(today);
            if (playedDate === todayDate) return -2;
            return -1;
        }

        return todayIndex;
    }, [effectiveDailyProgress, challengeStartDate, simulationToday]);

    return {
        currentUsername,
        userDisplayName,
        isAdmin,
        currentChallengeDayIndex,
        effectiveDailyProgress,
        nextAvailableDay
    };
};
