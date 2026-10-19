import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ZekrDataProvider } from './context/ZekrDataContext.jsx' // ← جديد
import App from './App.jsx'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ZekrDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ZekrDataProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
