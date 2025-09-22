import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { forgotPasswordSchema, ForgotPasswordFormData } from '../utils/validation'

const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await forgotPassword(data.email)
      toast.success('Password reset email sent! Please check your email.')
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-5">
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          {...register('email')}
          placeholder="Enter your email"
        />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="loading mr-2"></div>
            Sending...
          </div>
        ) : (
          'Send Reset Email'
        )}
      </button>

      <div className="text-center">
        <Link to="/auth/signin" className="btn btn-link">
          Back to Sign In
        </Link>
      </div>
    </form>
  )
}

export default ForgotPasswordForm
