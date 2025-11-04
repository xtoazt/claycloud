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

// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now (can be restricted in production)
    // In production, you might want to whitelist specific domains:
    // const allowedOrigins = ['https://your-frontend.vercel.app', 'https://yourdomain.com'];
    // if (allowedOrigins.indexOf(origin) !== -1) {
    //   callback(null, true);
    // } else {
    //   callback(new Error('Not allowed by CORS'));
    // }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
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

