export const PROGRESS_STORAGE_PREFIX = 'korrika_quiz_progress_v7';
export const LEGACY_PROGRESS_STORAGE_KEY = 'korrika_quiz_progress_v6';
export const SIMULATION_STORAGE_KEY = 'korrika_simulation_mode';
export const QUIZ_CACHE_KEY = 'korrika_quiz_data_v1';
export const EDUKIAK_CACHE_KEY = 'korrika_edukiak_v1';
export const PLAYERS_CACHE_KEY = 'korrika_registered_players_v1';
export const START_DATE_CACHE_KEY = 'korrika_start_date_v1';
export const LEADERBOARDS_CACHE_KEY = 'korrika_leaderboards_v2';
export const USER_DAILY_PLAYS_CACHE_PREFIX = 'korrika_user_daily_plays_v2';
export const WELCOME_SEEN_STORAGE_PREFIX = 'korrika_welcome_seen_v1';
export const GLOBAL_CONFIG_TABLE = 'korrika_app_config';
export const START_DATE_CONFIG_KEY = 'challenge_start_date';

export const DAYS_COUNT = 11;
export const QUESTIONS_PER_DAY = 12;
export const QUESTIONS_PER_CATEGORY = 2;
export const SECONDS_PER_QUESTION = 20;
export const DEFAULT_CHALLENGE_START_DATE = '2026-02-14';
export const LEGACY_ADMIN_USERS = ['admin', 'k_admin'];
export const DAY_OPTIONS = Array.from({ length: DAYS_COUNT }, (_, idx) => idx);

export const QUIZ_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
export const EDUKIAK_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
export const PLAYERS_CACHE_TTL_MS = 1000 * 60 * 10;
export const START_DATE_CACHE_TTL_MS = 1000 * 60 * 5;
export const LEADERBOARDS_CACHE_TTL_MS = 1000 * 60 * 2;
export const USER_DAILY_PLAYS_CACHE_TTL_MS = 1000 * 60 * 2;
