
# File Sharing Platform

## Overview
This is a scalable file-sharing platform that allows users to upload and download large files using AWS S3 for file storage and MongoDB for storing file metadata. The platform is built with Node.js and Express.js on the backend, and React.js for the frontend. It supports multipart uploads, real-time progress tracking, and secure download links.

## Features
- Multipart upload for large files (several GB)
- Real-time upload progress tracking
- Pre-signed URLs for secure downloads with expiration
- File metadata management using MongoDB
- Retry mechanism for failed uploads
- Scalable architecture with AWS S3

## Prerequisites
- Node.js (version 14.x or later)
- MongoDB (local or hosted)
- AWS account with access to S3
- AWS credentials (Access Key ID, Secret Access Key)
- A `.env` file for managing environment variables

## Installation

### 1. Clone the Repository
```bash
git git@github.com:Pirate0202/FileSharingPlatform.git
cd FileSharingPlatform
```
- or download the zip from repository 
[https://github.com/Pirate0202/FileSharingPlatform.git](https://github.com/Pirate0202/FileSharingPlatform.git)

### 2. Backend Setup

#### 2.1. Navigate to the Backend Directory
```bash
cd backend
```

#### 2.2. Install Dependencies
```bash
npm install
```

#### 2.3. Environment Variables
Create a `.env` file in the `backend` directory and add the following environment variables:

```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_BUCKET_NAME=your-s3-bucket-name
MONGO_URI=mongodb://localhost:27017/your-database-name
PORT=5000
```

#### 2.4. Start the Backend
```bash
npm start
```
This will start the backend server on `http://localhost:5000`.

### 3. Frontend Setup

#### 3.1. Navigate to the Frontend Directory
```bash
cd ../frontend
```

#### 3.2. Install Dependencies
```bash
npm install
```

#### 3.3. Environment Variables
Ensure you create a `.env` file in the `frontend` directory if necessary, depending on your configuration.

#### 3.4. Start the Frontend
```bash
npm start
```
This will start the React development server on `http://localhost:3000`.

#### 3.5 CORS configuration
If you are getting a CORS error from a frontend network request, add the following array to the S3 CORS configuration.
```bash
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

## Usage

1. **Uploading Files**: Select a file from the frontend UI, and the file will be uploaded to AWS S3 in chunks with real-time progress tracking.
2. **Downloading Files**: After upload, files can be downloaded using pre-signed URLs with an expiration time of 3 hours.
3. **Managing Files**: File metadata (e.g., file name, size, upload date) is stored in MongoDB and can be accessed through the backend API.

## API Endpoints

- `POST /api/files/create-multipart` – Create a multipart upload and generate pre-signed URLs.
- `POST /api/files/complete-multipart` – Complete the multipart upload and save metadata to MongoDB.
- `GET /api/files` – Fetch the list of uploaded files from MongoDB.

## Notes

- Ensure that your AWS credentials are properly configured in the `.env` file.
- MongoDB must be running locally or connected to a cloud-hosted instance.

