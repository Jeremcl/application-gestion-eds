const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Sous-dossiers par type
const createSubDir = (subDir) => {
  const dir = path.join(uploadsDir, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || 'misc';
    const dir = createSubDir(type);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Filtrer les types de fichiers acceptés (images uniquement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Route d'upload protégée
router.use(authMiddleware);

// POST /api/uploads/:type - Upload un fichier
// :type peut être 'vehicules', 'tickets', etc.
router.post('/:type', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' });
    }

    const type = req.params.type;
    const filename = req.file.filename;

    // Construire l'URL relative
    const fileUrl = `/uploads/${type}/${filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload', error: error.message });
  }
});

// DELETE /api/uploads/:type/:filename - Supprimer un fichier
router.delete('/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadsDir, type, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Fichier supprimé' });
    } else {
      res.status(404).json({ message: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
});

// Middleware de gestion d'erreur multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 10MB)' });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

module.exports = router;
