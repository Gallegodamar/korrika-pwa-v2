import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  Database,
  PlayCircle,
  RefreshCw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { GameState } from '../../types';
import {
  DAY_OPTIONS,
  EDUKIAK_CACHE_KEY,
  LEADERBOARDS_CACHE_KEY,
  LEGACY_PROGRESS_STORAGE_KEY,
  PLAYERS_CACHE_KEY,
  PROGRESS_STORAGE_PREFIX,
  QUIZ_CACHE_KEY,
  SIMULATION_STORAGE_KEY,
  START_DATE_CACHE_KEY,
  USER_DAILY_PLAYS_CACHE_PREFIX,
  WELCOME_SEEN_STORAGE_PREFIX
} from '../../utils/constants';
import AdminPlayersPanel from './AdminPlayersPanel';

type SupervisorScreenProps = {
  isAdmin: boolean;
  startSimulationDay: (idx: number) => void;
  saveChallengeStartDate: (setSaving: (saving: boolean) => void) => Promise<void>;
  resetChallengeStartDate: (setSaving: (saving: boolean) => void) => Promise<void>;
  startSequentialSimulation: () => void;
  stopSequentialSimulation: () => void;
};

type SupervisorTab = 'ERRONKA' | 'JOKALARIAK' | 'GALDERAK';

