import { createContext, useContext, useState, useCallback } from 'react';

const PrivyContext = createContext({
  authenticated: false,
  user: null,
  ready: true,
  login: () => {},
  logout: () => {},
});

export function usePrivy() {
  return useContext(PrivyContext);
}

export function PrivyProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = useCallback(() => {
    setAuthenticated(true);
    setUser({
      id: 'mock-user-id',
      wallet: { address: '0x1234567890abcdef1234567890abcdef12345678' },
      email: null,
      phone: null,
    });
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <PrivyContext.Provider value={{ authenticated, user, ready: true, login, logout }}>
      {children}
    </PrivyContext.Provider>
  );
}