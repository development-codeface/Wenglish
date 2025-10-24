import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  categoryChat
} from '../controller/chaCategory.controller.js';
import { adminMiddleware, authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/',authMiddleware, adminMiddleware, createCategory);
router.get('/', getAllCategories);
router.get('/:id',authMiddleware, getCategoryById);
router.put('/:id',authMiddleware,adminMiddleware, updateCategory);
router.delete('/:id',authMiddleware,adminMiddleware, deleteCategory);
router.post('/category-chat',authMiddleware, categoryChat);

export default router;
