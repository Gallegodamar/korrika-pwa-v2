import { useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GameState } from '../types';
import { saveGlobalStartDate } from '../services/korrikaApi';
import { writeLocalCache, removeLocalCache } from '../utils/localCache';
import {
    GLOBAL_CONFIG_TABLE,
    START_DATE_CONFIG_KEY,
    START_DATE_CACHE_KEY,
    DEFAULT_CHALLENGE_START_DATE,
    DAYS_COUNT
} from '../utils/constants';
import { useShallow } from 'zustand/react/shallow';

export const useGameSimulation = (
    isAdmin: boolean,
    userDisplayName: string,
    generateQuestions: (mode: 'DAILY', idx: number) => any[]
) => {
    const {
        challengeStartDate, adminStartDateInput, sequentialSimulationActive, sequentialSimulationDay,
        setChallengeStartDate, setAdminStartDateInput, setReviewDayIndex, setIsSimulationRun,
        setPlayMode, setDayIndex, setActiveQuestions, setPlayers, setCurrentPlayerIdx,
        setCurrentQuestionIdx, setGameState, setSequentialSimulationActive, setSequentialSimulationDay,
        setSequentialSimulationProgress
    } = useAppStore(useShallow((state) => ({
        challengeStartDate: state.challengeStartDate,
        adminStartDateInput: state.adminStartDateInput,
        sequentialSimulationActive: state.sequentialSimulationActive,
        sequentialSimulationDay: state.sequentialSimulationDay,
        setChallengeStartDate: state.setChallengeStartDate,
        setAdminStartDateInput: state.setAdminStartDateInput,
        setReviewDayIndex: state.setReviewDayIndex,
        setIsSimulationRun: state.setIsSimulationRun,
        setPlayMode: state.setPlayMode,
        setDayIndex: state.setDayIndex,
        setActiveQuestions: state.setActiveQuestions,
        setPlayers: state.setPlayers,
        setCurrentPlayerIdx: state.setCurrentPlayerIdx,
        setCurrentQuestionIdx: state.setCurrentQuestionIdx,
        setGameState: state.setGameState,
        setSequentialSimulationActive: state.setSequentialSimulationActive,
        setSequentialSimulationDay: state.setSequentialSimulationDay,
        setSequentialSimulationProgress: state.setSequentialSimulationProgress
    })));

    const simulationToday = useMemo(() => {
        if (!sequentialSimulationActive) return null;
        const d = new Date(`${challengeStartDate}T00:00:00`);
        d.setDate(d.getDate() + sequentialSimulationDay);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [sequentialSimulationActive, sequentialSimulationDay, challengeStartDate]);

    const saveChallengeStartDate = useCallback(async (setSavingAdminConfig: (saving: boolean) => void) => {
        if (!isAdmin) return;
        const value = adminStartDateInput.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        try {
            setSavingAdminConfig(true);
            await saveGlobalStartDate(GLOBAL_CONFIG_TABLE, START_DATE_CONFIG_KEY, value);
            setChallengeStartDate(value);
            writeLocalCache(START_DATE_CACHE_KEY, value);
        } catch (err) {
            console.error('Error saving global start date:', err);
        } finally {
            setSavingAdminConfig(false);
        }
    }, [adminStartDateInput, isAdmin, setChallengeStartDate]);

    const resetChallengeStartDate = useCallback(async (setSavingAdminConfig: (saving: boolean) => void) => {
        if (!isAdmin) return;
        try {
            setSavingAdminConfig(true);
            await saveGlobalStartDate(
                GLOBAL_CONFIG_TABLE,
                START_DATE_CONFIG_KEY,
                DEFAULT_CHALLENGE_START_DATE
            );
            setChallengeStartDate(DEFAULT_CHALLENGE_START_DATE);
            setAdminStartDateInput(DEFAULT_CHALLENGE_START_DATE);
            removeLocalCache(START_DATE_CACHE_KEY);
        } catch (err) {
            console.error('Error resetting global start date:', err);
        } finally {
            setSavingAdminConfig(false);
        }
    }, [isAdmin, setChallengeStartDate, setAdminStartDateInput]);

    const startSimulationDay = useCallback((idx: number) => {
        if (!isAdmin) return;
        const clampedIdx = Math.min(Math.max(idx, 0), DAYS_COUNT - 1);
        const qs = generateQuestions('DAILY', clampedIdx);
        if (qs.length === 0) return;

        setReviewDayIndex(null);
        setIsSimulationRun(true);
        setPlayMode('DAILY');
        setDayIndex(clampedIdx);
        setActiveQuestions(qs);

        setPlayers([{ name: userDisplayName || 'SIMULAZIOA', score: 0, answers: [] }]);
        setCurrentPlayerIdx(0);
        setCurrentQuestionIdx(0);
        setGameState(GameState.COUNTDOWN);
    }, [generateQuestions, isAdmin, userDisplayName, setReviewDayIndex, setIsSimulationRun, setPlayMode, setDayIndex, setActiveQuestions, setPlayers, setCurrentPlayerIdx, setCurrentQuestionIdx, setGameState]);

    const startSequentialSimulation = useCallback(() => {
        if (!isAdmin) return;
        setSequentialSimulationActive(true);
        setSequentialSimulationDay(0);
        setSequentialSimulationProgress([]);
        setIsSimulationRun(false);
        setReviewDayIndex(null);
        setGameState(GameState.HOME);
    }, [isAdmin, setSequentialSimulationActive, setSequentialSimulationDay, setSequentialSimulationProgress, setIsSimulationRun, setReviewDayIndex, setGameState]);

    const stopSequentialSimulation = useCallback(() => {
        if (!isAdmin) return;
        setSequentialSimulationActive(false);
        setSequentialSimulationDay(0);
        setSequentialSimulationProgress([]);
        setIsSimulationRun(false);
        setReviewDayIndex(null);
    }, [isAdmin, setSequentialSimulationActive, setSequentialSimulationDay, setSequentialSimulationProgress, setIsSimulationRun, setReviewDayIndex]);

    return {
        simulationToday,
        saveChallengeStartDate,
        resetChallengeStartDate,
        startSimulationDay,
        startSequentialSimulation,
        stopSequentialSimulation
    };
};
