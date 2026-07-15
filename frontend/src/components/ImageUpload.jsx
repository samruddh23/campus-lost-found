import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import './ImageUpload.css';

export default function ImageUpload({ value, onChange, label = 'Upload Image' }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    onChange(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="img-upload">
      {preview ? (
        <div className="img-upload__preview">
          <img src={preview} alt="Preview" />
          <button type="button" className="img-upload__remove" onClick={handleRemove}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`img-upload__zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="img-upload__icon"><ImageIcon size={24} /></div>
          <p className="img-upload__text">{label}</p>
          <p className="img-upload__hint">Drag & drop or <span>click to browse</span></p>
          <p className="img-upload__hint" style={{ fontSize:'0.7rem' }}>JPG, PNG, WebP · max 5MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={e => handleFile(e.target.files[0])}
        style={{ display:'none' }}
      />
    </div>
  );
}
