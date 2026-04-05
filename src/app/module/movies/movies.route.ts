import { Router } from 'express';
import { movieController } from './movies.controller.js';
import { checkAuth } from '../../middleware/checkAuth.js';
import { UserRole } from '../../../generated/prisma/enums.js';
import { multerUpload } from '../../config/multer.config.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createMovieValidationSchema,
  updateMovieValidationSchema,
} from './movies.validation.js';

const router = Router();

router.get('/featured', movieController.getFeaturedMovies);
router.get('/new-releases', movieController.getNewReleases);
router.get('/coming-soon', movieController.getComingSoon);
router.get('/editors-picks', movieController.getEditorsPicks);

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);

router.post(
  '/',
  checkAuth(UserRole.ADMIN),
  multerUpload.single('file'),
  validateRequest(createMovieValidationSchema),
  movieController.createMovie,
);

router.put(
  '/:id',
  checkAuth(UserRole.ADMIN),
  multerUpload.single('file'),
  validateRequest(updateMovieValidationSchema),
  movieController.updateMovie,
);

router.delete('/:id', checkAuth(UserRole.ADMIN), movieController.deleteMovie);

export const MovieRoutes = router;
