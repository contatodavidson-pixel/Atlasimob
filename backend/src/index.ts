import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { propertiesRouter } from './routes/properties';
import { analysisRouter } from './routes/analysis';
import { investorsRouter } from './routes/investors';
import { alertsRouter } from './routes/alerts';
import { reportsRouter } from './routes/reports';
import { chatRouter } from './routes/chat';
import { agenciesRouter } from './routes/agencies';
import { whatsappRouter } from './routes/whatsapp';
import { notificationsRouter } from './routes/notifications';
import { waitlistRouter } from './routes/waitlist';
import { schedulerService } from './services/scheduler';
import { whatsappService } from './services/whatsapp';
import { logger } from './lib/logger';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'https://atlasimob.vercel.app',
  'https://atlasimob.app.br',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições. Tente novamente em 15 minutos.',
});
app.use('/api/', limiter);

app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/investors', investorsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/waitlist', waitlistRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  schedulerService.start();
  whatsappService.launch().catch(err => {
    logger.warn('WhatsApp service não iniciado (não crítico):', err?.message);
  });
  logger.info('Servidor iniciado com sucesso');
});

export default app;
