import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'scholarx-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  response.status(status).json({
    message: error.message || 'Unexpected server error'
  });
});

export default app;
