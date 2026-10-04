import { createContext, useContext } from 'react';
import type { AdminSession } from '../../lib/schemas';
import type { ConnectedWallet } from '../../chain/wallet';
export type Session = AdminSession & { connected: ConnectedWallet };
interface AuthValue {
  session: Session | null;
  isSigningIn: boolean;
  error: Error | null;
  retry: () => void;
  logout: () => void;
}
export const AuthContext = createContext<AuthValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
