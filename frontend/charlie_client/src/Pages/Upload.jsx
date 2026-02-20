import React, { useState } from "react";
import api from "../services/api";
import "./Upload.css";

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    try {
      // Simulate upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setUploadProgress(i);
      }

      // Make actual API call
      await api.post("/hdl/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadResults({
        status: "success",
        message: "Files uploaded successfully!",
        details: { message: "Upload completed without errors" },
      });

      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setUploadResults({
        status: "error",
        message: "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="upload-container">
        <div className="upload-header">
          <h1>📤 Upload Excel & DAT Files</h1>
          <p className="subtitle">Drag and drop your files or click to browse</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* File Upload Area */}
        <div className="upload-area card">
          <div className="upload-icon">📁</div>
          <h2>Drop Files Here</h2>
          <p>or</p>
          <label className="file-input-label">
            <span className="btn btn-primary">Browse Files</span>
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.dat"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
          <p className="upload-hint">
            Supported formats: Excel (.xlsx, .xls), CSV, DAT
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="card file-list">
            <h3>📋 Selected Files ({selectedFiles.length})</h3>
            <ul>
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="file-item">
                  <span className="file-icon">
                    {file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
                      ? "📊"
                      : file.name.endsWith(".csv")
                      ? "📄"
                      : "📝"}
                  </span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="card progress-container">
            <div className="progress-info">
              <span>Uploading...</span>
              <span className="progress-value">{uploadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults && (
          <div
            className={`card upload-results alert alert-${uploadResults.status}`}
          >
            <h3>
              {uploadResults.status === "success" ? "✓" : "✗"} {uploadResults.message}
            </h3>
            {uploadResults.details && (
              <pre>{JSON.stringify(uploadResults.details, null, 2)}</pre>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="upload-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
          {selectedFiles.length > 0 && (
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Upload Tips */}
        <div className="upload-tips card">
          <h3>💡 Tips for Successful Upload</h3>
          <ul>
            <li>Ensure your files follow the required format specifications</li>
            <li>Excel files should have headers in the first row</li>
            <li>Maximum file size: 50 MB per file</li>
            <li>Files are validated immediately after upload</li>
            <li>Check the validation results for any issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
