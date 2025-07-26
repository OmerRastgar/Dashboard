import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Token refresh interval (25 minutes - 5 minutes before expiry)
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000;

// Function to decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode, consider it expired
  }
};

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: Array<string | { name: string; display_name: string; [key: string]: any }>;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token refresh function
  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh_token');
      if (!storedRefreshToken) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      
      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      return false;
    }
  };

  useEffect(() => {
    // Check for stored authentication data on app start
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log('Stored token is expired, attempting refresh...');
          refreshToken().then((success) => {
            if (!success) {
              console.log('Token refresh failed, clearing stored data');
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user');
            }
          });
        } else {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(() => {
      console.log('Attempting to refresh token...');
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [token]);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};