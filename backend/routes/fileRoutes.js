
const express = require('express');
const { createMultipartUpload, completeMultipartUpload, getUploadedFiles } = require('../controllers/fileController');
const router = express.Router();

router.get('/', getUploadedFiles);
router.post('/create-multipart', createMultipartUpload);
router.post('/complete-multipart', completeMultipartUpload);



module.exports = router;
