import express from 'express';
import { getResources, createResource, updateResource } from '../controllers/resource.controller.js';

const router = express.Router();

router.get('/', getResources);
router.post('/', createResource);
router.patch('/:id', updateResource);

export default router;
