import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntryRow from './EntryRow';
import { storage } from '../firebase';
import { deleteObject, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  deleteObject: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('EntryRow', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  const entry = {
    id: '1',
    values: { field1: 'value1', field2: 'value2' },
    photoURL: '',
    observer: 'John Doe',
  };

  const fields = [
    { id: 'field1', label: 'Field 1' },
    { id: 'field2', label: 'Field 2' },
  ];

  it('should render entry row in view mode', () => {
    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.getByText('value2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should enable edit mode on edit button click', () => {
    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('value1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('value2')).toBeInTheDocument();
  });

  it('should call onUpdate when save button is clicked after edit', async () => {
    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));

    // Change some values
    fireEvent.change(screen.getByDisplayValue('value1'), { target: { value: 'new value' } });
    fireEvent.change(screen.getByDisplayValue('value2'), { target: { value: 'new value 2' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        entry.id,
        { field1: 'new value', field2: 'new value 2' },
        ''
      );
    });
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(mockOnDelete).toHaveBeenCalledWith(entry.id);
  });

  it('should upload a new photo and update photoURL', async () => {
    // Mock the Firebase functions
    const fakeURL = 'https://fakeurl.com/photo.jpg';
    getDownloadURL.mockResolvedValue(fakeURL);

    const fakeFile = new Blob([], { type: 'image/jpeg' });
    const uploadTaskMock = { ref: 'someRef' };
    uploadBytesResumable.mockResolvedValue(uploadTaskMock);

    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));

    // Simulate file selection and upload
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(uploadBytesResumable).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        entry.id,
        { field1: 'value1', field2: 'value2' },
        fakeURL
      );
    });
  });

  it('should delete a photo when remove button is clicked', async () => {
    const mockDelete = jest.fn();
    deleteObject.mockImplementation(mockDelete);

    render(<EntryRow entry={entry} fields={fields} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    // Simulate entering edit mode with a photo
    fireEvent.click(screen.getByText('Edit'));

    fireEvent.click(screen.getByText('Remove Photo'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
