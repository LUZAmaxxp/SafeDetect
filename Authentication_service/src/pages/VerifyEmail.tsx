import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isVerifying, setIsVerifying] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setMessage('Invalid verification link')
        setIsVerifying(false)
        return
      }

      try {
        await authService.verifyEmail({ token })
        setMessage('Email verified successfully! You can now sign in.')
        toast.success('Email verified successfully!')
        setTimeout(() => navigate('/auth/signin'), 3000)
      } catch (error: any) {
        setMessage(error.message || 'Verification failed')
        toast.error(error.message || 'Verification failed')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          {isVerifying ? (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-gray-600">{message}</p>
              {!isVerifying && message.includes('successfully') && (
                <p className="mt-4 text-sm text-gray-500">
                  Redirecting to sign in page...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
