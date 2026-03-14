import { User } from '@supabase/supabase-js';
import { StateCreator } from 'zustand';
import { supabase } from '../../supabase';
import { AccountIdentity, UsernameHistoryEntry, getMyAccountIdentity, getMyUsernameHistory } from '../../services/accountApi';

export interface AuthSlice {
    user: User | null;
    loadingAuth: boolean;
    accountIdentity: AccountIdentity | null;
    usernameHistory: UsernameHistoryEntry[];
    pendingUsername: string;
    loadingAccount: boolean;
    usernameChangeError: string | null;
    usernameChangeNotice: string | null;

    setUser: (user: User | null) => void;
    setLoadingAuth: (loading: boolean) => void;
    setAccountIdentity: (identity: AccountIdentity | null) => void;
    setUsernameHistory: (history: UsernameHistoryEntry[]) => void;
    setPendingUsername: (pending: string | ((prev: string) => string)) => void;
    setUsernameChangeError: (error: string | null) => void;
    setUsernameChangeNotice: (notice: string | null) => void;

    fetchAccountIdentity: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
    user: null,
    loadingAuth: true,
    accountIdentity: null,
    usernameHistory: [],
    pendingUsername: '',
    loadingAccount: false,
    usernameChangeError: null,
    usernameChangeNotice: null,

    setUser: (user) => set({ user }),
    setLoadingAuth: (loadingAuth) => set({ loadingAuth }),
    setAccountIdentity: (accountIdentity) => set({ accountIdentity }),
    setUsernameHistory: (history) => set({ usernameHistory: history }),
    setPendingUsername: (pending) => set((s) => ({ pendingUsername: typeof pending === 'function' ? pending(s.pendingUsername) : pending })),
    setUsernameChangeError: (usernameChangeError) => set({ usernameChangeError }),
    setUsernameChangeNotice: (usernameChangeNotice) => set({ usernameChangeNotice }),

    fetchAccountIdentity: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            set({ accountIdentity: null, usernameHistory: [], pendingUsername: '' });
            return;
        }

        const sessionUserId = session.user.id;

        try {
            set({ loadingAccount: true });
            const [identity, history] = await Promise.all([
                getMyAccountIdentity(),
                getMyUsernameHistory(8)
            ]);

            const {
                data: { session: latestSession }
            } = await supabase.auth.getSession();

            if (latestSession?.user?.id !== sessionUserId) {
                return;
            }

            set({ accountIdentity: identity ?? null, usernameHistory: history });

            if (identity?.current_username) {
                set((state) => ({
                    pendingUsername: state.pendingUsername.trim().length > 0 ? state.pendingUsername : identity.current_username
                }));
            }
        } catch (err) {
            console.error('Error fetching account identity:', err);
            set({ accountIdentity: null, usernameHistory: [] });
            if (err instanceof Error && err.message) {
                set({ usernameChangeError: err.message });
            }
        } finally {
            set({ loadingAccount: false });
        }
    }
});
