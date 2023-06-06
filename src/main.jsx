import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { TokenContextProvider } from "./context/token.jsx";
import { AuthContextProvider } from "./context/auth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthContextProvider>
      <TokenContextProvider>
        <App />
      </TokenContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
