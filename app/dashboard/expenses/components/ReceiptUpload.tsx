"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import { useState } from "react";

interface ReceiptUploadProps {
  onUpload: (file: File) => Promise<string>;
  onFileURL?: (url: string) => void;
}

export const ReceiptUpload = ({ onUpload, onFileURL }: ReceiptUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.pdf'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await onUpload(file);
        setPreview(URL.createObjectURL(file));
        onFileURL?.(url);
      } finally {
        setUploading(false);
      }
    },
  });

  const removePreview = () => {
    setPreview(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`backdrop-blur-md bg-white/5 border-2 ${
        isDragActive ? "border-amber-400" : "border-white/20"
      } rounded-xl p-6 text-center cursor-pointer transition-colors ${
        uploading ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full h-40 object-contain rounded-lg"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePreview();
            }}
            className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div>
          <UploadCloud className="w-12 h-12 text-white/50 mx-auto mb-3" />
          <p className="text-white/80 mb-1">
            {isDragActive ? "Drop the receipt here" : "Upload receipt"}
          </p>
          <p className="text-xs text-white/60">
            JPG, PNG, or PDF (Max. 5MB)
          </p>
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};