
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { GameState, Question, DailyProgress, UserAnswer, Player, PlayMode, QuizData } from './types';
import AuthScreen from './components/screens/AuthScreen';
import BottomNav from './components/BottomNav';

const CountdownScreen = React.lazy(() => import('./components/CountdownScreen'));
const QuizScreen = React.lazy(() => import('./components/QuizScreen'));
const HomeScreen = React.lazy(() => import('./components/screens/HomeScreen'));
const WelcomeScreen = React.lazy(() => import('./components/screens/WelcomeScreen'));
const PlayerSetupScreen = React.lazy(() => import('./components/screens/PlayerSetupScreen'));
const UsernameSetupScreen = React.lazy(() => import('./components/screens/UsernameSetupScreen'));
const TurnTransitionScreen = React.lazy(() => import('./components/screens/TurnTransitionScreen'));
const ResultsScreen = React.lazy(() => import('./components/screens/ResultsScreen'));
const RankingScreen = React.lazy(() => import('./components/screens/RankingScreen'));
const SupervisorScreen = React.lazy(() => import('./components/screens/SupervisorScreen'));
const AccountPanel = React.lazy(() => import('./components/screens/AccountPanel'));
const HistoryScreen = React.lazy(() => import('./components/screens/HistoryScreen'));

const SuspenseSpinner = () => (
  <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8">
    <div className="w-12 h-12 border-[5px] border-pink-100 border-t-pink-600 border-r-pink-500 rounded-full animate-spin shadow-sm"></div>
    <span className="mt-8 text-[11px] font-black text-pink-600 uppercase tracking-[0.2em] opacity-80 animate-pulse">Kargatzen...</span>
  </div>
);
import { readLocalCache, removeLocalCache, writeLocalCache } from './utils/localCache';

import {
  AccountIdentity,
  UsernameHistoryEntry,
  changeMyUsername,
  getMyAccountIdentity,
  getMyUsernameHistory,
  mapAccountApiError,
  normalizeUsername
} from './services/accountApi';
import { loginWithUsername } from './services/authApi';
import {
  GameResultRow,
  KorrikaEdukia,
  StoredAnswerRow,
  UserDailyPlayRow,
  getEdukiak,
  getGlobalStartDate,
  getLeaderboards,
  getQuizData,
  getRegisteredPlayers,
  getUserDailyPlays,
  saveGlobalStartDate
} from './services/korrikaApi';

import { PROFILING_DEMO_QUIZ_DATA, PROFILING_DEMO_EDUKIAK } from './mocks/demoData';
import {
  PROGRESS_STORAGE_PREFIX,
  LEGACY_PROGRESS_STORAGE_KEY,
  SIMULATION_STORAGE_KEY,
  QUIZ_CACHE_KEY,
  EDUKIAK_CACHE_KEY,
  PLAYERS_CACHE_KEY,
  START_DATE_CACHE_KEY,
  LEADERBOARDS_CACHE_KEY,
  USER_DAILY_PLAYS_CACHE_PREFIX,
  WELCOME_SEEN_STORAGE_PREFIX,
  GLOBAL_CONFIG_TABLE,
  START_DATE_CONFIG_KEY,
  DAYS_COUNT,
  QUESTIONS_PER_DAY,
  SECONDS_PER_QUESTION,
  DEFAULT_CHALLENGE_START_DATE,
  LEGACY_ADMIN_USERS,
  DAY_OPTIONS,
  QUIZ_CACHE_TTL_MS,
  EDUKIAK_CACHE_TTL_MS,
  PLAYERS_CACHE_TTL_MS,
  START_DATE_CACHE_TTL_MS,
  LEADERBOARDS_CACHE_TTL_MS,
  USER_DAILY_PLAYS_CACHE_TTL_MS
} from './utils/constants';
import {
  getLocalDateKey,
  formatCountdown,
  getUserProgressStorageKey,
  normalizeOptionKey,
  mapStoredAnswersToUserAnswers,
  shuffle,
  pickRandomItems
} from './utils/helpers';

type LeaderboardView = 'DAILY' | 'GENERAL';

type ProfileStats = {
  commits: number;
  totalActualDuration: number;
  maxActualDuration: number;
};

type ProfileRow = {
  id: string;
  commits: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
};

import { useAppStore } from './store/useAppStore';
import { useGameProgress } from './hooks/useGameProgress';
import { useGameSimulation } from './hooks/useGameSimulation';
import { useGameplay } from './hooks/useGameplay';
import { useAppProfiler } from './hooks/useAppProfiler';
import { useShallow } from 'zustand/react/shallow';

