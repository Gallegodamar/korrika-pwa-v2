import { supabase } from '../supabase';
import { QuizData } from '../types';

export type GameResultRow = {
  user_id: string | null;
  player_name: string | null;
  correct_answers: number | null;
  played_at: string | null;
  day_index: number | null;
};

export type StoredAnswerRow = {
  question_id: number | null;
  question_text: string | null;
  category: string | null;
  selected_option_key: string | null;
  selected_option_text: string | null;
  correct_option_key: string | null;
  correct_option_text: string | null;
  is_correct: boolean | null;
};

export type UserDailyPlayRow = {
  day_index: number;
  played_at: string;
  correct_answers: number;
  total_questions: number;
  answers: StoredAnswerRow[];
};

export type KorrikaEdukia = {
  day: number;
  title: string;
  content: string;
};

const parseDayIndex = (raw: unknown) => {
  if (raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  const intValue = Math.trunc(parsed);
  return intValue;
};

const parseScoreValue = (raw: unknown) => {
  if (raw === null || raw === undefined) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
};

const toNullableString = (raw: unknown) => {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value || null;
};

const toOptionKey = (raw: unknown) => {
  if (raw === null || raw === undefined) return null;
  const key = String(raw).trim().toLowerCase();
  return key || null;
};

const toOptionText = (raw: unknown) => {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  return text || null;
};

const normalizeOptionText = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

type SanitizedQuestionOptions = {
  options: Record<string, string>;
  correctKey: string;
};

const sanitizeQuestionOptions = (
  rawOptions: unknown,
  rawCorrectKey: unknown
): SanitizedQuestionOptions => {
  const targetCorrectKey = toOptionKey(rawCorrectKey);
  const optionsSource = Array.isArray(rawOptions) ? rawOptions : [];

  const uniqueByKey = new Map<string, { key: string; text: string }>();
  optionsSource.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const option = item as Record<string, unknown>;
    const key = toOptionKey(option.opt_key);
    const text = toOptionText(option.opt_text);
    if (!key || !text) return;
    if (!uniqueByKey.has(key)) {
      uniqueByKey.set(key, { key, text });
    }
  });

  const sortedByKey = [...uniqueByKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  const uniqueByText = new Map<string, { key: string; text: string }>();

  sortedByKey.forEach((option) => {
    const textKey = normalizeOptionText(option.text);
    const existing = uniqueByText.get(textKey);
    if (!existing) {
      uniqueByText.set(textKey, option);
      return;
    }

    const existingIsCorrect = existing.key === targetCorrectKey;
    const optionIsCorrect = option.key === targetCorrectKey;
    if (optionIsCorrect && !existingIsCorrect) {
      uniqueByText.set(textKey, option);
    }
  });

  const deduped = [...uniqueByText.values()].sort((a, b) => a.key.localeCompare(b.key));
  let finalCorrectKey =
    targetCorrectKey && deduped.some((option) => option.key === targetCorrectKey)
      ? targetCorrectKey
      : null;

  if (!finalCorrectKey && targetCorrectKey) {
    const originalCorrect = sortedByKey.find((option) => option.key === targetCorrectKey);
    if (originalCorrect) {
      const textKey = normalizeOptionText(originalCorrect.text);
      const duplicateIndex = deduped.findIndex(
        (option) => normalizeOptionText(option.text) === textKey
      );
      if (duplicateIndex >= 0) {
        deduped[duplicateIndex] = originalCorrect;
      } else {
        deduped.unshift(originalCorrect);
      }
      finalCorrectKey = originalCorrect.key;
    }
  }

  if (!finalCorrectKey && deduped.length > 0) {
    finalCorrectKey = deduped[0].key;
  }

  return {
    options: deduped.reduce((acc, option) => {
      acc[option.key] = option.text;
      return acc;
    }, {} as Record<string, string>),
    correctKey: finalCorrectKey ?? ''
  };
};

const parseStoredAnswers = (raw: unknown): StoredAnswerRow[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const answer = item as Record<string, unknown>;
      const parsedQuestionId = parseDayIndex(answer.question_id);
      const isCorrectRaw = answer.is_correct;

      return {
        question_id: parsedQuestionId,
        question_text: toNullableString(answer.question_text),
        category: toNullableString(answer.category),
        selected_option_key: toNullableString(answer.selected_option_key),
        selected_option_text: toNullableString(answer.selected_option_text),
        correct_option_key: toNullableString(answer.correct_option_key),
        correct_option_text: toNullableString(answer.correct_option_text),
        is_correct: typeof isCorrectRaw === 'boolean' ? isCorrectRaw : null
      } satisfies StoredAnswerRow;
    })
    .filter((item): item is StoredAnswerRow => Boolean(item));
};

