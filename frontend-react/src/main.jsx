import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ZekrDataProvider } from './context/ZekrDataContext.jsx'
import { BudgetProvider } from './context/BudgetContext.jsx'
import App from './App.jsx'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ZekrDataProvider>
          <BudgetProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </BudgetProvider>
        </ZekrDataProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
