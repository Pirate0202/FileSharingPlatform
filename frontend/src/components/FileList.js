import React, { useEffect, useState } from 'react';
import Upload from './Upload';
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;


/**
 * FileList component fetches and displays a list of uploaded files from the server.
 * It also handles the file upload and triggers a re-fetch after an upload is completed.
 */
const FileList = () => {
  const [files, setFiles] = useState([]); // State to store the list of uploaded files
  const [loading, setLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to track any errors during the fetch

  /**
   * Fetches the list of uploaded files from the backend.
   *
   * @returns {Promise<void>} - Resolves when the file list is successfully fetched.
   */
  const fetchFiles = async () => {
    try {
      const response = await fetch(API_ENDPOINT + '/files'); // Request files from the backend
      if (!response.ok) {
        throw new Error('Failed to fetch files'); // Throw an error if the request fails
      }
      const data = await response.json(); // Parse the response data
      setFiles(data); // Set the file data in state
      setLoading(false); // Update loading state
    } catch (err) {
      setError(err.message); // Set the error message in case of failure
      setLoading(false); // Update loading state
    }
  };

  /**
   * useEffect hook to fetch the file list when the component mounts.
   */
  useEffect(() => {
    fetchFiles(); // Fetch the file list when the component is mounted
  }, []);

  /**
   * Callback function that is passed to the Upload component and triggered when an upload is completed.
   * It re-fetches the file list to include the newly uploaded file.
   */
  const handleUploadComplete = () => {
    fetchFiles();  // Re-fetch the files after an upload is completed
  };

  // Return loading or error messages if applicable
  if (loading) return <p>Loading files...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {/* Render the Upload component and pass the handleUploadComplete callback */}
      <Upload onUploadComplete={handleUploadComplete} />
      <h2>Uploaded Files</h2>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>  // Display message if no files are uploaded
      ) : (
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Size (MB)</th>
              <th>Uploaded Date</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {/* Map through the files array and render a row for each file */}
            {files.map((file) => (
              <tr key={file._id}>
                <td>{file.file_name}</td>
                <td>{(file.file_size / (1024 * 1024)).toFixed(2)}</td>
                <td>{new Date(file.uploadDate).toLocaleString()}</td>
                <td>
                  <a href={file.downloadUrl} disabled={true} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FileList;
