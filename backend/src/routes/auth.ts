import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register',
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('Senha deve ter ao menos 8 caracteres'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.status(201).json({ user, token });
  }
);

authRouter.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  }
);

const USER_SELECT = {
  id: true, name: true, email: true, role: true, phone: true,
  whatsappPhone: true, onboardingCompleted: true, investorProfile: true,
  budget: true, preferredCities: true, preferredTypes: true,
  minYield: true, notifyEmail: true,
} as const;

authRouter.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: USER_SELECT });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

authRouter.put('/me', authenticate, async (req: AuthRequest, res) => {
  const {
    name, phone, whatsappPhone,
    onboardingCompleted, investorProfile, budget,
    preferredCities, preferredTypes, minYield, notifyEmail,
  } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(whatsappPhone !== undefined && { whatsappPhone }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted }),
      ...(investorProfile !== undefined && { investorProfile }),
      ...(budget !== undefined && { budget }),
      ...(preferredCities !== undefined && { preferredCities: JSON.stringify(preferredCities) }),
      ...(preferredTypes !== undefined && { preferredTypes: JSON.stringify(preferredTypes) }),
      ...(minYield !== undefined && { minYield }),
      ...(notifyEmail !== undefined && { notifyEmail }),
    },
    select: USER_SELECT,
  });
  res.json(user);
});
