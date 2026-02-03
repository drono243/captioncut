
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
  usageCount: number;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  incrementUsage: () => void;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('captioncut_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async () => {
    setIsLoggingIn(true);
    // Simulate Google OAuth delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const usageStr = localStorage.getItem('captioncut_usage') || '0';
    const mockUser: User = {
      name: 'Alex Editor',
      email: 'alex.editor@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      usageCount: parseInt(usageStr, 10),
    };
    
    setUser(mockUser);
    localStorage.setItem('captioncut_user', JSON.stringify(mockUser));
    setIsLoggingIn(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('captioncut_user');
  };

  const incrementUsage = () => {
    setUser(prev => {
      if (!prev) return null;
      const newCount = prev.usageCount + 1;
      const updatedUser = { ...prev, usageCount: newCount };
      localStorage.setItem('captioncut_user', JSON.stringify(updatedUser));
      localStorage.setItem('captioncut_usage', newCount.toString());
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, incrementUsage, isLoggingIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
