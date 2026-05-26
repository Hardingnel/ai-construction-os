import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload, storageService } from '../services/storage/storageService';
import { uploadToCloudinary, deleteFromCloudinary, isConfigured } from '../services/storage/cloudinaryService';
import { prisma, db } from '../app';
import { createNotification } from './notifications';
import fs from 'fs';

const router = Router();

router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { projectId, documentType } = req.body;
    let url = `/uploads/${req.file.filename}`;
    let cloudinaryResult = null;
    if (isConfigured) {
      try {
        const buffer = fs.readFileSync(req.file.path);
        cloudinaryResult = await uploadToCloudinary(buffer, {
          folder: 'aicos/uploads',
          resourceType: req.file.mimetype.startsWith('image/') ? 'image' : 'raw',
        });
        if (cloudinaryResult) url = cloudinaryResult.secureUrl;
      } catch {}
    }
    if (projectId) {
      const doc = await db.document.create({
        data: {
          name: req.file.originalname,
          type: documentType || req.file.mimetype,
          url,
          projectId,
          size: req.file.size,
        },
      });
      createNotification({ title: 'File Uploaded', message: `"${req.file.originalname}" uploaded to project`, type: 'info', link: `/documents?projectId=${projectId}`, userId: req.userId! }).catch(() => {});
      return res.json({ success: true, file: doc, url, cloudinary: cloudinaryResult });
    }
    res.json({ success: true, url, filename: req.file.filename, size: req.file.size, cloudinary: cloudinaryResult });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/multiple', authenticate, upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const { projectId } = req.body;
    const documents = [];
    for (const file of files) {
      let url = `/uploads/${file.filename}`;
      if (isConfigured) {
        try {
          const buffer = fs.readFileSync(file.path);
          const cloudResult = await uploadToCloudinary(buffer, { folder: 'aicos/uploads' });
          if (cloudResult) url = cloudResult.secureUrl;
        } catch {}
      }
      const doc = await db.document.create({
        data: { name: file.originalname, type: file.mimetype, url, projectId: projectId || '', size: file.size },
      });
      documents.push(doc);
    }
    res.json({ success: true, files: documents });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:filename', async (req, res) => {
  try {
    const file = await storageService.getFile(req.params.filename);
    res.set('Content-Type', 'application/octet-stream');
    res.send(file);
  } catch {
    res.status(404).json({ message: 'File not found' });
  }
});

export { router as uploadRouter };
