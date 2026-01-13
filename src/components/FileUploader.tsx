import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Video } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({
    onFileSelect,
    accept = {
        "image/*": [],
        "video/*": [],
    },
    maxSize = 100 * 1024 * 1024,
}) => {
    const { theme } = useAppStore();

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles && acceptedFiles.length > 0) {
                onFileSelect(acceptedFiles[0]);
            }
        },
        [onFileSelect],
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } =
        useDropzone({
            onDrop,
            accept,
            maxSize,
            multiple: false,
        });

    const borderColor = isDragActive
        ? "border-[#0095f6]"
        : isDragReject
            ? "border-red-500"
            : theme === "dark"
                ? "border-zinc-700"
                : "border-zinc-300";

    const bgColor = isDragActive ? "bg-blue-500/10" : "bg-transparent";

    return (
        <div
            {...getRootProps()}
            className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed ${borderColor} ${bgColor} rounded-xl transition-colors cursor-pointer p-8`}
        >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex gap-4 mb-2">
                    <ImageIcon
                        size={40}
                        className={`${theme === "dark" ? "text-white" : "text-black"} opacity-80`}
                    />
                    <Video
                        size={40}
                        className={`${theme === "dark" ? "text-white" : "text-black"} opacity-80`}
                    />
                </div>

                {isDragActive ? (
                    <p className="text-xl font-medium text-[#0095f6]">
                        ফাইলগুলি এখানে ছাড়ুন
                    </p>
                ) : isDragReject ? (
                    <p className="text-xl font-medium text-red-500">
                        এই ফাইলটি সাপোর্ট করছে না
                    </p>
                ) : (
                    <>
                        <p
                            className={`text-xl font-light ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                            ফটো বা ভিডিও এখানে টেনে আনুন
                        </p>
                        <button className="bg-[#0095f6] hover:bg-[#1877f2] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors mt-4">
                            নির্বাচন করুন
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
