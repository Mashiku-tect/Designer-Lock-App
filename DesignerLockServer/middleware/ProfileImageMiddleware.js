// middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

// Storage config: save to /uploads and keep original file extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profileimages'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `profile_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter (accept only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  cb(null, isValid);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
