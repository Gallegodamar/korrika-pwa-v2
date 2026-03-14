import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type AccountIdentity = {
  user_id: string;
  current_username: string;
  is_admin: boolean;
  previous_usernames: string[];
};

export type UsernameHistoryEntry = {
  change_id: number;
  old_username: string | null;
  new_username: string;
  changed_at: string;
  changed_by: string;
  source: string;
  reason: string | null;
  request_id: string;
};

export type UsernameChangeResult = {
  user_id: string;
  old_username: string;
  new_username: string;
  changed_at: string;
};

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_]{1,30}[a-z0-9])?$/;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const validateUsername = (value: string) => USERNAME_RE.test(normalizeUsername(value));

export const getMyAccountIdentity = async () => {
  const { data, error } = await supabase
    .schema('app')
    .rpc('get_my_account_identity')
    .maybeSingle();

  if (error) throw new Error(mapAccountApiError(error));
  return (data ?? null) as AccountIdentity | null;
};

export const getMyUsernameHistory = async (limit = 10) => {
  const { data, error } = await supabase
    .schema('app')
    .from('username_change_history')
    .select('change_id, old_username, new_username, changed_at, changed_by, source, reason, request_id')
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(mapAccountApiError(error));
  return (data ?? []) as UsernameHistoryEntry[];
};

export const mapAccountApiError = (error: Pick<PostgrestError, 'code' | 'message' | 'details' | 'hint'>) => {
  if (error.code === '23505') {
    return 'Erabiltzaile hori dagoeneko erabilita edo erreserbatuta dago.';
  }
  if (error.code === '22023') {
    const normalizedMessage = String(error.message || '').toLowerCase();
    if (normalizedMessage.includes('use_change_my_username_for_self')) {
      return 'Zure izena aldatzeko, erabili Profila atala.';
    }
    if (normalizedMessage.includes('cannot_clear_own_results_from_admin')) {
      return 'Zure emaitzak ezabatzeko, ez erabili administrazio ekintza hau.';
    }
    if (normalizedMessage.includes('invalid_day_index')) {
      return 'Egun baliogabea hautatu duzu.';
    }
    return 'Formato baliogabea. Erabili 3-32 karaktere: a-z, 0-9 eta _.';
  }
  if (error.code === 'PGRST106') {
    return 'Username backend-a ez dago prest: `app` schema ez dago APIan exposed. Exekutatu `supabase config push` edo gehitu `app` Dashboardean.';
  }
  if (error.code === 'PGRST202') {
    return 'Username backend-a ez dago prest: falta da `change_my_username` RPC-a. Aplikatu migrazioak lehenengo.';
  }
  if (error.code === 'PGRST301') {
    return 'Saioa ez da baliozkoa. Hasi berriro saioa.';
  }
  if (error.code === '42501') {
    return 'Saioa iraungi da. Hasi berriro saioa.';
  }
  const normalizedMessage = String(error.message || '').toLowerCase();
  if (normalizedMessage.includes('invalid schema: app')) {
    return 'Username backend-a ez dago prest: `app` schema ez dago APIan exposed. Exekutatu `supabase config push` edo gehitu `app` Dashboardean.';
  }
  if (normalizedMessage.includes('could not find the function')) {
    return 'Username backend-a ez dago prest: falta da RPC funtzioa. Aplikatu migrazioak lehenengo.';
  }
  if (normalizedMessage.includes('permission denied for schema app')) {
    return 'Username backend-ak ez dauka baimen egokirik. Berrikusi grants eta RLS politikak.';
  }
  if (normalizedMessage.includes('username_unchanged')) {
    return 'Hori da dagoeneko zure erabiltzaile izena.';
  }
  if (normalizedMessage.includes('current_username_not_found')) {
    return 'Ez da uneko erabiltzaile izena aurkitu. Jarri harremanetan administratzailearekin.';
  }
  if (normalizedMessage.includes('target_user_not_found')) {
    return 'Helburuko jokalaria ez da aurkitu.';
  }
  if (normalizedMessage.includes('forbidden')) {
    return 'Ez duzu baimenik ekintza hau egiteko.';
  }
  if (normalizedMessage.includes('cannot_clear_own_results_from_admin')) {
    return 'Zure emaitzak ezabatzeko, ez erabili administrazio ekintza hau.';
  }
  if (normalizedMessage.includes('use_change_my_username_for_self')) {
    return 'Zure izena aldatzeko, erabili Profila atala.';
  }

  console.error("Supabase RPC Error:", error);
  return `Ezin izan da erabiltzaile izena aldatu: ${error.message} (Code: ${error.code})`;
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const changeMyUsername = async (nextUsernameInput: string) => {
  const nextUsername = normalizeUsername(nextUsernameInput);
  if (!validateUsername(nextUsername)) {
    throw new Error('Formato baliogabea. Erabili 3-32 karaktere: a-z, 0-9 eta _.');
  }

  const { data, error } = await supabase
    .schema('app')
    .rpc('change_my_username', {
      p_new_username: nextUsername,
      p_reason: 'self_service',
      p_request_id: generateUUID(),
      p_metadata: { client: 'web' }
    })
    .maybeSingle();

  if (error) {
    throw new Error(mapAccountApiError(error));
  }

  if (!data) {
    throw new Error('Erantzun hutsa jaso da zerbitzaritik (Data == null).');
  }

  const result = data as any;

  return {
    user_id: result.out_user_id,
    old_username: result.out_old_username,
    new_username: result.out_new_username,
    changed_at: result.out_changed_at,
  } as UsernameChangeResult;
};
