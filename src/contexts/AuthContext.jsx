import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (session) => {
    if (!session?.user) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // This fetches your actual user record from the public schema
    // data.id will be your integer primary key
    const { data, error } = await supabase
      .from('User') 
      .select('*')
      .eq('id', session.user.id) // Assuming your public table uses the Auth UUID as the primary key
      .single();

    if (!error && data) {
      setUser(data); 
      setRole(data.role ?? null);
    } else {
      console.error("Profile sync error:", error);
      setUser(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserData(session);
    });

    // Listen for auth changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  const value = {
    user,
    role,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Ensure this hook is exported correctly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};