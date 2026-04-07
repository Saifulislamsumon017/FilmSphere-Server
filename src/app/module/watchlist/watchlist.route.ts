import { Router } from 'express';
import { watchlistController } from './watchlist.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';

const router = Router();

router.get(
  '/',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  watchlistController.getWatchlist,
);

router.post(
  '/:movieId',
  checkAuth(UserRole.USER, UserRole.ADMIN),

  watchlistController.addToWatchlist,
);

router.delete(
  '/:movieId',
  checkAuth(UserRole.USER, UserRole.ADMIN),

  watchlistController.removeFromWatchlist,
);

router.get(
  '/check/:movieId',
  checkAuth(UserRole.USER, UserRole.ADMIN),
  watchlistController.isInWatchlist,
);

export const watchlistRoutes = router;
