import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionRouter } from './routes/sessions';
import { accountRouter } from './routes/accounts';
import { authRouter } from './routes/auth';
import { ResourceMonitor } from './services/ResourceMonitor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/sessions', sessionRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Clay Cloud Backend running on port ${PORT}`);
});

