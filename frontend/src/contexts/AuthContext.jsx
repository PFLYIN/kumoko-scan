import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.service.js';
import { UNAUTHORIZED_EVENT } from '../services/http.js';
import { AuthContext } from './contextObjects.js';

// status: 'loading' (hidratando via /users/me) | 'authenticated' | 'anonymous'
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    // O cookie httpOnly e invisivel ao JS: a unica forma de saber se ha sessao e perguntar ao backend.
    authService
      .me()
      .then((user) => active && setState({ status: 'authenticated', user }))
      .catch(() => active && setState({ status: 'anonymous', user: null }));
    return () => {
      active = false;
    };
  }, []);

  // Qualquer 401 fora do fluxo de login derruba a sessao local.
  useEffect(() => {
    const onUnauthorized = () => setState({ status: 'anonymous', user: null });
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await authService.login(credentials);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const register = useCallback((dados) => authService.register(dados), []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState({ status: 'anonymous', user: null });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authService.me();
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const updateProfile = useCallback(async (body) => {
    const user = await authService.updateMe(body);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isLoading: state.status === 'loading',
      isAuthenticated: state.status === 'authenticated',
      isAdmin: state.user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [state, login, register, logout, refreshUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
