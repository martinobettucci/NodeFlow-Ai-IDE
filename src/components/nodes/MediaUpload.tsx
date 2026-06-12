import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface MediaUploadProps {
  accept: string; // e.g. "image/*"
  prompt: string; // e.g. "Drop an image or click to upload"
  onContent: (dataUrl: string) => void;
}

// Shared drag & drop / click-to-upload zone converting files to data URLs.
const MediaUpload: React.FC<MediaUploadProps> = ({ accept, prompt, onContent }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const expectedPrefix = accept.split('/')[0];
    if (!file.type.startsWith(`${expectedPrefix}/`)) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onContent(content);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={clsx(
        'nodrag flex flex-col items-center justify-center w-full min-h-[80px] p-3 text-xs',
        'border-2 border-dashed rounded cursor-pointer transition-colors',
        dragActive
          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500',
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      }}
    >
      <Upload className="w-4 h-4 mb-1" />
      <span className="text-center">{prompt}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};

export default MediaUpload;
