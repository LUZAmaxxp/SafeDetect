import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import AuthLayout from './components/AuthLayout'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div >
          <div className="w-full space-y-8">
            <Routes>
              <Route path="/auth" element={<AuthLayout />}>
                <Route path="signin" element={<SignIn />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route index element={<Navigate to="/auth/signin" replace />} />
              </Route>
              <Route path="/" element={<Navigate to="/auth/signin" replace />} />
            </Routes>
          </div>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: 'colored',
            },
            error: {
              duration: 4000,
              theme: 'colored',
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App
