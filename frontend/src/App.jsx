import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Bets from './pages/Bets'
import Standings from './pages/Standings'
import NavBar from './components/NavBar'

function PrivateLayout({ children }) {
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />
  return (
    <>
      <NavBar />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateLayout>
              <Dashboard />
            </PrivateLayout>
          }
        />
        <Route
          path="/bets"
          element={
            <PrivateLayout>
              <Bets />
            </PrivateLayout>
          }
        />
        <Route
          path="/standings"
          element={
            <PrivateLayout>
              <Standings />
            </PrivateLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
// arriba con los imports:
import Playoffs from './pages/Playoffs'

// dentro de <Routes>:
<Route path="/playoffs" element={<PrivateLayout><Playoffs /></PrivateLayout>} />
