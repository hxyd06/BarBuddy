import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

// Define context shape
type AuthContextType = {
  user: User | null | undefined;
  authInitialized: boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: undefined,
  authInitialized: false,
});

// Provide context to the app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Listen for auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthInitialized(true);
    });
    return unsubscribe;
  }, []);

  // Make user and authInitialized available to children
  return (
    <AuthContext.Provider value={{ user, authInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context
export const useAuth = () => useContext(AuthContext);
