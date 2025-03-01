import multer from 'multer';
import path from 'path';
import fs from "fs";

const resumeFolder = './public/data/resumes';
const docsFolder = './public/data/leaves';

[resumeFolder, docsFolder].forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fileType = file.mimetype;
    let uploadPath = '';

    if (fileType.includes('pdf')) {
      uploadPath = './public/data/resumes';
    } else {
      uploadPath = './public/data/leaves';
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
  limits: { fileSize: 5 * 1024 * 1024 }
});
