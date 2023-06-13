import React from "react";
import ReactDOM from "react-dom/client";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import App from "./App.jsx";
import "./index.css";
import { TokenContextProvider } from "./context/token.jsx";
import { AuthContextProvider } from "./context/auth.jsx";
import { AlertContextProvider } from "./context/alert.jsx";
import { resourcesTranslate } from "./config.js";

i18next.use(initReactI18next).init({
  resources: resourcesTranslate,
  lng: "kz",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthContextProvider>
      <AlertContextProvider>
        <TokenContextProvider>
          <App />
        </TokenContextProvider>
      </AlertContextProvider>
    </AuthContextProvider>
  </React.StrictMode>
);
