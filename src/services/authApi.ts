import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase';

type LoginFunctionResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

const getLoginFunctionUrl = () =>
  import.meta.env.VITE_LOGIN_WITH_USERNAME_FUNCTION_URL ||
  `${supabaseUrl}/functions/v1/login-with-username`;

const buildLegacyInternalEmail = (usernameInput: string) => {
  const normalized = usernameInput.trim().toLowerCase();
  return normalized.includes('@') ? normalized : `${normalized}@korrika.app`;
};

const canUseLegacyFallback =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_LEGACY_USERNAME_LOGIN_FALLBACK === '1';

const signInWithLegacyEmail = async (username: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: buildLegacyInternalEmail(username),
    password
  });

  if (error || !data.session) {
    throw new Error(
      error?.message?.includes('Invalid login credentials')
        ? 'Kodea edo pasahitza okerra da. Ziurtatu ondo idatzi dituzula.'
        : error?.message || 'Ezin izan da saioa hasi. Saiatu berriro.'
    );
  }

  return data.session;
};

const tryLegacyFallback = async (username: string, password: string, prefixMessage: string) => {
  try {
    return await signInWithLegacyEmail(username, password);
  } catch (legacyError) {
    const legacyMessage =
      legacyError instanceof Error
        ? legacyError.message
        : 'Ezin izan da saioa hasi. Saiatu berriro.';

    throw new Error(`${prefixMessage} ${legacyMessage}`);
  }
};

export const loginWithUsername = async (username: string, password: string) => {
  try {
    const response = await fetch(getLoginFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey
      },
      body: JSON.stringify({ username, password })
    });

    const payload = (await response.json().catch(() => null)) as
      | (Partial<LoginFunctionResponse> & { message?: string })
      | null;

    if (response.status === 404) {
      if (canUseLegacyFallback) {
        return await tryLegacyFallback(
          username,
          password,
          'Username bidezko login zerbitzua ez dago prest oraindik. Fallback lokala ere huts egin du:'
        );
      }
      throw new Error(
        'Ez dago username bidezko login zerbitzua martxan. Desplegatu login-with-username funtzioa.'
      );
    }

    if (!response.ok || !payload?.access_token || !payload.refresh_token) {
      throw new Error(
        payload?.message || 'Kodea edo pasahitza okerra da. Ziurtatu ondo idatzi dituzula.'
      );
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token
    });

    if (error || !data.session) {
      throw new Error('Ezin izan da saioa hasi. Saiatu berriro.');
    }

    return data.session;
  } catch (error) {
    const isNetworkLevelFailure =
      error instanceof TypeError ||
      (error instanceof Error && /fetch|network|failed to fetch/i.test(error.message));

    if (canUseLegacyFallback && isNetworkLevelFailure) {
      return await tryLegacyFallback(
        username,
        password,
        'Username bidezko login zerbitzua ez dago erabilgarri une honetan. Fallback lokala ere huts egin du:'
      );
    }

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error(
      'Username bidezko login zerbitzua ez dago erabilgarri. Desplegatu login-with-username funtzioa.'
    );
  }
};
