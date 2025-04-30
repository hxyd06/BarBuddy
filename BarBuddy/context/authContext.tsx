import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

type AuthContextType = {
  user: User | null | undefined;
  authInitialized: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  authInitialized: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthInitialized(true); // ✅ ensures we know when auth is ready
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, authInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);