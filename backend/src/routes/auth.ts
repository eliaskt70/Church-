import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import db from '../config/database';
import { generateToken } from '../middleware/auth';
import { requestOtpValidator, verifyOtpValidator, googleAuthValidator } from '../utils/validators';

const router = Router();

// In-memory OTP store for MVP (phone -> { hash, expiresAt })
const otpStore = new Map<string, { hash: string; expiresAt: Date }>();

// POST /api/auth/request-otp
router.post('/request-otp', requestOtpValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { phone } = req.body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    otpStore.set(phone, { hash, expiresAt });

    // Log OTP to console for MVP (no SMS integration)
    console.log(`[OTP] Phone: ${phone}, Code: ${otp}`);

    res.json({ success: true, data: { message: 'OTP sent successfully' } });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { phone, code } = req.body;

    const stored = otpStore.get(phone);
    if (!stored) {
      res.status(400).json({ success: false, error: 'No OTP requested for this phone' });
      return;
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(phone);
      res.status(400).json({ success: false, error: 'OTP has expired' });
      return;
    }

    const isValid = await bcrypt.compare(code, stored.hash);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Invalid OTP code' });
      return;
    }

    // Remove used OTP
    otpStore.delete(phone);

    // Find or create user
    let user = await db('users').where('phone', phone).first();

    if (!user) {
      const [newUser] = await db('users')
        .insert({
          id: crypto.randomUUID(),
          phone,
          account_type: 'beneficiary',
        })
        .returning('*');
      user = newUser;
    }

    const token = generateToken({ userId: user.id, accountType: user.account_type });

    res.json({
      success: true,
      data: { token, user: { id: user.id, phone: user.phone, account_type: user.account_type } },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/google
router.post('/google', googleAuthValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg });
    return;
  }

  try {
    const { token, email, name, google_id } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Google token is required' });
      return;
    }

    // For MVP, accept the google_id directly from the client
    // In production, verify the token with Google's API
    const gId = google_id || token;

    let user = await db('users').where('google_id', gId).first();

    if (!user && email) {
      user = await db('users').where('email', email).first();
      if (user) {
        await db('users').where('id', user.id).update({ google_id: gId });
        user.google_id = gId;
      }
    }

    if (!user) {
      const [newUser] = await db('users')
        .insert({
          id: crypto.randomUUID(),
          google_id: gId,
          email: email || null,
          name: name || null,
          account_type: 'beneficiary',
        })
        .returning('*');
      user = newUser;
    }

    const jwtToken = generateToken({ userId: user.id, accountType: user.account_type });

    res.json({
      success: true,
      data: { token: jwtToken, user: { id: user.id, email: user.email, account_type: user.account_type } },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate with Google' });
  }
});

// Export for testing
export { otpStore };
export default router;
