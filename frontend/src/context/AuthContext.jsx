import { createContext, useContext, useState, useEffect} from 'react';
import axios from 'axios';

let API_URL;
if (import.meta.env.MODE === "development") {
 
  API_URL = "http://localhost:3001";  
} else {
  API_URL = import.meta.env.VITE_API_URL;  
}

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount(reload) and get the username
  useEffect(() => {

    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      
      if (token && username) {
        try {
          // Verify token with backend
          const response = await axios.get(`${API_URL}/api/validate-token`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.valid) {
            setUser({ username, token });
          } else {
            // Token is invalid, clear storage
            logout();
          }
        } catch (error) {
          // If there's an error (like user doesn't exist), clear storage
          console.error('Token validation error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/login`, {
        username,
        password,
      });
      const { token, username: userUsername } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', userUsername);
      setUser({ username: userUsername, token });
      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/register`, {
        username,
        password,
      });
      const { token, username: userUsername } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', userUsername);
      setUser({ username: userUsername, token });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 
