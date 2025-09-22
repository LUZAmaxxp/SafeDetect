# React Authentication System

A complete React-based authentication system with sign-in, sign-up, password reset, and magic link functionality. This system provides a modern, responsive UI with form validation and error handling.

## Features

- **Sign In**: Traditional email/password authentication with remember me option
- **Sign Up**: User registration with validation and email verification
- **Magic Link**: Passwordless authentication via email
- **Forgot Password**: Password reset functionality
- **Reset Password**: Secure password reset with token validation
- **Form Validation**: Comprehensive client-side validation using Zod
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: User-friendly error messages and loading states
- **TypeScript**: Full TypeScript support for better development experience

## Project Structure

```
react-auth-system/
├── src/
│   ├── components/
│   │   ├── AuthLayout.tsx          # Main layout wrapper
│   │   ├── SignInForm.tsx          # Traditional sign-in form
│   │   ├── SignUpForm.tsx          # User registration form
│   │   ├── MagicLinkForm.tsx       # Magic link authentication
│   │   ├── ForgotPasswordForm.tsx  # Forgot password form
│   │   └── ResetPasswordForm.tsx   # Password reset form
│   ├── pages/
│   │   ├── SignIn.tsx              # Sign-in page
│   │   ├── SignUp.tsx              # Sign-up page
│   │   ├── ForgotPassword.tsx      # Forgot password page
│   │   └── ResetPassword.tsx       # Reset password page
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context and hooks
│   ├── services/
│   │   └── authService.ts          # API service for authentication
│   ├── utils/
│   │   └── validation.ts           # Form validation schemas
│   ├── App.tsx                     # Main application component
│   └── main.tsx                    # Application entry point
├── backend/                        # Backend API (if needed)
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd react-auth-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

### Backend Setup

The authentication system requires a backend API. You can either:

1. **Use the included backend** (if provided):
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Configure your own backend**:
   - Update the API endpoints in `src/services/authService.ts`
   - Set the `VITE_API_URL` environment variable

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### API Endpoints

The system expects the following backend endpoints:

- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/magic-link` - Send magic link
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address

## Usage

### Using the AuthContext

```tsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()

  const handleSignIn = async () => {
    try {
      await signIn('user@example.com', 'password')
      // User is now authenticated
    } catch (error) {
      console.error('Sign in failed:', error)
    }
  }

  return (
    <div>
      {user ? (
        <p>Welcome, {user.firstName}!</p>
      ) : (
        <button onClick={handleSignIn}>Sign In</button>
      )}
    </div>
  )
}
```

### Form Validation

All forms include comprehensive validation:

- **Email**: Valid email format required
- **Password**: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- **Confirm Password**: Must match password
- **Terms Agreement**: Required for sign up

### Magic Link Authentication

The system supports passwordless authentication:

1. User enters email address
2. Magic link is sent to their email
3. User clicks link to authenticate
4. Token is validated and user is signed in

## Customization

### Styling

The system uses Tailwind CSS for styling. You can customize:

- Colors in `tailwind.config.js`
- Component styles in `src/index.css`
- Layout and spacing by modifying the components

### Validation Rules

Update validation schemas in `src/utils/validation.ts`:

```tsx
export const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  isAgreed: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
})
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dependencies

### Core Dependencies
- **React 18** - UI framework
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Hot Toast** - Toast notifications
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework

### Development Dependencies
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **ESLint** - Code linting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact the development team or create an issue in the repository.
