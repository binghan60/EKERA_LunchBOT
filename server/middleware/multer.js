import multer from 'multer';
const storage = multer.memoryStorage(); // 用 memoryStorage 方便上傳到 Cloudinary
const upload = multer({ storage });

export default upload;
