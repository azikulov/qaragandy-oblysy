import { createContext, useContext, useState } from "react";

const initialState = { access: null, refresh: null };

const TokenContext = createContext();

function useTokenContext() {
  return useContext(TokenContext);
}

function TokenContextProvider({ children }) {
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

export { useTokenContext, TokenContextProvider };
