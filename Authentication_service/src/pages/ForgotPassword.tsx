import React from 'react'
import ForgotPasswordForm from '../components/ForgotPasswordForm'

const ForgotPassword: React.FC = () => {
  return (
    <div className="auth-header">
      <h1 className="auth-title p-5 text-center">Forgot your password?</h1>
      <p className="text-gray-600 mb-8">Enter your email to reset your password</p>
       <ForgotPasswordForm />
    </div>
  )
}

export default ForgotPassword