const SupervisorScreen: React.FC<SupervisorScreenProps> = React.memo((props) => {
  const {
    isAdmin,
    startSimulationDay,
    saveChallengeStartDate,
    resetChallengeStartDate,
    startSequentialSimulation,
    stopSequentialSimulation
  } = props;

  const {
    quizData,
    setGameState,
    sequentialSimulationActive,
    adminStartDateInput,
    setAdminStartDateInput,
    challengeStartDate,
    setProgress
  } = useAppStore(useShallow((state) => ({
    quizData: state.quizData,
    setGameState: state.setGameState,
    sequentialSimulationActive: state.sequentialSimulationActive,
    adminStartDateInput: state.adminStartDateInput,
    setAdminStartDateInput: state.setAdminStartDateInput,
    challengeStartDate: state.challengeStartDate,
    setProgress: state.setProgress
  })));

  const [activeTab, setActiveTab] = useState<SupervisorTab>('ERRONKA');
  const [questionCategory, setQuestionCategory] = useState('GUZTIAK');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (questionCategory === 'GUZTIAK') return quizData;
    return quizData.filter((category) => category.capitulo === questionCategory);
  }, [questionCategory, quizData]);

  const handleBack = () => {
    setGameState(GameState.HOME);
  };

  const clearLocalProgress = () => {
    if (!window.confirm('Gailu honetako tokiko datuak garbitu nahi dituzu?')) {
      return;
    }

    setProgress([]);

    [
      LEGACY_PROGRESS_STORAGE_KEY,
      SIMULATION_STORAGE_KEY,
      QUIZ_CACHE_KEY,
      EDUKIAK_CACHE_KEY,
      PLAYERS_CACHE_KEY,
      START_DATE_CACHE_KEY,
      LEADERBOARDS_CACHE_KEY
    ].forEach((key) => localStorage.removeItem(key));

    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(`${PROGRESS_STORAGE_PREFIX}_`) ||
        key.startsWith(`${USER_DAILY_PLAYS_CACHE_PREFIX}_`) ||
        key.startsWith(`${WELCOME_SEEN_STORAGE_PREFIX}_`)
      ) {
        localStorage.removeItem(key);
      }
    });

    window.alert('Tokiko datuak garbitu dira.');
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
          <Shield className="mx-auto text-amber-500" size={36} />
          <h2 className="mt-4 text-2xl font-black text-slate-900">Sarbide mugatua</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">
            Ikuskaritza pantaila hau administratzaileentzat bakarrik dago erabilgarri.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-white"
          >
            <ChevronLeft size={16} />
            Itzuli hasierara
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex-1 flex flex-col overflow-hidden bg-slate-50"
    >
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-4 pt-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Ikuskaritza</h2>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
                Erronka, jokalariak eta galderak
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            aria-label="Itzuli"
            title="Itzuli"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-[1.5rem] bg-slate-100 p-1">
          {[
            { id: 'ERRONKA' as const, label: 'Erronka', icon: Sparkles },
            { id: 'JOKALARIAK' as const, label: 'Jokalariak', icon: Users },
            { id: 'GALDERAK' as const, label: 'Galderak', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-[1rem] px-3 py-3 text-[11px] font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 custom-scrollbar">
        {activeTab === 'ERRONKA' && (
          <div className="mx-auto max-w-5xl space-y-5 pb-10">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sky-600">
                <CalendarIcon size={18} />
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                  Erronkaren egutegia
                </h3>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                Hemen ezartzen da 11 eguneko erronka noiz hasten den jokalari guztientzat.
              </p>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Uneko hasiera-data: {challengeStartDate}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="date"
                  value={adminStartDateInput}
                  onChange={(event) => setAdminStartDateInput(event.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-sky-400"
                />
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => saveChallengeStartDate(setIsSavingConfig)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
                >
                  <Save size={16} />
                  Gorde
                </button>
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => resetChallengeStartDate(setIsSavingConfig)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800 disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  Berrezarri
                </button>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-600">
                  <PlayCircle size={18} />
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                    Egun bakarreko simulazioa
                  </h3>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Egun jakin bateko galderak irekitzeko eta probatzeko erabil ezazu.
                </p>

                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {DAY_OPTIONS.map((dayIndex) => (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => startSimulationDay(dayIndex)}
                      className="rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-black text-amber-700 transition-colors hover:bg-amber-500 hover:text-white"
                    >
                      {dayIndex + 1}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Database size={18} />
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
                    Simulazio sekuentziala
                  </h3>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Erronka osoa egunez egun erreproduzitzen du, diseinua eta datuen fluxua egiaztatzeko.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Egoera
                    </p>
                    <p className={`mt-1 text-base font-black ${sequentialSimulationActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {sequentialSimulationActive ? 'Simulazioa martxan dago' : 'Simulazioa geldirik dago'}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={startSequentialSimulation}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-emerald-700"
                    >
                      Hasi sekuentzia
                    </button>
                    <button
                      type="button"
                      onClick={stopSequentialSimulation}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
                    >
                      Gelditu sekuentzia
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 size={18} />
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-rose-800">
                  Gailu honetako tokiko datuak
                </h3>
              </div>
              <p className="mt-3 text-sm font-medium text-rose-700">
                Honek nabigatzaile honetako cachea, ongietorria eta tokiko progresoa baino ez ditu garbitzen.
              </p>
              <button
                type="button"
                onClick={clearLocalProgress}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-rose-700"
              >
                <Trash2 size={16} />
                Garbitu tokiko datuak
              </button>
            </section>
          </div>
        )}

        {activeTab === 'JOKALARIAK' && (
          <div className="mx-auto max-w-6xl pb-10">
            <AdminPlayersPanel />
          </div>
        )}

        {activeTab === 'GALDERAK' && (
          <div className="mx-auto max-w-5xl pb-10">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Galdera-bankua</h3>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">
                    Edukia egiaztatzeko ikuspegia
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {quizData.length} multzo
                </span>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setQuestionCategory('GUZTIAK')}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                    questionCategory === 'GUZTIAK'
                      ? 'bg-teal-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  Guztiak
                </button>
                {quizData.map((category) => (
                  <button
                    key={category.capitulo}
                    type="button"
                    onClick={() => setQuestionCategory(category.capitulo)}
                    className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                      questionCategory === category.capitulo
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-700'
                    }`}
                  >
                    {category.capitulo}
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-5 space-y-4">
              {filteredQuestions.length === 0 && (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                  <p className="text-lg font-black text-slate-700">Ez dago galderarik kargatuta.</p>
                  <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Egiaztatu datu-iturria edo kargatu berriro
                  </p>
                </div>
              )}

              {filteredQuestions.map((category) => (
                <section
                  key={category.capitulo}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-teal-400">
                        {category.capitulo}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                      {category.preguntas.length} galdera
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {category.preguntas.map((question, questionIndex) => (
                      <article key={question.id} className="p-5">
                        <p className="text-base font-black leading-snug text-slate-900">
                          <span className="mr-2 text-teal-500">{questionIndex + 1}.</span>
                          {question.pregunta}
                        </p>
                        <div className="mt-4 rounded-[1.25rem] border border-teal-100 bg-teal-50 p-4">
                          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                            <CheckCircle2 size={14} />
                            Erantzun zuzena
                          </p>
                          <p className="text-sm font-bold text-teal-900">
                            {question.opciones[question.respuesta_correcta]}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

SupervisorScreen.displayName = 'SupervisorScreen';

export default SupervisorScreen;
