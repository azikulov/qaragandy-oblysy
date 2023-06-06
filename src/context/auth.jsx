import { createContext, useContext, useState } from "react";

const initialState = false;

const AuthContext = createContext();

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthContextProvider({ children }) {
  const [state, setState] = useState(initialState);

  return (
    <AuthContext.Provider value={{ isAuth: state, updateAuth: setState }}>
      {children}
    </AuthContext.Provider>
  );
}
