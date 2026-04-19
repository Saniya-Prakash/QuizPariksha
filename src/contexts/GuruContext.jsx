import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const GuruContext = createContext({});

export function GuruProvider({ children }) {
  const { user, role, logout: authLogout } = useAuth();

  // IMPORTANT: Use useMemo so the 'api' object doesn't recreate on every render
  const guruApi = useMemo(() => {
    if (!user || role !== 'Teacher') return null;

    return {
      logout: () => authLogout(),
      createBatch: async (name) => {
        // Use the integer ID here if user.user_id is your number
        return supabase.from('batches').insert({ 
          guru_id: user.user_id || user.id, 
          name 
        });
      },
      getStudents: async () => {
        return supabase.from('batch_students')
          .select('*')
          .eq('guru_id', user.user_id || user.id);
      },
    };
  }, [user, role, authLogout]);

  // Don't return null here! Just pass the state down.
  // The UI should handle the "Access Denied" view if needed.
  return (
    <GuruContext.Provider value={{ api: guruApi, user }}>
      {children}
    </GuruContext.Provider>
  );
}

// Named export for the hook
export const useGuru = () => {
  const context = useContext(GuruContext);
  if (context === undefined) {
    throw new Error('useGuru must be used within a GuruProvider');
  }
  return context;
};