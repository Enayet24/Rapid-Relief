import { createContext, useContext, useState } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // const [user, setUser] = useState(() => {
  //   const stored = localStorage.getItem("user");
  //   return stored ? JSON.parse(stored) : null;
  // });

  // Temporary bypass
  const [user, setUser] = useState({
  id: "temp-id-123",
  name: "Test User",
  email: "test@test.com",
  role: "citizen",
}); // TEMP: REVERT before real testing

  const login = async (email, password) => {
    const { data } = await axiosClient.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, password, role }) => {
    const { data } = await axiosClient.post("/auth/register", { name, email, password, role });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}