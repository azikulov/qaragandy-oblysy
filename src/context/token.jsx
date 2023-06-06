import { createContext, useContext, useState } from "react";

const initialState = { access: null, refresh: null };

const TokenContext = createContext();

export function useTokenContext() {
  return useContext(TokenContext);
}

export function TokenContextProvider({ children }) {
  const [state, setState] = useState(initialState);

  function updateToken({ access, refresh }) {
    setState({ access, refresh });
  }

  return (
    <TokenContext.Provider value={{ token: state, updateToken }}>
      {children}
    </TokenContext.Provider>
  );
}
