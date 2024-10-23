import React, { useState, useEffect, useRef } from 'react';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const MAX_RETRY = 5;
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;

/**
 * Upload component for handling file uploads in chunks with multipart uploads to AWS S3.
 *
 * @param {Object} props - Component properties.
 * @param {Function} props.onUploadComplete - Callback function triggered when the upload is complete.
 */
const Upload = (props) => {
  const [file, setFile] = useState(null); // The file selected for upload
  const [progress, setProgress] = useState(null); // Progress of the upload (percentage)
  const [message, setMessage] = useState(''); // Status message for upload success or failure
  const fileInputRef = useRef(null); // Ref for the file input element to reset it

  /**
   * Utility function to create a delay (used for retrying failed uploads).
   *
   * @param {number} ms - Number of milliseconds to delay.
   * @returns {Promise} A promise that resolves after the specified delay.
   */
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Effect to reset the file input field and clear file state once the upload is complete.
   */
  useEffect(() => {
    if (progress === 100) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the file input field
      }
    }
  }, [progress]);

  /**
   * Handles the file selection change and resets the progress and message states.
   *
   * @param {Object} e - Event object from the file input change.
   */
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Store the selected file
    setProgress(null); // Reset progress state
    setMessage(''); // Reset message state
  };

  /**
   * Uploads a single chunk of the file to a pre-signed URL with retry logic.
   *
   * @param {string} url - The pre-signed URL for uploading the chunk.
   * @param {Blob} chunk - The chunk of the file to be uploaded.
   * @param {Function} onProgress - Callback to track progress and handle the ETag response.
   * @param {number} [retry=1] - The current retry attempt (default is 1).
   * @returns {Promise<void>} - Resolves when the chunk is uploaded, or throws an error if the upload fails.
   */
  const uploadChunkWithFetch = async (url, chunk, onProgress, retry = 1) => {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        body: chunk, // Upload the current chunk
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk: ${response.statusText}`);
      }

      // Capture ETag from the response headers
      const etag = response.headers.get('ETag');
      onProgress(etag); // Pass ETag to the progress handler
    } catch (error) {
      console.error('Error uploading chunk:', error);

      // Retry if the max retry limit is not reached
      if (retry < MAX_RETRY) {
        console.log(`Retrying upload of chunk (retry ${retry})`);
        await delay(retry * 20 * 1000); // Exponential backoff for retries
        await uploadChunkWithFetch(url, chunk, onProgress, retry + 1);
      } else {
        throw error; // Throw error if retries are exhausted
      }
    }
  };

  /**
   * Handles splitting the file into chunks and uploading them sequentially.
   *
   * @param {File} file - The file selected for upload.
   * @returns {Promise<void>} - Resolves when all chunks have been uploaded and the upload is completed.
   */
  const uploadChunks = async (file) => {
    const chunkCount = Math.ceil(file.size / CHUNK_SIZE); // Calculate number of chunks

    const fileName = Date.now() + "_" + file.name; // Generate unique filename with a timestamp

    // Request pre-signed URLs for each chunk from the backend
    const uploadIdResponse = await fetch(API_ENDPOINT + '/files/create-multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileName,
        fileType: file.type,
        chunkCount,
      }),
    });
  
    const { uploadId, preSignedUrls } = await uploadIdResponse.json();
  
    let totalUploadedBytes = 0;
    const parts = []; // Store ETags and PartNumbers for completion
  
    setProgress(0); // Initialize progress
  
    // Upload each chunk sequentially
    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end); // Slice out the current chunk
  
      // Upload the chunk and collect its ETag
      await uploadChunkWithFetch(preSignedUrls[i], chunk, (etag) => {
        parts.push({
          PartNumber: i + 1,  // Store the part number (starting from 1)
          ETag: etag.replace(/"/g, ''), // Clean up ETag quotes if necessary
        });

        totalUploadedBytes += chunk.size; // Track total uploaded bytes
        const percentCompleted = Math.round((totalUploadedBytes / file.size) * 100);
        setProgress(percentCompleted); // Update the upload progress
      });
    }
  
    // Complete the multipart upload by sending the part info to the backend
    await fetch(API_ENDPOINT + '/files/complete-multipart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fileName,
        uploadId,
        parts,  // Send the collected PartNumbers and ETags to complete the upload
        fileSize: file.size
      }),
    });

    // Notify parent component that the upload is complete
    props.onUploadComplete();

    // Set success message
    setMessage('File uploaded successfully!');
  };

  /**
   * Handles the upload process, ensuring a file is selected before starting the upload.
   */
  const handleUpload = async () => {
    if (!file) return; // Do nothing if no file is selected
    try {
      setProgress(0); // Disable upload button
      await uploadChunks(file); // Start the upload
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Failed to upload file'); // Display an error message if upload fails
    }
  };

  return (
    <div>
      <h2>Upload File</h2>
      <input 
        type="file" 
        onChange={handleFileChange} 
        ref={fileInputRef} 
        disabled={progress !== null && progress !== 100} // Disable input during upload
      />
      <button 
        onClick={handleUpload} 
        disabled={progress !== null && progress !== 100} // Disable button during upload
      >
        Upload
      </button>
      <p>{message}</p>
      {progress !== null && <p>Upload Progress: {progress}%</p>}
    </div>
  );
};

export default Upload;
