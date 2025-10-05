import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { magicLinkSchema, MagicLinkFormData } from '../utils/validation'

const MagicLinkForm: React.FC = () => {
  const { magicLinkSignIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true)
    try {
      await magicLinkSignIn(data.email)
      setEmailSent(true)
      toast.success('Magic link sent! Please check your email.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnotherLink = () => {
    setEmailSent(false)
    reset()
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h3>
          <p className="text-gray-600">
            We've sent you a magic link. Click the link in your email to sign in to your account.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            The link will expire in 10 minutes for security reasons.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSendAnotherLink}
          className="btn btn-outline"
        >
          Send another link
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sign in with Magic Link
        </h3>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a magic link to sign in instantly - no password needed!
        </p>
      </div>

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
          'Send Magic Link'
        )}
      </button>
    </form>
  )
}

export default MagicLinkForm
