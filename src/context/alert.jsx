import { createContext, useContext, useState } from "react";

const initialState = false;

const AlertContext = createContext();

export function useAlertContext() {
  return useContext(AlertContext);
}

export function AlertContextProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState("");

  function toggleAlert(msg) {
    setState((prev) => !prev);
    setMessage(msg);
  }

  return (
    <AlertContext.Provider value={{ message, isAlertOpen: state, toggleAlert }}>
      {children}
    </AlertContext.Provider>
  );
}
