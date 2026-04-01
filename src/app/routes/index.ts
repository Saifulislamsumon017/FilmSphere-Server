import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';

const router = Router();

// ---------------- Authentication Routes ----------------

router.use('/auth', AuthRoutes);

export const IndexRoutes = router;
