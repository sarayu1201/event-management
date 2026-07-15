import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { auth } from "../api/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

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
    // Format phone number for Firebase (+91 + 10-digit number)
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "+91" + cleanPhone;
    } else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      cleanPhone = "+" + cleanPhone;
    } else if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+91" + cleanPhone;
    }

    // Prepare dynamic Recaptcha container
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      }
    });

    const result = await signInWithPhoneNumber(auth, cleanPhone, verifier);
    setConfirmationResult(result);
    return { message: "OTP sent successfully via Firebase", phone: cleanPhone };
  };

  const verifyOtp = async (payload) => {
    if (!confirmationResult) {
      throw new Error("No active OTP request found. Please request OTP again.");
    }

    // Confirm the OTP code with Firebase
    const userCredential = await confirmationResult.confirm(payload.otp);
    
    // Retrieve the verified user ID token
    const firebaseToken = await userCredential.user.getIdToken();

    // Call backend verify-otp endpoint to sync with application DB and generate app JWT session token
    const { data } = await api.post("/auth/verify-otp", {
      ...payload,
      firebaseToken,
    });

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

