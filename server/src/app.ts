import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', service: 'eoffice-server', time: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/files', filesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