const shouldTreatAsOneBased = (dayValues: number[], daysCount: number) => {
  if (dayValues.length === 0) return false;
  const hasZeroBasedMarker = dayValues.some((value) => value === 0);
  if (hasZeroBasedMarker) return false;
  return dayValues.every((value) => value >= 1 && value <= daysCount);
};

type PlayersSource = {
  table: string;
  columns: string[];
};

type RegisterPlayerInput = {
  username: string;
  email: string;
};

type RegisterPlayerTarget = {
  table: string;
  payloadFactory: (input: RegisterPlayerInput) => Record<string, string>;
};

const PLAYER_SOURCES: PlayersSource[] = [];

const PLAYER_REGISTER_TARGETS: RegisterPlayerTarget[] = [
  {
    table: 'korrika_jokalariak',
    payloadFactory: ({ username, email }) => ({
      name: username.toUpperCase(),
      username,
      email,
      code: username.toUpperCase()
    })
  },
  {
    table: 'players',
    payloadFactory: ({ username, email }) => ({
      name: username.toUpperCase(),
      username,
      email
    })
  },
  {
    table: 'profiles',
    payloadFactory: ({ username, email }) => ({
      username,
      full_name: username.toUpperCase(),
      email
    })
  },
  {
    table: 'usuarios',
    payloadFactory: ({ username, email }) => ({
      nombre: username.toUpperCase(),
      username,
      email,
      codigo: username.toUpperCase()
    })
  }
];

const normalizePlayerName = (row: Record<string, unknown>) => {
  const raw =
    row['name'] ??
    row['username'] ??
    row['full_name'] ??
    row['nombre'] ??
    row['code'] ??
    row['codigo'] ??
    row['email'];

  if (!raw) return '';

  const value = String(raw).trim();
  if (!value) return '';
  if (value.includes('@')) return value.split('@')[0].toUpperCase();
  return value.toUpperCase();
};

