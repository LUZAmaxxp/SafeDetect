import React from 'react'
import ResetPasswordForm from '../components/ResetPasswordForm'

const ResetPassword: React.FC = () => {
  return (
    <div className="auth-header">
      <h1 className="auth-title">Set New Password</h1>
      <p className="auth-subtitle">Secure your account</p>
      <ResetPasswordForm />
    </div>
  )
}

export default ResetPassword
