const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const cookieParser = require('cookie-parser')
const winston = require('winston')
const zxcvbn = require('zxcvbn')
require('dotenv').config()

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'EMAIL_USER', 'EMAIL_PASS']
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Required environment variable ${varName} is not set`)
    process.exit(1)
  }
})

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Logging setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}

// Connect to MongoDB with TLS
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: false, // Set to true only for development
})
.then(() => logger.info('MongoDB connected securely'))
.catch(err => {
  logger.error('MongoDB connection error:', err)
  process.exit(1)
})

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(cookieParser())
app.use(express.json())

// In-memory storage for temporary tokens (consider using Redis for production)
let resetTokens = new Map()
let magicLinkTokens = new Map()

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  )
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Routes

// Sign In
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user)
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token,
      redirectUrl: 'http://localhost:3000' // Redirect to detection dashboard
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verified: false
    })

    await user.save()

    const authToken = generateToken(user)

    // Send verification email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' })
        const verificationUrl = `http://localhost:5173/auth/verify-email?token=${token}`

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your email',
          html: `
            <h2>Welcome ${firstName}!</h2>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
          `
        })
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue without email
      }
    } else {
      console.log('Email not configured, skipping verification email')
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token: authToken
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Sign Out
app.post('/api/auth/signout', authenticateToken, (req, res) => {
  res.json({ message: 'Signed out successfully' })
})

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Generate reset token
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })
    resetTokens.set(token, user._id.toString())

    // Send reset email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const resetUrl = `http://localhost:5173/auth/reset-password?token=${token}&email=${email}`

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Reset your password',
          html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
          `
        })
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue without email
      }
    } else {
      console.log('Email not configured, skipping reset email')
    }

    res.json({ message: 'Password reset email sent' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    const userId = resetTokens.get(token)
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    user.password = hashedPassword
    await user.save()

    // Remove used token
    resetTokens.delete(token)

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Magic Link
app.post('/api/auth/magic-link', async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Generate magic link token
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '10m' })
    magicLinkTokens.set(token, user._id.toString())

    // Send magic link email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const magicLinkUrl = `http://localhost:5173/auth/magic-link?token=${token}&email=${email}`

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your magic link',
          html: `
            <h2>Magic Link Sign In</h2>
            <p>Click the link below to sign in instantly:</p>
            <a href="${magicLinkUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Sign In</a>
            <p>This link will expire in 10 minutes.</p>
          `
        })
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue without email
      }
    } else {
      console.log('Email not configured, skipping magic link email')
    }

    res.json({ message: 'Magic link sent' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Verify Email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' })
    }

    user.verified = true
    await user.save()
    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' })
  }
})

// Magic Link Authentication
app.post('/api/auth/magic-link-auth', async (req, res) => {
  try {
    const { token } = req.body

    const userId = magicLinkTokens.get(token)
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Remove used token
    magicLinkTokens.delete(token)

    const authToken = generateToken(user)
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token: authToken
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
