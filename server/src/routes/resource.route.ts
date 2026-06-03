import express from 'express';
import { 
  getResources, 
  createResource, 
  updateResource, 
  deleteResource, 
  getResourceById,
  getResourceUnits,
  updateResourceUnit,
  allocateResourceController,
  releaseResourceController,
  getAllocationsController
} from '../controllers/resource.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getResources);
router.get('/allocations', requireAuth, requireRole('admin', 'doctor'), getAllocationsController);
router.post('/allocate', requireAuth, requireRole('admin', 'doctor'), allocateResourceController);
router.post('/release', requireAuth, requireRole('admin', 'doctor'), releaseResourceController);

// Unit management routes
router.get('/:id/units', getResourceUnits);
router.patch('/units/:unitId', requireAuth, requireRole('admin'), updateResourceUnit);

router.get('/:id', getResourceById);
router.post('/', createResource);
router.patch('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
