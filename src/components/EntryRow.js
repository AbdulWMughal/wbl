import React, { useState } from 'react'; 
import FieldInput from './FieldInput';
import FileUpload from './FileUpload';
import { deleteObject, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import '../scss/EntryRow.scss';

export default function EntryRow({ entry, fields, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [updatedValues, setUpdatedValues] = useState(entry.values || {});
  const [photoURL, setPhotoURL] = useState(entry.photoURL || '');
  const [tempURL, setTempURL] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    let finalPhotoURL = photoURL;

    try {
      // If user selected a new photo
      if (selectedFile) {
        setUploading(true);

        // Delete old photo if it exists and is being replaced
        if (photoURL) {
          const oldPhotoRef = ref(storage, photoURL);
          await deleteObject(oldPhotoRef);
        }

        const storageRef = ref(storage, `survey_images/${Date.now()}_${selectedFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(uploadTask.ref);
        setUploading(false);
        setPhotoURL(finalPhotoURL);
      }

      // Update entry with final values and new photo URL (or unchanged one)
      onUpdate(entry.id, updatedValues, finalPhotoURL);
      setEditMode(false);
      setSelectedFile(null);
      setTempURL('');
    } catch (err) {
      console.error('Error during save:', err);
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoURL) return;
    try {
      const photoRef = ref(storage, photoURL);
      await deleteObject(photoRef);
      setPhotoURL('');
      setTempURL('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  return (
    <tr>
      {fields.map(field => (
        <td key={field.id} style={{ padding: 8 }}>
          {editMode ? (
            <FieldInput
              field={field}
              value={updatedValues[field.id] || ''}
              onChange={val =>
                setUpdatedValues(prev => ({ ...prev, [field.id]: val }))
              }
            />
          ) : (
            entry.values?.[field.id] || '—'
          )}
        </td>
      ))}

      <td style={{ padding: 8 }}>
        {editMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(tempURL || photoURL) ? (
              <>
                <img
                  src={tempURL || photoURL}
                  alt="Uploaded"
                  style={{ maxWidth: 100 }}
                />
                <button type="button" onClick={handleDeletePhoto}>
                  Remove Photo
                </button>
              </>
            ) : (
              'No photo'
            )}
            <FileUpload
              onFileSelect={file => setSelectedFile(file)}
              setTempPhotoURL={setTempURL}
            />
          </div>
        ) : (
          entry.photoURL ? (
            <a href={entry.photoURL} target="_blank" rel="noopener noreferrer">View Photo</a>
          ) : '—'
        )}
      </td>

      <td style={{ padding: 8 }}>
        {entry.observer || '—'}
      </td>

      <td style={{ padding: 8 }}>
        {editMode ? (
          <>
            <button onClick={handleSave} disabled={uploading}>
              {uploading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => {
              setEditMode(false);
              setSelectedFile(null);
              setTempURL('');
            }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditMode(true)}>Edit</button>
            <button onClick={() => onDelete(entry.id)} style={{ color: 'red' }}>Delete</button>
          </>
        )}
      </td>
    </tr>
  );
}
