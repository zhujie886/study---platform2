/**
 * 文件上传路由
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  uploadAvatar,
  uploadPostImages,
  uploadVideo,
  uploadDocument,
  uploadRecording,
  uploadAny,
  handleUploadError
} from '../middleware/upload.middleware';
import {
  saveFile,
  saveFiles,
  deleteFile,
  compressImage,
  generateThumbnail
} from '../utils/fileStorage';

const router = Router();

/**
 * 上传头像
 */
router.post('/avatar', authenticateToken, uploadAvatar, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    // 压缩图片
    const compressed = await compressImage(req.file.buffer, 800, 85);
    
    // 保存文件
    const result = await saveFile(compressed, 'avatar', req.file.originalname);
    
    res.json({
      message: '头像上传成功',
      url: result.url,
      size: result.size
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 上传动态图片（支持多张）
 */
router.post('/post/images', authenticateToken, uploadPostImages, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    // 批量压缩和保存
    const results = await Promise.all(
      req.files.map(async (file) => {
        const compressed = await compressImage(file.buffer, 1920, 80);
        return saveFile(compressed, 'post', file.originalname);
      })
    );

    res.json({
      message: `成功上传 ${results.length} 张图片`,
      images: results.map(r => ({ url: r.url, size: r.size }))
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 上传视频
 */
router.post('/video', authenticateToken, uploadVideo, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    // 保存视频
    const result = await saveFile(req.file.buffer, 'video', req.file.originalname);
    
    // TODO: 生成视频缩略图
    // const thumbnail = await generateVideoThumbnail(req.file.buffer);
    
    res.json({
      message: '视频上传成功',
      url: result.url,
      size: result.size
    });
  } catch (error) {
    console.error('上传视频失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 上传文档
 */
router.post('/document', authenticateToken, uploadDocument, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const result = await saveFile(req.file.buffer, 'document', req.file.originalname);
    
    res.json({
      message: '文档上传成功',
      url: result.url,
      size: result.size,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('上传文档失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 上传会议录制
 */
router.post('/recording', authenticateToken, uploadRecording, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const result = await saveFile(req.file.buffer, 'recording', req.file.originalname);
    
    res.json({
      message: '录制文件上传成功',
      url: result.url,
      size: result.size
    });
  } catch (error) {
    console.error('上传录制文件失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 上传附件（支持任意文件类型）
 */
router.post('/attachments', authenticateToken, uploadAny, handleUploadError, async (req: Request, res: Response) => {
  try {
    const files = (req.files || []) as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const results = await Promise.all(
      files.map((file) => saveFile(file.buffer, 'attachment', file.originalname))
    );

    res.json({
      message: `成功上传 ${results.length} 个文件`,
      files: results.map((item, idx) => ({
        url: item.url,
        size: item.size,
        name: files[idx]?.originalname || null,
        mimeType: files[idx]?.mimetype || null,
        type: 'file'
      }))
    });
  } catch (error) {
    console.error('上传附件失败:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

/**
 * 删除文件
 */
router.delete('/:category/:filename', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, filename } = req.params;
    const url = `/uploads/${category}/${filename}`;
    
    // TODO: 验证用户权限（只能删除自己上传的文件）
    
    const success = await deleteFile(url);
    
    if (success) {
      res.json({ message: '文件删除成功' });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;


