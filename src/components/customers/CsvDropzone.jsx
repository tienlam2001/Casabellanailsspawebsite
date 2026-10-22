import { useRef, useState } from 'react';

const CsvDropzone = ({ file, onFileSelected, disabled }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  };

  const onBrowse = (event) => {
    const chosen = event.target.files?.[0];
    if (chosen) onFileSelected(chosen);
    event.target.value = '';
  };

  return (
    <div
      className={`cdb-dropzone ${isDragOver ? 'cdb-dropzone-active' : ''} ${disabled ? 'cdb-dropzone-disabled' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onBrowse}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      {file ? (
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>{file.name}</p>
          <p className="muted" style={{ margin: '0.3rem 0 0' }}>
            {(file.size / 1024).toFixed(1)} KB — click or drop to replace
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>Drag & drop a CSV file here</p>
          <p className="muted" style={{ margin: '0.3rem 0 0' }}>or click to choose a file from your computer</p>
        </div>
      )}
    </div>
  );
};

export default CsvDropzone;
