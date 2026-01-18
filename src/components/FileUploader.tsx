import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Video } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = {
    "image/*": [],
    "video/*": [],
  },
  maxSize = 100 * 1024 * 1024,
  multiple = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      multiple,
    });

  const borderColor = isDragActive
    ? "border-primary"
    : isDragReject
      ? "border-destructive"
      : "border-border";

  const bgColor = isDragActive ? "bg-primary/10" : "bg-transparent";

  return (
    <div
      {...getRootProps()}
      className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed ${borderColor} ${bgColor} rounded-xl transition-colors cursor-pointer p-8`}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex gap-4 mb-2">
          <ImageIcon size={40} className="text-foreground opacity-80" />
          <Video size={40} className="text-foreground opacity-80" />
        </div>

        {isDragActive ? (
          <p className="text-xl font-medium text-primary">Drop files here</p>
        ) : isDragReject ? (
          <p className="text-xl font-medium text-destructive">
            File not supported
          </p>
        ) : (
          <>
            <p className="text-xl font-light text-foreground">
              Drag photos or videos here
            </p>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors mt-4">
              Select
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
