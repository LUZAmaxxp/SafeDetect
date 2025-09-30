const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// In-memory storage (replace with database in production)
let users = []
let resetTokens = new Map()
let magicLinkTokens = new Map()

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    host: process.env.SMTPT_HOST,
    user: process.env.SMPTP_USER,
    pass: process.env.SMTP_PASS,
    port:process.env.SMTP_PORT
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

    const user = users.find(u => u.email === email)
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
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
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
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verified: false
    }

    users.push(user)

    // Send verification email
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' })
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

    const authToken = generateToken(user)
    res.json({
      user: {
        id: user.id,
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

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Generate reset token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })
    resetTokens.set(token, user.id)

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

    const user = users.find(u => u.id === userId)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    user.password = hashedPassword

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

    const user = users.find(u => u.email === email)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Generate magic link token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '10m' })
    magicLinkTokens.set(token, user.id)

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

    res.json({ message: 'Magic link sent' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get Current User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  })
})

// Verify Email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const user = users.find(u => u.id === decoded.id)

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' })
    }

    user.verified = true
    res.json({ message: 'Email verified successfully' })
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' })
  }
})

// Magic Link Authentication
app.post('/api/auth/magic-link-auth', (req, res) => {
  try {
    const { token } = req.body

    const userId = magicLinkTokens.get(token)
    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    const user = users.find(u => u.id === userId)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Remove used token
    magicLinkTokens.delete(token)

    const authToken = generateToken(user)
    res.json({
      user: {
        id: user.id,
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
