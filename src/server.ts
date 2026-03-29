/* eslint-disable @typescript-eslint/no-explicit-any */
import app from './app.js';
import { envVars } from './app/config/env.js';
import { prisma } from './app/lib/prisma.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(envVars.PORT, () => {
      console.log(
        `🚀 FilmSphere Server is live on http://localhost:${envVars.PORT}`,
      );
    });
  } catch (error: any) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
