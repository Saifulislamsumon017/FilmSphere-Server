import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { MovieRoutes } from '../module/movies/movies.route.js';

const router = Router();

// ---------------- Authentication Routes ----------------

router.use('/auth', AuthRoutes);

// ---------------- Movies Routes ----------------

router.use('/movies', MovieRoutes);

export const IndexRoutes = router;
