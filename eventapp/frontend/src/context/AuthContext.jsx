import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("eventhub_token");
    const savedUser = localStorage.getItem("eventhub_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("eventhub_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const { data } = await api.post("/auth/login", { email, password, role });
    localStorage.setItem("eventhub_token", data.token);
    localStorage.setItem("eventhub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const sendOtp = async (phone) => {
    const { data } = await api.post("/auth/send-otp", { phone });
    return data;
  };

  const verifyOtp = async (payload) => {
    // Call backend verify-otp endpoint directly
    const { data } = await api.post("/auth/verify-otp", payload);

    if (data.exists && data.token) {
      localStorage.setItem("eventhub_token", data.token);
      localStorage.setItem("eventhub_user", JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("eventhub_token", data.token);
    localStorage.setItem("eventhub_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("eventhub_token");
    localStorage.removeItem("eventhub_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

