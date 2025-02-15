import multer from 'multer';
import path from 'path';

// Configure storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fileType = file.mimetype;
    console.log(fileType);
    let uploadPath = '';

    // Set the upload path based on file type
    if (fileType.includes('pdf')) {
      uploadPath = './public/data/resume';
    } 
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const newFileName = `${uniqueSuffix}${extension}`;

    cb(null, newFileName);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } 
});
