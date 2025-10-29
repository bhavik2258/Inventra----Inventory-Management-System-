import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

export type UserRole = 'admin' | 'manager' | 'clerk' | 'auditor';

interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.auth.getMe();
      
      if (response.success && response.data) {
        const userData = response.data;
        setUser({
          id: userData._id || userData.id,
          email: userData.email,
          role: userData.role,
          fullName: userData.fullName,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password);
      
      if (response.success && response.data) {
        // Store token
        localStorage.setItem('token', response.data.token);
        
        // Set user data
        const userData = response.data.user;
        setUser({
          id: userData._id || userData.id,
          email: userData.email,
          role: userData.role,
          fullName: userData.fullName,
        });
        
        return { error: null };
      }
      
      return { error: new Error('Login failed') };
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        return { error };
      }
      return { error: new Error('Login failed') };
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const response = await api.auth.register(fullName, email, password, role);
      
      if (response.success) {
        return { error: null };
      }
      
      return { error: new Error('Signup failed') };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      login, 
      signup,
      logout, 
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
