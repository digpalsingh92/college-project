import express from 'express';
import { getResources, createResource, updateResource, deleteResource, getResourceById } from './resources.controller.js';

const router = express.Router();

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/', createResource);
router.patch('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
