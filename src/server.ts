/* eslint-disable @typescript-eslint/no-explicit-any */
import app from './app.js';
import { envVars } from './app/config/env.js';
import { prisma } from './app/lib/prisma.js';
import { seedAdmin } from './app/seedAdmin/seedAdmin.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    await seedAdmin();

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
