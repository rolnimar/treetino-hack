import { createContext, useContext } from 'react';
import type { AdminValue } from './admin-provider';
export const AdminContext = createContext<AdminValue | null>(null);
export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error('useAdmin must be used within AdminProvider');
  return value;
}
