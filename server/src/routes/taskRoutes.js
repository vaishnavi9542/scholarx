import { Router } from 'express';
import { addTask, editTask, getTasks, removeTask } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getTasks);
router.post('/', addTask);
router.patch('/:id', editTask);
router.delete('/:id', removeTask);

export default router;
