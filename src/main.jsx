import React from "react";
import ReactDOM from "react-dom/client";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import App from "./App.jsx";
import "./index.css";
import { TokenContextProvider } from "./context/token.jsx";
import { AuthContextProvider } from "./context/auth.jsx";
import { resourcesTranslate } from "./config.js";

i18next.use(initReactI18next).init({
  resources: resourcesTranslate,
  lng: "kz",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <I18nextProvider i18n={i18n}> */}
    <AuthContextProvider>
      <TokenContextProvider>
        <App />
      </TokenContextProvider>
    </AuthContextProvider>
    {/* </I18nextProvider> */}
  </React.StrictMode>
);
