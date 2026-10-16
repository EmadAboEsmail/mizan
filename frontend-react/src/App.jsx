import { Routes, Route } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle.jsx'
import Home from './pages/Home.jsx'
import Zekr from './pages/Zekr.jsx'

function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/zekr" element={<Zekr />} />
      </Routes>
    </>
  )
}

export default App
