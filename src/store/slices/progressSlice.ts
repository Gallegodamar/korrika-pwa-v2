import { StateCreator } from 'zustand';
import { DailyProgress } from '../../types';
import { GameResultRow, UserDailyPlayRow, getLeaderboards, getUserDailyPlays } from '../../services/korrikaApi';
import { readLocalCache, writeLocalCache } from '../../utils/localCache';
import {
    LEADERBOARDS_CACHE_KEY, LEADERBOARDS_CACHE_TTL_MS,
    USER_DAILY_PLAYS_CACHE_PREFIX, USER_DAILY_PLAYS_CACHE_TTL_MS,
    DAYS_COUNT
} from '../../utils/constants';
import { reqCache } from '../apiCache';
import { AuthSlice } from './authSlice';

export interface ProgressSlice {
    progress: DailyProgress[];
    userDailyPlays: UserDailyPlayRow[];

    leaderboardRows: GameResultRow[];
    loadingRanking: boolean;

    reviewDayIndex: number | null;
    isSimulationRun: boolean;
    sequentialSimulationActive: boolean;
    sequentialSimulationDay: number;
    sequentialSimulationProgress: DailyProgress[];

    setProgress: (progress: DailyProgress[] | ((prev: DailyProgress[]) => DailyProgress[])) => void;
    setUserDailyPlays: (plays: UserDailyPlayRow[]) => void;
    setLeaderboardRows: (rows: GameResultRow[]) => void;
    setReviewDayIndex: (idx: number | null) => void;
    setIsSimulationRun: (isSim: boolean) => void;
    setSequentialSimulationActive: (active: boolean) => void;
    setSequentialSimulationDay: (day: number | ((prev: number) => number)) => void;
    setSequentialSimulationProgress: (progress: DailyProgress[] | ((prev: DailyProgress[]) => DailyProgress[])) => void;

    fetchLeaderboards: (force?: boolean) => Promise<void>;
    fetchUserDailyPlays: (userIdParam?: string, force?: boolean) => Promise<void>;
}

export const createProgressSlice: StateCreator<ProgressSlice & AuthSlice, [], [], ProgressSlice> = (set, get) => ({
    progress: [],
    userDailyPlays: [],

    leaderboardRows: [],
    loadingRanking: false,

    reviewDayIndex: null,
    isSimulationRun: false,
    sequentialSimulationActive: false,
    sequentialSimulationDay: 0,
    sequentialSimulationProgress: [],

    setProgress: (progress) => set((s) => ({ progress: typeof progress === 'function' ? progress(s.progress) : progress })),
    setUserDailyPlays: (userDailyPlays) => set({ userDailyPlays }),
    setLeaderboardRows: (leaderboardRows) => set({ leaderboardRows }),
    setReviewDayIndex: (reviewDayIndex) => set({ reviewDayIndex }),
    setIsSimulationRun: (isSimulationRun) => set({ isSimulationRun }),
    setSequentialSimulationActive: (sequentialSimulationActive) => set({ sequentialSimulationActive }),
    setSequentialSimulationDay: (day) => set((s) => ({ sequentialSimulationDay: typeof day === 'function' ? day(s.sequentialSimulationDay) : day })),
    setSequentialSimulationProgress: (prog) => set((s) => ({ sequentialSimulationProgress: typeof prog === 'function' ? prog(s.sequentialSimulationProgress) : prog })),

    fetchLeaderboards: async (force = false) => {
        if (!force) {
            const cachedRows = readLocalCache<GameResultRow[]>(LEADERBOARDS_CACHE_KEY, LEADERBOARDS_CACHE_TTL_MS);
            if (cachedRows) {
                set({ leaderboardRows: cachedRows });
                reqCache.leaderboardsFetchedAt = Date.now();
                return;
            }
            if (Date.now() - reqCache.leaderboardsFetchedAt < 30000) return;
        }

        if (reqCache.leaderboardsRequest) return reqCache.leaderboardsRequest;

        reqCache.leaderboardsRequest = (async () => {
            try {
                set({ loadingRanking: true });
                const rows = await getLeaderboards(DAYS_COUNT);
                set({ leaderboardRows: rows });
                writeLocalCache(LEADERBOARDS_CACHE_KEY, rows);
                reqCache.leaderboardsFetchedAt = Date.now();
            } catch (err) {
                console.error('Error fetching leaderboards:', err);
                const cachedRows = readLocalCache<GameResultRow[]>(LEADERBOARDS_CACHE_KEY, LEADERBOARDS_CACHE_TTL_MS);
                set({ leaderboardRows: cachedRows || [] });
            } finally {
                set({ loadingRanking: false });
            }
        })();

        try { await reqCache.leaderboardsRequest; }
        finally { reqCache.leaderboardsRequest = null; }
    },

    fetchUserDailyPlays: async (userIdParam?: string, force = false) => {
        const targetUserId = userIdParam ?? get().user?.id;
        if (!targetUserId) {
            set({ userDailyPlays: [] });
            return;
        }

        const cacheKey = `${USER_DAILY_PLAYS_CACHE_PREFIX}_${targetUserId}`;
        if (!force) {
            const cachedRows = readLocalCache<UserDailyPlayRow[]>(cacheKey, USER_DAILY_PLAYS_CACHE_TTL_MS);
            if (cachedRows) {
                set({ userDailyPlays: cachedRows });
                reqCache.userDailyPlaysFetchedAt.set(targetUserId, Date.now());
                return;
            }
        }

        const lastFetchTs = reqCache.userDailyPlaysFetchedAt.get(targetUserId) ?? 0;
        if (!force && Date.now() - lastFetchTs < 30000) return;

        const existingRequest = reqCache.userDailyPlaysRequest.get(targetUserId);
        if (existingRequest) return existingRequest;

        const request = (async () => {
            try {
                const rows = await getUserDailyPlays(targetUserId, DAYS_COUNT);
                writeLocalCache(cacheKey, rows);
                reqCache.userDailyPlaysFetchedAt.set(targetUserId, Date.now());
                if (get().user?.id !== targetUserId) return;
                set({ userDailyPlays: rows });
            } catch (err) {
                console.error('Error fetching user daily plays:', err);
                const cachedRows = readLocalCache<UserDailyPlayRow[]>(cacheKey, USER_DAILY_PLAYS_CACHE_TTL_MS);
                if (get().user?.id !== targetUserId) return;
                set({ userDailyPlays: cachedRows || [] });
            }
        })();

        reqCache.userDailyPlaysRequest.set(targetUserId, request);
        try { await request; }
        finally { reqCache.userDailyPlaysRequest.delete(targetUserId); }
    }
});
