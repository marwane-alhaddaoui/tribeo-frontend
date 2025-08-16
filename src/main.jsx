import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { QuotasProvider } from "./context/QuotasContext";
import "./i18n";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <QuotasProvider>
        <App />
      </QuotasProvider>
    </AuthProvider>
  </React.StrictMode>,
)