export const getRegisteredPlayers = async () => {
  const names = new Set<string>();

  // Evita el Spam 404 si estamos en local sin backend definido real apuntado a tablas válidas.
  if (import.meta.env.DEV) {
    return ['ADMIN', 'JOKALARI_TEST'];
  }

  for (const source of PLAYER_SOURCES) {
    try {
      const { data, error } = await supabase
        .from(source.table)
        .select(source.columns.join(','))
        .limit(1000);

      if (error) continue;

      const sourceNames = ((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map(normalizePlayerName)
        .filter(Boolean);

      sourceNames.forEach((name) => names.add(name));
    } catch {
      // ignore and try next source
    }
  }

  return [...names];
};

const isDuplicateInsertError = (error: unknown) => {
  const maybeError = error as { code?: string; message?: string } | null;
  if (!maybeError) return false;
  if (maybeError.code === '23505') return true;
  const message = String(maybeError.message ?? '').toLowerCase();
  return message.includes('duplicate') || message.includes('already exists');
};

export const createRegisteredPlayer = async ({ username, email }: RegisterPlayerInput) => {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedUsername || !normalizedEmail) return false;

  for (const target of PLAYER_REGISTER_TARGETS) {
    try {
      const payload = target.payloadFactory({
        username: normalizedUsername,
        email: normalizedEmail
      });
      const { error } = await supabase.from(target.table).insert(payload);
      if (!error || isDuplicateInsertError(error)) {
        return true;
      }
    } catch {
      // ignore and try next table
    }
  }

  return false;
};

export const getLeaderboards = async (daysCount = 11) => {
  const { data, error } = await supabase
    .from('game_results')
    .select('user_id, player_name, correct_answers, played_at, day_index')
    .order('played_at', { ascending: false })
    .limit(5000);

  if (error) throw error;

  const rawRows = (data ?? []) as Array<Record<string, unknown>>;
  const rawDayValues = rawRows
    .map((row) => parseDayIndex(row.day_index))
    .filter((value): value is number => value !== null);
  const oneBased = shouldTreatAsOneBased(rawDayValues, daysCount);

  return rawRows.map((row) => {
    const parsedDay = parseDayIndex(row.day_index);
    const normalizedDay = parsedDay === null ? null : oneBased ? parsedDay - 1 : parsedDay;

    return {
      user_id: row.user_id ? String(row.user_id) : null,
      player_name: row.player_name ? String(row.player_name) : null,
      correct_answers:
        row.correct_answers === null || row.correct_answers === undefined
          ? null
          : Number(row.correct_answers),
      played_at: row.played_at ? String(row.played_at) : null,
      day_index:
        normalizedDay !== null && normalizedDay >= 0 && normalizedDay < daysCount
          ? normalizedDay
          : null
    } satisfies GameResultRow;
  });
};

export const getUserDailyPlays = async (userId: string, daysCount: number) => {
  const { data, error } = await supabase
    .from('game_results')
    .select('day_index, played_at, correct_answers, total_questions, answers')
    .eq('user_id', userId)
    .eq('play_mode', 'DAILY')
    .not('day_index', 'is', null)
    .order('played_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    day_index: unknown;
    played_at: string | null;
    correct_answers: unknown;
    total_questions: unknown;
    answers: unknown;
  }>;
  const rawDayValues = rows
    .map((row) => parseDayIndex(row.day_index))
    .filter((value): value is number => value !== null);
  const oneBased = shouldTreatAsOneBased(rawDayValues, daysCount);
  const uniqueByDay = new Map<number, UserDailyPlayRow>();

  rows.forEach((row) => {
    if (!row.played_at) return;
    const parsedDay = parseDayIndex(row.day_index);
    if (parsedDay === null) return;
    const dayIdx = oneBased ? parsedDay - 1 : parsedDay;
    if (dayIdx < 0 || dayIdx >= daysCount) return;
    if (!uniqueByDay.has(dayIdx)) {
      uniqueByDay.set(dayIdx, {
        day_index: dayIdx,
        played_at: row.played_at,
        correct_answers: parseScoreValue(row.correct_answers),
        total_questions: parseScoreValue(row.total_questions),
        answers: parseStoredAnswers(row.answers)
      });
    }
  });

  return [...uniqueByDay.values()].sort((a, b) => a.day_index - b.day_index);
};

export const getEdukiak = async (daysCount: number) => {
  const { data, error } = await supabase.from('korrika_edukiak').select('*');
  if (error) throw error;

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const dayRaw = row['day'] ?? row['day_index'] ?? row['dia'] ?? row['eguna'];
      const titleRaw = row['title'] ?? row['titulo'] ?? row['izenburua'] ?? row['izenburua_eu'];
      const contentRaw = row['content'] ?? row['text'] ?? row['testua'] ?? row['edukia'] ?? row['body'];

      const day = Number(dayRaw);
      const title = String(titleRaw ?? `Eguna ${day}`);
      const content = String(contentRaw ?? '').trim();

      if (!Number.isFinite(day) || day < 0 || day > daysCount || !content) return null;
      return { day, title, content };
    })
    .filter((item): item is KorrikaEdukia => Boolean(item))
    .sort((a, b) => a.day - b.day);
};

export const getQuizData = async () => {
  const { data, error } = await supabase
    .from('chapters')
    .select(
      'id, name, questions:questions (id, legacy_id, question_text, correct_key, options:options (opt_key, opt_text))'
    );

  if (error) throw error;

  return ((data ?? []) as Array<Record<string, any>>).map((chapter) => ({
    capitulo: String(chapter.name ?? ''),
    preguntas: (chapter.questions ?? []).map((q: any) => {
      const { options: sanitizedOptions, correctKey } = sanitizeQuestionOptions(
        q.options,
        q.correct_key
      );

      return {
        id: q.id,
        pregunta: q.question_text,
        respuesta_correcta: correctKey,
        categoryName: chapter.name,
        opciones: sanitizedOptions
      };
    })
  })) as QuizData[];
};

export const getGlobalStartDate = async (configTable: string, configKey: string) => {
  const { data, error } = await supabase
    .from(configTable)
    .select('config_value')
    .eq('config_key', configKey)
    .maybeSingle();

  if (error) throw error;

  const rawValue = String((data as { config_value?: string } | null)?.config_value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? rawValue : null;
};

export const saveGlobalStartDate = async (configTable: string, configKey: string, value: string) => {
  const { error } = await supabase
    .from(configTable)
    .upsert(
      {
        config_key: configKey,
        config_value: value
      },
      { onConflict: 'config_key' }
    );

  if (error) throw error;
};
