import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import '../scss/FileUpload.scss'
export default function FileUpload({ onUpload, onFileSelect, setTempPhotoURL }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (typeof onFileSelect === 'function') {
      onFileSelect(selectedFile);
    }

    if (typeof setTempPhotoURL === 'function') {
      setTempPhotoURL(URL.createObjectURL(selectedFile));
    }

    // Only trigger immediate upload if onUpload is defined and onFileSelect is not.
    if (typeof onUpload === 'function' && typeof onFileSelect !== 'function') {
      uploadFile(selectedFile);
    }
  };

  const uploadFile = (selectedFile) => {
    setUploading(true);
    const storageRef = ref(storage, `survey_images/${Date.now()}_${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(percent);
      },
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        setProgress(0);
        setFile(null);
        onUpload?.(downloadURL);
      }
    );
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && (
        <div style={{ marginTop: 4 }}>
          Uploading... {Math.round(progress)}%
        </div>
      )}
      {file && !uploading && !onUpload && (
        <div style={{ marginTop: 8 }}>
          <strong>Selected file:</strong> {file.name}
        </div>
      )}
    </div>
  );
}
