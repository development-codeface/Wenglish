import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  categoryChat,
  getChatHistory
} from '../controller/chaCategory.controller.js';
import { adminMiddleware, authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadImages } from '../middlewares/upload.Instance.js';

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware,uploadImages.single('image'), createCategory);
router.get('/',authMiddleware, getAllCategories);
router.get('/chat-history', authMiddleware, getChatHistory);  
router.get('/:id', authMiddleware, getCategoryById);           
router.put('/:id', authMiddleware, adminMiddleware,uploadImages.single('image'), updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);
router.post('/category-chat', authMiddleware, categoryChat);


export default router;
