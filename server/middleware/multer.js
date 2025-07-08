import multer from 'multer';
import sendErrorEmail from '../utils/sendEmail.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('檔案格式錯誤！請僅上傳圖片檔案。');
    // We don't send email here directly, but the global error handler in the route will catch it.
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

export default upload;
