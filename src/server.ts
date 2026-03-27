/* eslint-disable @typescript-eslint/no-explicit-any */
import app from './app.js';
// import { env } from './config/env';
// import { prisma } from './lib/prisma';

const PORT = 5000;

const startServer = async () => {
  try {
    // await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(PORT, () => {
      console.log(`🚀Server running on http://localhost:${PORT}`);
    });
    // app.listen(env.PORT, () => {
    //   console.log(`🚀Server running on http://localhost:${env.PORT}`);
    // });
  } catch (error: any) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