const App: React.FC = () => {
  const {
    user, loadingAuth, accountIdentity, usernameHistory, pendingUsername, loadingAccount,
    usernameChangeError, usernameChangeNotice, gameState, playMode, dayIndex,
    currentQuestionIdx, challengeStartDate, adminStartDateInput, quizData, loadingData,
    edukiak, loadingEdukiak, registeredPlayers, progress, userDailyPlays,
    activeQuestions, players, currentPlayerIdx, tempPlayerNames, leaderboardRows, loadingRanking,
    isSimulationRun, reviewDayIndex, sequentialSimulationActive, sequentialSimulationDay, sequentialSimulationProgress,
    currentTab,

    setUser, setGameState, setLoadingAuth, setAccountIdentity, setUsernameHistory,
    setPendingUsername, setLoadingData, setQuizData, setLeaderboardRows,
    setUserDailyPlays, setRegisteredPlayers, setEdukiak, setLoadingEdukiak,
    setChallengeStartDate, setAdminStartDateInput, setProgress, setUsernameChangeError,
    setUsernameChangeNotice, setPlayers, setCurrentPlayerIdx, setCurrentQuestionIdx,
    setPlayMode, setDayIndex, setActiveQuestions, setTempPlayerNames,
    setIsSimulationRun, setReviewDayIndex, setSequentialSimulationActive, setSequentialSimulationDay, setSequentialSimulationProgress,
    setDailyPlayLockMessage, setCurrentTab,

    dailyPlayLockMessage,
    fetchRegisteredPlayers, fetchLeaderboards, fetchUserDailyPlays,
    fetchEdukiak, fetchQuizData, fetchGlobalStartDate, fetchAccountIdentity
  } = useAppStore(useShallow((state) => ({
    user: state.user,
    loadingAuth: state.loadingAuth,
    accountIdentity: state.accountIdentity,
    usernameHistory: state.usernameHistory,
    pendingUsername: state.pendingUsername,
    loadingAccount: state.loadingAccount,
    usernameChangeError: state.usernameChangeError,
    usernameChangeNotice: state.usernameChangeNotice,
    gameState: state.gameState,
    playMode: state.playMode,
    dayIndex: state.dayIndex,
    currentQuestionIdx: state.currentQuestionIdx,
    challengeStartDate: state.challengeStartDate,
    adminStartDateInput: state.adminStartDateInput,
    quizData: state.quizData,
    loadingData: state.loadingData,
    edukiak: state.edukiak,
    loadingEdukiak: state.loadingEdukiak,
    registeredPlayers: state.registeredPlayers,
    progress: state.progress,
    userDailyPlays: state.userDailyPlays,
    activeQuestions: state.activeQuestions,
    players: state.players,
    currentPlayerIdx: state.currentPlayerIdx,
    tempPlayerNames: state.tempPlayerNames,
    leaderboardRows: state.leaderboardRows,
    loadingRanking: state.loadingRanking,
    isSimulationRun: state.isSimulationRun,
    reviewDayIndex: state.reviewDayIndex,
    sequentialSimulationActive: state.sequentialSimulationActive,
    sequentialSimulationDay: state.sequentialSimulationDay,
    sequentialSimulationProgress: state.sequentialSimulationProgress,
    currentTab: state.currentTab,
    setUser: state.setUser,
    setGameState: state.setGameState,
    setLoadingAuth: state.setLoadingAuth,
    setAccountIdentity: state.setAccountIdentity,
    setUsernameHistory: state.setUsernameHistory,
    setPendingUsername: state.setPendingUsername,
    setLoadingData: state.setLoadingData,
    setQuizData: state.setQuizData,
    setLeaderboardRows: state.setLeaderboardRows,
    setUserDailyPlays: state.setUserDailyPlays,
    setRegisteredPlayers: state.setRegisteredPlayers,
    setEdukiak: state.setEdukiak,
    setLoadingEdukiak: state.setLoadingEdukiak,
    setChallengeStartDate: state.setChallengeStartDate,
    setAdminStartDateInput: state.setAdminStartDateInput,
    setProgress: state.setProgress,
    setUsernameChangeError: state.setUsernameChangeError,
    setUsernameChangeNotice: state.setUsernameChangeNotice,
    setPlayers: state.setPlayers,
    setCurrentPlayerIdx: state.setCurrentPlayerIdx,
    setCurrentQuestionIdx: state.setCurrentQuestionIdx,
    setPlayMode: state.setPlayMode,
    setDayIndex: state.setDayIndex,
    setActiveQuestions: state.setActiveQuestions,
    setTempPlayerNames: state.setTempPlayerNames,
    setIsSimulationRun: state.setIsSimulationRun,
    setReviewDayIndex: state.setReviewDayIndex,
    setSequentialSimulationActive: state.setSequentialSimulationActive,
    setSequentialSimulationDay: state.setSequentialSimulationDay,
    setSequentialSimulationProgress: state.setSequentialSimulationProgress,
    setDailyPlayLockMessage: state.setDailyPlayLockMessage,
    setCurrentTab: state.setCurrentTab,
    dailyPlayLockMessage: state.dailyPlayLockMessage,
    fetchRegisteredPlayers: state.fetchRegisteredPlayers,
    fetchLeaderboards: state.fetchLeaderboards,
    fetchUserDailyPlays: state.fetchUserDailyPlays,
    fetchEdukiak: state.fetchEdukiak,
    fetchQuizData: state.fetchQuizData,
    fetchGlobalStartDate: state.fetchGlobalStartDate,
    fetchAccountIdentity: state.fetchAccountIdentity
  })));

  const [nowTs, setNowTs] = useState(() => Date.now());
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [simulationDayIndex, setSimulationDayIndex] = useState(0);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  const progressStorageKey = useMemo(
    () => (user?.id ? getUserProgressStorageKey(user.id) : null),
    [user?.id]
  );
  const welcomeStorageKey = useMemo(
    () => (user?.id ? `${WELCOME_SEEN_STORAGE_PREFIX}_${user.id}` : null),
    [user?.id]
  );

  const autoplayStartedRef = useRef(false);
  const autoplayQuestionRef = useRef<number | null>(null);
  const { profilingEnabled, profileRows, renderWithProfiler } = useAppProfiler();
  const simulationTodayForProgress = useMemo(() => {
    if (!sequentialSimulationActive) return null;

    const nextSimulationDate = new Date(`${challengeStartDate}T00:00:00`);
    nextSimulationDate.setDate(nextSimulationDate.getDate() + sequentialSimulationDay);
    nextSimulationDate.setHours(0, 0, 0, 0);
    return nextSimulationDate;
  }, [challengeStartDate, sequentialSimulationActive, sequentialSimulationDay]);

  const profilingDemoEnabled = useMemo(() => {
    if (typeof window === 'undefined' || !import.meta.env.DEV) return false;
    return new URLSearchParams(window.location.search).get('profilingDemo') === '1';
  }, []);
  const profilingAutoplayEnabled = useMemo(() => {
    if (typeof window === 'undefined' || !import.meta.env.DEV) return false;
    return new URLSearchParams(window.location.search).get('autoplay') === '1';
  }, []);
  const profilingAutomationEnabled = profilingEnabled && profilingDemoEnabled && profilingAutoplayEnabled;

  const refreshPostAuthData = useCallback(async (targetUserId: string) => {
    await Promise.all([
      fetchGlobalStartDate(true),
      fetchRegisteredPlayers(true),
      fetchAccountIdentity(),
      fetchLeaderboards(true),
      fetchUserDailyPlays(targetUserId, true)
    ]);
  }, [fetchGlobalStartDate, fetchRegisteredPlayers, fetchAccountIdentity, fetchLeaderboards, fetchUserDailyPlays]);

  useEffect(() => {
    if (gameState !== GameState.HOME) return;
    if (sequentialSimulationActive) return;

    const startTs = new Date(`${challengeStartDate}T00:00:00`).getTime();
    if (Date.now() >= startTs) return;

    setNowTs(Date.now());
    const intervalId = window.setInterval(() => {
      const currentTs = Date.now();
      setNowTs(currentTs);
      if (currentTs >= startTs) {
        clearInterval(intervalId);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [gameState, sequentialSimulationActive, challengeStartDate]);

  useEffect(() => {
    localStorage.setItem(SIMULATION_STORAGE_KEY, simulationEnabled ? '1' : '0');
  }, [simulationEnabled]);

  useEffect(() => {
    if (profilingDemoEnabled) {
      const todayKey = getLocalDateKey();
      setUser({ id: 'profiling-admin', email: 'admin@korrika.app' } as User);
      setAccountIdentity({
        user_id: 'profiling-admin',
        current_username: 'admin',
        is_admin: true,
        previous_usernames: []
      });
      setUsernameHistory([]);
      setPendingUsername('admin');
      setLoadingAuth(false);
      setLoadingData(false);
      setGameState(GameState.HOME);
      setCurrentTab('home');
      setQuizData(PROFILING_DEMO_QUIZ_DATA);
      setLeaderboardRows([]);
      setUserDailyPlays([]);
      setRegisteredPlayers(['ADMIN', 'JOKALARI DEMO']);
      setEdukiak(PROFILING_DEMO_EDUKIAK);
      setLoadingEdukiak(false);
      setChallengeStartDate(todayKey);
      setAdminStartDateInput(todayKey);
      setSimulationEnabled(true);
      setProgress([]);
      localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
      localStorage.removeItem(getUserProgressStorageKey('profiling-admin'));
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setGameState(GameState.HOME);
          setCurrentTab('home');
          void refreshPostAuthData(session.user.id);
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setLoadingAuth(false);
      }
    };

    const storedSimulation = localStorage.getItem(SIMULATION_STORAGE_KEY);
    if (storedSimulation === '1') setSimulationEnabled(true);

    checkUser();
    fetchGlobalStartDate();
    fetchQuizData();
    fetchEdukiak();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setProgress([]);
        setGameState(GameState.HOME);
        setCurrentTab('home');
        setDailyPlayLockMessage(null);
        void refreshPostAuthData(session.user.id);
      } else {
        setAccountIdentity(null);
        setUsernameHistory([]);
        setPendingUsername('');
        setUsernameChangeError(null);
        setUsernameChangeNotice(null);
        setGameState(GameState.AUTH);
        setCurrentTab('home');
        setDailyPlayLockMessage(null);
        setUserDailyPlays([]);
        setProgress([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [profilingDemoEnabled]);

  useEffect(() => {
    if (profilingDemoEnabled) return;
    localStorage.removeItem(LEGACY_PROGRESS_STORAGE_KEY);
  }, [profilingDemoEnabled]);

  useEffect(() => {
    if (profilingDemoEnabled) return;
    if (!progressStorageKey) {
      setProgress([]);
      return;
    }

    const saved = localStorage.getItem(progressStorageKey);
    if (!saved) {
      setProgress([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setProgress(parsed as DailyProgress[]);
        return;
      }

      setProgress([]);
      localStorage.removeItem(progressStorageKey);
    } catch (err) {
      console.error('Error loading local progress:', err);
      setProgress([]);
      localStorage.removeItem(progressStorageKey);
    }
  }, [profilingDemoEnabled, progressStorageKey]);



  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccountIdentity(null);
    setGameState(GameState.AUTH);
    setCurrentTab('home');
    setPendingUsername('');
    setUsernameHistory([]);
    setUsernameChangeError(null);
    setUsernameChangeNotice(null);
    setPlayers([]);
    setDailyPlayLockMessage(null);
    setUserDailyPlays([]);
    setProgress([]);
    setReviewDayIndex(null);
    setShowWelcomeScreen(false);
    setSequentialSimulationActive(false);
    setSequentialSimulationDay(0);
    setSequentialSimulationProgress([]);
  };

  const {
    currentUsername,
    userDisplayName,
    isAdmin,
    currentChallengeDayIndex,
    effectiveDailyProgress,
    nextAvailableDay
  } = useGameProgress(simulationTodayForProgress);

  const {
    initGame,
    handleNextQuestion,
    handleCountdownComplete,
    generateQuestions,
    validatingDailyStart
  } = useGameplay(userDisplayName, isAdmin, nextAvailableDay);

  const {
    startSimulationDay,
    saveChallengeStartDate,
    resetChallengeStartDate,
    startSequentialSimulation,
    stopSequentialSimulation
  } = useGameSimulation(isAdmin, userDisplayName, generateQuestions);

  const handleStartDailyPlay = useCallback(() => {
    void initGame('SOLO', 'DAILY');
  }, [initGame]);

  const handleReviewDay = useCallback((idx: number) => {
    setReviewDayIndex(idx);
    setGameState(GameState.RESULTS);
  }, [setReviewDayIndex, setGameState]);

  const showDailyPlayButton = nextAvailableDay >= 0 || nextAvailableDay === -4 || nextAvailableDay === -1 || nextAvailableDay === -2;
  const dailyPlayButtonDisabled = validatingDailyStart || nextAvailableDay < 0;

  const challengeStartTs = useMemo(() => new Date(`${challengeStartDate}T00:00:00`).getTime(), [challengeStartDate]);
  const effectiveNowTs = simulationTodayForProgress ? simulationTodayForProgress.getTime() : nowTs;
  const timeUntilStart = Math.max(0, challengeStartTs - effectiveNowTs);

  const completedDayIndexes = useMemo(
    () => effectiveDailyProgress.map((day, idx) => (day?.completed ? idx : -1)).filter((idx) => idx >= 0),
    [effectiveDailyProgress]
  );

  const needsUsernameSetup = !!(user && !loadingAccount && accountIdentity && usernameHistory.length === 0);

  useEffect(() => {
    if (!welcomeStorageKey || loadingAuth || loadingAccount || gameState !== GameState.HOME || needsUsernameSetup) {
      setShowWelcomeScreen(false);
      return;
    }

    const alreadySeenWelcome = localStorage.getItem(welcomeStorageKey) === '1';
    setShowWelcomeScreen(!alreadySeenWelcome);

    if (!alreadySeenWelcome) {
      setCurrentTab('home');
    }
  }, [welcomeStorageKey, loadingAuth, loadingAccount, gameState, needsUsernameSetup, setCurrentTab]);

  const handleDismissWelcome = useCallback(() => {
    if (welcomeStorageKey) {
      localStorage.setItem(welcomeStorageKey, '1');
    }
    setCurrentTab('home');
    setShowWelcomeScreen(false);
  }, [welcomeStorageKey, setCurrentTab]);

  const handleBottomNavChange = useCallback((tab: 'home' | 'history' | 'ranking' | 'profile') => {
    if (gameState === GameState.RESULTS && reviewDayIndex !== null) {
      setReviewDayIndex(null);
      setGameState(GameState.HOME);
    }
    setCurrentTab(tab);
  }, [gameState, reviewDayIndex, setCurrentTab, setGameState, setReviewDayIndex]);

  const showBottomNav =
    (gameState === GameState.HOME && !needsUsernameSetup && !showWelcomeScreen) ||
    (gameState === GameState.RESULTS && reviewDayIndex !== null);

  if ((loadingAuth || loadingData) && (gameState === GameState.AUTH || gameState === GameState.HOME)) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-gray-50 flex-col gap-4 px-4">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-[11px] sm:text-xs font-black uppercase text-gray-400 tracking-widest animate-pulse">Datuak kargatzen...</p>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 w-full flex flex-col bg-gray-50 text-gray-800 ${gameState !== GameState.AUTH ? 'overflow-hidden' : 'overflow-auto'}`}>
      <header className="w-full flex-shrink-0 korrika-bg-gradient safe-pl safe-pr pb-2 sm:pb-3 pt-[max(env(safe-area-inset-top),0.5rem)] text-white shadow-md z-50">
        <div className="w-full max-w-5xl mx-auto relative flex justify-center items-center min-h-[2.5rem] sm:min-h-[3rem]">
          {user && gameState !== GameState.AUTH && (
            <button
              onClick={handleLogout}
              className="absolute left-0 rounded-full bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider hover:bg-white/30 transition-colors whitespace-nowrap active:scale-95"
            >
              Irten
            </button>
          )}

          <div className="flex flex-col items-center justify-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight uppercase italic flex items-center gap-1.5 leading-none">
              <span aria-hidden className="text-base sm:text-lg">{'\u{1F3C3}'}</span> KORRIKA
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold opacity-90 uppercase tracking-[0.2em] text-center mt-1">
              {DAYS_COUNT} EGUNEKO ERRONKA
            </p>
          </div>

          {user && gameState !== GameState.AUTH && (
            <div className="absolute right-0 rounded-full bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider max-w-[35%] truncate text-center">
              {userDisplayName}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto safe-pl safe-pr px-2 sm:px-4 lg:px-6 flex flex-col overflow-hidden relative">
        <React.Suspense fallback={<SuspenseSpinner />}>

          {gameState === GameState.AUTH && (
            renderWithProfiler(
              'AuthScreen',
              <AuthScreen />
            )
          )}

          {gameState === GameState.HOME && needsUsernameSetup && (
            renderWithProfiler(
              'UsernameSetupScreen',
              <UsernameSetupScreen />
            )
          )}

          {gameState === GameState.HOME && !needsUsernameSetup && showWelcomeScreen && (
            renderWithProfiler(
              'WelcomeScreen',
              <WelcomeScreen onContinue={handleDismissWelcome} />
            )
          )}

          {gameState === GameState.HOME && !needsUsernameSetup && !showWelcomeScreen && (
            <div className="flex-1 w-full pb-20 overflow-y-auto overscroll-y-none">
              {currentTab === 'home' && renderWithProfiler(
                'HomeScreen',
                <HomeScreen
                  showDailyPlayButton={showDailyPlayButton}
                  onStartDailyPlay={handleStartDailyPlay}
                  dailyPlayButtonDisabled={dailyPlayButtonDisabled}
                  validatingDailyStart={validatingDailyStart}
                  nextAvailableDay={nextAvailableDay}
                  currentChallengeDayIndex={currentChallengeDayIndex}
                  timeUntilStart={timeUntilStart}
                  formatCountdown={formatCountdown}
                  dailyPlayLockMessage={dailyPlayLockMessage}
                  isAdmin={isAdmin}
                  onOpenSupervisor={() => setGameState(GameState.SUPERVISOR)}
                  startSequentialSimulation={startSequentialSimulation}
                  stopSequentialSimulation={stopSequentialSimulation}
                  saveChallengeStartDate={saveChallengeStartDate}
                  resetChallengeStartDate={resetChallengeStartDate}
                />
              )}

              {currentTab === 'history' && renderWithProfiler(
                'HistoryScreen',
                <HistoryScreen
                  completedDayIndexes={completedDayIndexes}
                  onReviewDay={handleReviewDay}
                  nextAvailableDay={nextAvailableDay}
                  currentChallengeDayIndex={currentChallengeDayIndex}
                />
              )}

              {currentTab === 'ranking' && renderWithProfiler(
                'RankingScreen',
                <RankingScreen />
              )}

              {currentTab === 'profile' && renderWithProfiler(
                'AccountPanel',
                <AccountPanel />
              )}
            </div>
          )}

          {showBottomNav && (
            <BottomNav currentTab={currentTab} onChangeTab={handleBottomNavChange} />
          )}

          {gameState === GameState.PLAYER_SETUP && (
            renderWithProfiler(
              'PlayerSetupScreen',
              <PlayerSetupScreen />
            )
          )}

          {gameState === GameState.COUNTDOWN && (
            renderWithProfiler(
              'CountdownScreen',
              <CountdownScreen
                onComplete={handleCountdownComplete}
              />
            )
          )}

          {gameState === GameState.QUIZ && activeQuestions.length > 0 && (
            renderWithProfiler(
              'QuizScreen',
              <QuizScreen
                question={activeQuestions[currentQuestionIdx]}
                questionIndex={currentQuestionIdx}
                totalQuestions={activeQuestions.length}
                onAnswer={handleNextQuestion}
                timerKey={`${currentPlayerIdx}-${currentQuestionIdx}`}
                secondsPerQuestion={SECONDS_PER_QUESTION}
              />
            )
          )}

          {gameState === GameState.TURN_TRANSITION && (
            renderWithProfiler(
              'TurnTransitionScreen',
              <TurnTransitionScreen />
            )
          )}

          {gameState === GameState.RESULTS && (
            renderWithProfiler(
              'ResultsScreen',
              <ResultsScreen />
            )
          )}

          {gameState === GameState.SUPERVISOR && (
            renderWithProfiler(
              'SupervisorScreen',
              <SupervisorScreen
                isAdmin={isAdmin}
                startSimulationDay={startSimulationDay}
                saveChallengeStartDate={saveChallengeStartDate}
                resetChallengeStartDate={resetChallengeStartDate}
                startSequentialSimulation={startSequentialSimulation}
                stopSequentialSimulation={stopSequentialSimulation}
              />
            )
          )}

        </React.Suspense>
      </main>

      <footer className="w-full py-3 sm:py-4 text-center opacity-40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] bg-gray-50 px-2">
        AEK - KORRIKA
      </footer>
      {profilingEnabled && (
        <aside className="fixed right-2 bottom-2 z-50 w-[min(22rem,92vw)] rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-pink-600">Profilagailua aktibo</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">3 errenderizazio garestienak (denbora metatua)</p>
          <div className="mt-2 space-y-1.5">
            {profileRows.length === 0 && (
              <p className="text-[10px] text-gray-400 font-bold">Daturik ez oraindik. Nabigatu aplikazioan.</p>
            )}
            {profileRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="text-[10px] font-black text-gray-700 truncate">{row.id}</p>
                <p className="text-[10px] text-gray-500 font-bold">
                  eguneraketa: {row.commits} | guztira: {row.totalMs}ms | batez bestekoa: {row.avgMs}ms | gehienez: {row.maxMs}ms
                </p>
              </article>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default App;
