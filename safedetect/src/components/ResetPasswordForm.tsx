import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { resetPasswordSchema, ResetPasswordFormData } from '../utils/validation'

const ResetPasswordForm: React.FC = () => {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new password reset.')
      navigate('/auth/forgot-password')
      return
    }

    // You could set the email in the form if needed
    // setValue('email', email)
  }, [searchParams, navigate, setValue])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const token = searchParams.get('token')
      if (!token) {
        toast.error('Invalid reset link. Please request a new password reset.')
        return
      }

      await resetPassword(token, data.password)
      toast.success('Password reset successfully! Please sign in with your new password.')
      navigate('/auth/signin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="form-group">
        <label className="form-label">New Password</label>
        <input
          type="password"
          className="form-input"
          {...register('password')}
          placeholder="Enter your new password"
        />
        {errors.password && <p className="form-error">{errors.password.message}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">Confirm New Password</label>
        <input
          type="password"
          className="form-input"
          {...register('confirmPassword')}
          placeholder="Confirm your new password"
        />
        {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="loading mr-2"></div>
            Resetting...
          </div>
        ) : (
          'Reset Password'
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

export default ResetPasswordForm
