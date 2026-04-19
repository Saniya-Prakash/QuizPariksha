import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Spinner, Flex, Center } from '@chakra-ui/react';

const StudentContext = createContext();

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        // 1. Get the authenticated session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // 2. Fetch their profile from the public."User" table
          const { data, error } = await supabase
            .from('User')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && data) {
            setUser(data);
          }
        }
      } catch (error) {
        console.error("Error loading student profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, []);

  const api = {
    logout: async () => {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  if (loading) {
    return (
      <Center h="100vh" w="100vw" bg="bg.muted">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <StudentContext.Provider value={{ user, api }}>
      {children}
    </StudentContext.Provider>
  );
};