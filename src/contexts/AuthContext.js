import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      console.log('Initializing user from localStorage:', savedUser ? 'exists' : 'missing');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user'); // Clear invalid data
      return null;
    }
  });
  
  const [token, setToken] = useState(() => {
    try {
      const savedToken = localStorage.getItem('token');
      console.log('Initializing token from localStorage:', savedToken ? 'exists' : 'missing');
      return savedToken || null;
    } catch (error) {
      console.error('Error getting token:', error);
      localStorage.removeItem('token'); // Clear invalid data
      return null;
    }
  });

  const login = (userData, authToken) => {
    try {
      console.log('Login called with token:', authToken ? 'exists' : 'missing');
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      console.log('Logging out, clearing auth state');
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 