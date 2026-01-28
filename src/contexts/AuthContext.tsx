import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '../types';
import tokenStorage from '../services/tokenStorage';
import apiClient, { withAuth } from '../services/apiClient';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  clearError: () => void;
  validateAndRestoreSession: () => Promise<void>;
}

// 🚨 GEÇİCİ BYPASS - Production'da kaldırılacak!
const BYPASS_LOGIN = false;

const mockUser: User = {
  id: 'bypass-user-1',
  email: 'test@sarjet.com',
  name: 'Test Kullanıcı',
  userVehicles: [
    {
      id: 'mock-vehicle-1',
      nickname: 'Tesla Model 3',
      currentSoC: 80,
      variant: {
        id: 'mock-variant-1',
        name: 'Long Range',
        batteryCapacity: 75,
        range: 500,
        model: {
          id: 'mock-model-1',
          name: 'Model 3',
          brand: {
            id: 'mock-brand-1',
            name: 'Tesla'
          }
        }
      }
    }
  ]
};

const initialState: AuthState = {
  isAuthenticated: BYPASS_LOGIN,
  isLoading: false,
  user: BYPASS_LOGIN ? mockUser : null,
  token: BYPASS_LOGIN ? 'bypass-token' : null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START_LOADING':
      return { ...state, isLoading: true, error: null };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: null,
      };
    
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'AUTH_UPDATE_USER':
      return { ...state, user: action.payload };
    
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const base = await apiClient.getBaseUrl();
      const response = await fetch(`${base}/api/auth/profile`, {
        headers: withAuth(token) as Record<string, string>,
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const validateAndRestoreSession = async () => {
    // 🚨 BYPASS MODE - Skip token validation
    if (BYPASS_LOGIN) {
      console.log('🚨 LOGIN BYPASS ACTIVE - Skipping token validation');
      return;
    }
    
    dispatch({ type: 'AUTH_START_LOADING' });
    
    try {
      const token = await tokenStorage.getToken();
      const userData = await tokenStorage.getUser();
      
      if (token && userData) {
        const isValid = await validateToken(token);
        if (isValid) {
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { token, user: userData } 
          });
        } else {
          // Geçersiz token'ları temizle
          await tokenStorage.deleteToken();
          await tokenStorage.deleteUser();
          dispatch({ 
            type: 'AUTH_FAILURE', 
            payload: 'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.' 
          });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: 'Oturum bilgileri alınamadı. Lütfen tekrar giriş yapın.' 
      });
    }
  };

  const login = async (token: string, user: User) => {
    try {
      const tokenSaved = await tokenStorage.saveToken(token);
      const userSaved = await tokenStorage.saveUser(user);
      
      if (!tokenSaved || !userSaved) {
        throw new Error('Kullanıcı bilgileri kaydedilemedi');
      }
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { token, user } });
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: 'Giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.' 
      });
    }
  };

  const logout = async () => {
    try {
      await tokenStorage.deleteToken();
      await tokenStorage.deleteUser();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Logout hatasında da state'i temizle
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const updateUser = async (user: User) => {
    try {
      const userSaved = await tokenStorage.saveUser(user);
      if (userSaved) {
        dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
      } else {
        throw new Error('Kullanıcı bilgileri güncellenemedi');
      }
    } catch (error) {
      console.error('Update user error:', error);
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: 'Kullanıcı bilgileri güncellenemedi.' 
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  useEffect(() => {
    validateAndRestoreSession();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
    clearError,
    validateAndRestoreSession,
  };

  return (
    <AuthContext.Provider value={value}>
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
