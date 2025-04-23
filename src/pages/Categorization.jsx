import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ArrowLeft } from 'lucide-react';
import FieldInput from '../components/FieldInput';
import EntryRow from '../components/EntryRow';
import FileUpload from '../components/FileUpload';
import { AuthContext } from '../context API/AuthContext';
import { deleteObject, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage functions
import { storage } from '../firebase'; 
import '../scss/catagorization.scss';


export default function Categorization() {
  const [fields, setFields] = useState([]);
  const [entries, setEntries] = useState([]);
  const [newValues, setNewValues] = useState({});
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [error, setError] = useState('');
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [tempPhotoURL, setTempPhotoURL] = useState(''); // Temporary state for previewing changes
  const [photoFile, setPhotoFile] = useState(null); // Temporary file to hold the image before uploading

  const [showCustomize, setShowCustomize] = useState(true);
  const [showAddSighting, setShowAddSighting] = useState(true);

  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext); // Access currentUser from AuthContext

  const fieldsRef = useMemo(() => collection(db, 'surveyFields'), []);
  const entriesRef = useMemo(() => collection(db, 'surveyEntries'), []);

  useEffect(() => {
    const q = query(fieldsRef, orderBy('order'));
    return onSnapshot(q, snap =>
      setFields(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [fieldsRef]);

  useEffect(() => {
    const q = query(entriesRef, orderBy('timestamp', 'desc'));
    if (liveUpdate) {
      const unsubscribe = onSnapshot(q, snap => {
        const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEntries(allDocs);
      });
      return () => unsubscribe();
    } else {
      (async () => {
        try {
          const snap = await getDocs(q);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setEntries(docs);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch entries.');
        }
      })();
    }
  }, [entriesRef, liveUpdate]);

  const addField = async () => {
    setError('');
    if (!fieldLabel.trim()) return setError('Field label is required.');
    if (fields.find(f => f.label.toLowerCase() === fieldLabel.trim().toLowerCase())) {
      return setError('Field with this label already exists.');
    }
    if (fieldType === 'select' && !fieldOptions.trim()) {
      return setError('Options are required for select fields.');
    }

    try {
      await addDoc(fieldsRef, {
        label: fieldLabel.trim(),
        type: fieldType,
        options:
          fieldType === 'select'
            ? fieldOptions.split(',').map(o => o.trim()).filter(Boolean)
            : [],
        order: fields.length > 0 ? fields[fields.length - 1].order + 1 : 0,
      });

      setFieldLabel('');
      setFieldType('text');
      setFieldOptions('');
    } catch (err) {
      console.error(err);
      setError('Failed to add field. Please try again.');
    }
  };

  const addEntry = async e => {
    e.preventDefault();
    setError('');
  
    const missingFields = fields.filter(
      f => !newValues[f.id] || newValues[f.id].toString().trim() === ''
    );
    if (missingFields.length > 0) {
      return setError(`Please fill in all fields: ${missingFields.map(f => f.label).join(', ')}`);
    }

    try {
      // If there's a photo file, upload it to Firebase Storage
      let uploadedPhotoURL = null;
      if (photoFile) {
        const storageRef = ref(storage, `survey_images/${Date.now()}_${photoFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, photoFile);
        uploadedPhotoURL = await getDownloadURL(uploadTask.ref);
      }

      await addDoc(entriesRef, {
        values: newValues,
        photoURL: uploadedPhotoURL || null,  // Use the uploaded URL or null
        observer: currentUser?.displayName || currentUser?.email || 'Unknown', // Use currentUser here
        timestamp: Timestamp.now(),
      });
      setNewValues({});
      setPhotoFile(null); // Clear photo file after submission
      setTempPhotoURL(''); // Clear temporary photo state
    } catch (err) {
      console.error(err);
      setError('Failed to submit sighting.');
    }
  };

  const updateEntry = async (entryId, updatedValues, updatedPhotoURL) => {
    try {
      await updateDoc(doc(entriesRef, entryId), {
        values: updatedValues,
        photoURL: updatedPhotoURL,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update entry.');
    }
  };

  const deleteEntry = async entryId => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      // If the entry has a photo, delete it from storage
      const entry = entries.find(entry => entry.id === entryId);
      if (entry?.photoURL) {
        const photoRef = ref(storage, entry.photoURL);
        await deleteObject(photoRef);
      }

      await deleteDoc(doc(entriesRef, entryId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete entry.');
    }
  };

  const deleteField = async fieldId => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;

    try {
      await deleteDoc(doc(fieldsRef, fieldId));
      const updatedFields = fields.filter(field => field.id !== fieldId);
      await Promise.all(
        updatedFields.map((field, index) =>
          updateDoc(doc(fieldsRef, field.id), { order: index })
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to delete column.');
    }
  };

  const manualRefresh = async () => {
    try {
      const [fSnap, eSnap] = await Promise.all([
        getDocs(query(fieldsRef, orderBy('order'))),
        getDocs(query(entriesRef, orderBy('timestamp', 'desc'))),
      ]);
      setFields(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEntries(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setError('Failed to refresh data.');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mb-4"
      >
        <ArrowLeft size={20} />
        <span></span>
      </button>

      <h2>Pond Wildlife Survey</h2>

      {error && <div style={{ background: '#fdd', padding: 10 }}>{error}</div>}

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={liveUpdate}
            onChange={() => setLiveUpdate(prev => !prev)}
          />
          Live Updates
        </label>
      </div>

      <section style={{ marginBottom: 40 }}>
  <h3 onClick={() => setShowCustomize(prev => !prev)} style={{ cursor: 'pointer' }}>
    {showCustomize ? '▼' : '▶'} Customize Columns
  </h3>

  {showCustomize && (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          placeholder="Label (e.g. Species)"
          value={fieldLabel}
          onChange={e => setFieldLabel(e.target.value)}
        />
        <select value={fieldType} onChange={e => setFieldType(e.target.value)}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="select">Select</option>
        </select>
        {fieldType === 'select' && (
          <input
            placeholder="Options, comma-separated"
            value={fieldOptions}
            onChange={e => setFieldOptions(e.target.value)}
          />
        )}
        <button onClick={addField}>Add Column</button>
      </div>
      <div style={{ marginTop: 20 }}>
        {fields.map(field => (
          <div key={field.id} style={{ marginBottom: 10 }}>
            <span>{field.label}</span>
            <button style={{ marginLeft: 10, color: 'red' }} onClick={() => deleteField(field.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </>
  )}
</section>

<section style={{ marginBottom: 40 }}>
  <h3 onClick={() => setShowAddSighting(prev => !prev)} style={{ cursor: 'pointer' }}>
    {showAddSighting ? '▼' : '▶'} Add New Sighting
  </h3>

  {showAddSighting && (
    <form onSubmit={addEntry} style={{ display: 'grid', gap: 10 }}>
      {fields.map(fld => (
        <FieldInput
          key={fld.id}
          field={fld}
          value={newValues[fld.id] || ''}
          onChange={val => setNewValues(vs => ({ ...vs, [fld.id]: val }))}
        />
      ))}
      <FileUpload
        onFileSelect={setPhotoFile}
        setTempPhotoURL={setTempPhotoURL}
      />

      {tempPhotoURL && (
        <div style={{ marginBottom: 10 }}>
          <strong>Uploaded Image Preview:</strong><br />
          <img src={tempPhotoURL} alt="Uploaded" style={{ maxWidth: 200 }} />
        </div>
      )}
      <button type="submit">Submit Sighting</button>
    </form>
  )}
</section>

      <button onClick={manualRefresh}>Manual Refresh</button>

      <section style={{ marginTop: 40 }}>
        <h3>Sightings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {fields.map(f => (
                <th key={f.id} style={{ textAlign: 'left', padding: 8 }}>{f.label}</th>
              ))}
              <th>Photo</th>
              <th>Observer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <EntryRow
                key={entry.id}
                entry={entry}
                fields={fields}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
