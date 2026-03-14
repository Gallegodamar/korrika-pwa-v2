import { supabase } from '../supabase';
import {
  UsernameChangeResult,
  UsernameHistoryEntry,
  mapAccountApiError,
  normalizeUsername,
  validateUsername
} from './accountApi';

export type AdminUserDirectoryEntry = {
  user_id: string;
  current_username: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  previous_usernames: string[];
  rename_count: number;
  self_service_change_count: number;
  admin_change_count: number;
  played_days: number;
  total_points: number;
  last_played_at: string | null;
};

type AdminDeleteResultsResult = {
  deleted_rows: number;
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean);
};

const mapAdminDirectoryEntry = (value: Record<string, unknown>): AdminUserDirectoryEntry => ({
  user_id: String(value.user_id ?? ''),
  current_username: String(value.current_username ?? ''),
  status: String(value.status ?? 'active'),
  created_at: value.created_at ? String(value.created_at) : null,
  updated_at: value.updated_at ? String(value.updated_at) : null,
  previous_usernames: toStringArray(value.previous_usernames),
  rename_count: toNumber(value.rename_count),
  self_service_change_count: toNumber(value.self_service_change_count),
  admin_change_count: toNumber(value.admin_change_count),
  played_days: toNumber(value.played_days),
  total_points: toNumber(value.total_points),
  last_played_at: value.last_played_at ? String(value.last_played_at) : null
});

export const getAdminUsers = async (search = '', limit = 80) => {
  const normalizedSearch = normalizeUsername(search);
  const { data, error } = await supabase
    .schema('app')
    .rpc('admin_list_users', {
      p_search: normalizedSearch || null,
      p_limit: limit
    });

  if (error) {
    throw new Error(mapAccountApiError(error));
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map(mapAdminDirectoryEntry)
    .filter((entry) => entry.user_id && entry.current_username);
};

export const getAdminUsernameTimeline = async (userId: string) => {
  const { data, error } = await supabase
    .schema('app')
    .rpc('admin_get_username_timeline', {
      p_user_id: userId
    });

  if (error) {
    throw new Error(mapAccountApiError(error));
  }

  return (data ?? []) as UsernameHistoryEntry[];
};

export const adminChangeUsername = async (
  userId: string,
  nextUsernameInput: string,
  reason = 'admin_panel'
) => {
  const nextUsername = normalizeUsername(nextUsernameInput);
  if (!validateUsername(nextUsername)) {
    throw new Error('Formato baliogabea. Erabili 3-32 karaktere: a-z, 0-9 eta _.');
  }

  const { data, error } = await supabase
    .schema('app')
    .rpc('admin_change_username', {
      p_user_id: userId,
      p_new_username: nextUsername,
      p_reason: reason,
      p_request_id: generateUUID(),
      p_metadata: { client: 'web', actor: 'admin_panel' }
    })
    .maybeSingle();

  if (error) {
    throw new Error(mapAccountApiError(error));
  }

  if (!data) {
    throw new Error('Erantzun hutsa jaso da zerbitzaritik.');
  }

  const result = data as Record<string, unknown>;

  return {
    user_id: String(result.out_user_id ?? ''),
    old_username: String(result.out_old_username ?? ''),
    new_username: String(result.out_new_username ?? ''),
    changed_at: String(result.out_changed_at ?? '')
  } as UsernameChangeResult;
};

export const adminClearUserGameResults = async (
  userId: string,
  dayIndex: number | null = null
) => {
  const { data, error } = await supabase
    .schema('app')
    .rpc('admin_clear_user_game_results', {
      p_user_id: userId,
      p_day_index: typeof dayIndex === 'number' ? dayIndex : null
    })
    .maybeSingle();

  if (error) {
    throw new Error(mapAccountApiError(error));
  }

  return {
    deleted_rows: toNumber((data as AdminDeleteResultsResult | null)?.deleted_rows)
  };
};
