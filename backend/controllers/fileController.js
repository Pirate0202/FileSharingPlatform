const AWS = require('aws-sdk');
const File = require('../models/fileModel');  

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const EXPIRATION_HOURS = 60 * 60 * 24; // 24 hours for URL expiration

/**
 * Creates a multipart upload and returns pre-signed URLs for each chunk.
 *
 * @param {Object} req - Express request object, containing fileName, fileType, and chunkCount in the body.
 * @param {Object} res - Express response object to send the uploadId and pre-signed URLs.
 */
exports.createMultipartUpload = async (req, res) => {
    const { fileName, fileType, chunkCount } = req.body;

    // Initialize multipart upload parameters
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
    };

    // Start the multipart upload in S3
    const multipartUpload = await s3.createMultipartUpload({ ...params, ContentType: fileType }).promise();
    const { UploadId } = multipartUpload;

    try {
        const urls = [];
        // Generate pre-signed URLs for each chunk
        for (let i = 0; i < chunkCount; i++) {
            const signedUrl = await s3.getSignedUrlPromise('uploadPart', {
                ...params,
                UploadId,
                Expires: EXPIRATION_HOURS,  // URL expiration set to 3 hours
                PartNumber: i + 1,  // Part number starts from 1
            });
            urls.push(signedUrl);  // Collect pre-signed URLs
        }

        // Send pre-signed URLs and uploadId to the frontend
        res.json({
            uploadId: UploadId,
            preSignedUrls: urls,
        });
    } catch (err) {
        console.log("Error in createMultipartUpload", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Completes the multipart upload by passing the parts array to S3 and saves file metadata in MongoDB.
 *
 * @param {Object} req - Express request object, containing fileName, uploadId, parts array, and fileSize in the body.
 * @param {Object} res - Express response object to send a success message and download URL.
 */
exports.completeMultipartUpload = async (req, res) => {
    const { fileName, uploadId, parts, fileSize } = req.body;  // Accept 'parts' array from frontend

    // Parameters to complete the multipart upload
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts,  // Pass 'parts' array (PartNumber and ETag) to complete multipart upload
        },
    };

    try {
        // Complete the multipart upload
        const result = await s3.completeMultipartUpload(params).promise();

        // Generate a pre-signed URL for downloading the completed file
        const downloadUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Expires: EXPIRATION_HOURS,  // URL expiration set to 3 hours
        });

        // Save the file metadata in MongoDB
        const newFile = new File({
            file_name: fileName,
            file_size: fileSize,
            s3Key: fileName,  // The file's key in the S3 bucket
        });
        await newFile.save();

        // Respond with a success message and the download URL
        res.json({ message: 'File uploaded successfully!', downloadUrl });
    } catch (err) {
        console.error('Error completing multipart upload:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Fetches the list of uploaded files from MongoDB and generates fresh pre-signed download URLs for each file.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send the list of files with pre-signed download URLs.
 */
exports.getUploadedFiles = async (req, res) => {
    try {
        // Retrieve the list of files from MongoDB, sorted by upload date (most recent first)
        const files = await File.find().sort({ uploadDate: -1 });

        // Map through each file and generate a fresh pre-signed download URL
        const filesWithDownloadUrls = files.map(file => {
            const downloadUrl = s3.getSignedUrl('getObject', {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: file.s3Key,  // Use the S3 key stored in the database
                Expires: EXPIRATION_HOURS,  
            });

            return {
                ...file._doc,  // Return the plain object from Mongoose
                downloadUrl   // Include the fresh pre-signed URL
            };
        });

        // Send the file list along with the new download URLs
        res.json(filesWithDownloadUrls);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve files' });
    }
};
