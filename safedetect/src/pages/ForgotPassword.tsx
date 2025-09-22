import React from 'react'
import ForgotPasswordForm from '../components/ForgotPasswordForm'

const ForgotPassword: React.FC = () => {
  return (
    <div className="auth-header">
      <h1 className="auth-title">Forgot your password?</h1>
      <p className="auth-subtitle">Secure your account</p>
       <ForgotPasswordForm />
    </div>
  )
}

export default ForgotPassword
