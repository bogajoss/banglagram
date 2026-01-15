import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
// import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    Type,
    Smile,
    Crop,
    Scissors,
    Check,
    X,
    Trash2,
} from "lucide-react";
import OverlayLayer, { type OverlayItem } from "./OverlayLayer";
import getCroppedImg from "./utils/canvasUtils";
import { toBlob } from "html-to-image";
import EmojiPicker, { Theme } from "emoji-picker-react";

interface MediaEditorProps {
    file: File;
    onSave: (editedFile: File) => void;
    onCancel: () => void;
}

const COLORS = ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];

const MediaEditor: React.FC<MediaEditorProps> = ({ file, onSave, onCancel }) => {
    const [mode, setMode] = useState<"crop" | "edit">("edit");
    const isVideo = file.type.startsWith("video/");
    const [currentPreview, setCurrentPreview] = useState<string>("");
    const urlsRef = useRef<string[]>([]);

    React.useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCurrentPreview(url);
        urlsRef.current.push(url);

        return () => {
            urlsRef.current.forEach(u => URL.revokeObjectURL(u));
            urlsRef.current = [];
        };
    }, [file]);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Overlay State
    const [overlays, setOverlays] = useState<OverlayItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tools State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState("#FFFFFF");

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApplyCrop = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(currentPreview, croppedAreaPixels);
            if (croppedBlob) {
                const newUrl = URL.createObjectURL(croppedBlob);
                urlsRef.current.push(newUrl);

                setCurrentPreview(newUrl);
                setMode("edit");
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            }
        } catch (e) {
            console.error("Crop save failed", e);
        }
    };

    const handleAddText = () => {
        const newId = `text-${Date.now()}`;
        setOverlays((prev) => [
            ...prev,
            {
                id: newId,
                type: "text",
                content: "Tap to Edit",
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                color: currentColor,
                fontSize: 32,
            },
        ]);
        setActiveId(newId);
    };

    const handleAddEmoji = (emojiData: any) => {
        const newId = `emoji-${Date.now()}`;
        setOverlays((prev) => [
            ...prev,
            {
                id: newId,
                type: "emoji",
                content: emojiData.emoji,
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
            },
        ]);
        setActiveId(newId);
        setShowEmojiPicker(false);
    };

    const handleDeleteActive = () => {
        if (activeId) {
            setOverlays((prev) => prev.filter((o) => o.id !== activeId));
            setActiveId(null);
        }
    };

    const activeOverlay = overlays.find((o) => o.id === activeId);

    const handleSave = async () => {
        try {
            if (isVideo) {
                // Video Export Logic (Pass through for now, as we agreed on easy path first)
                // In a full implementation, we would burn overlays here or pass metadata.
                // For now, we just pass the original file back.
                // TODO: Implement FFmpeg trim if needed via the separate trim UI.
                onSave(file);
                return;
            }

            // Image Export Logic
            // 1. If we cropped, apply crop first
            // 2. Capture the current view
            if (!containerRef.current) return;

            // Ensure we are in edit mode etc for clean capture
            setMode("edit");
            setActiveId(null);

            // Wait for UI to settle (mode switch + handles hide)
            await new Promise(r => setTimeout(r, 150));

            const blob = await toBlob(containerRef.current, {
                cacheBust: false,
                includeQueryParams: false, // Extra safety for blob URLs
                quality: 1,
                pixelRatio: 2,
            });

            if (blob) {
                const newFile = new File([blob], "edited_image.png", { type: "image/png" });
                onSave(newFile);
            }

        } catch (e) {
            console.error("Failed to save media", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 bg-zinc-900 border-b border-zinc-800">
                <Button variant="ghost" className="text-white" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <span className="text-white font-semibold">Edit Media</span>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Check className="mr-2 h-4 w-4" /> Done
                </Button>
            </div>

            {/* Main Canvas Area */}
            <div
                className="flex-grow relative overflow-hidden flex items-center justify-center bg-[#1a1a1a] p-4"
                onClick={() => setActiveId(null)}
            >
                {mode === "crop" && !isVideo ? (
                    <div className="relative w-full h-full">
                        <Cropper
                            image={currentPreview}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 5}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                        <Button
                            className="absolute bottom-4 right-4 z-50 bg-blue-600"
                            onClick={handleApplyCrop}
                        >
                            ক্রপ করুন
                        </Button>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl bg-black inline-flex"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto'
                        }}
                    >
                        {isVideo ? (
                            currentPreview && <video src={currentPreview} className="max-w-full max-h-full block object-contain" loop autoPlay muted />
                        ) : (
                            currentPreview && <img
                                src={currentPreview}
                                className="max-w-full max-h-full block object-contain pointer-events-none"
                                alt="editing bg"
                            />
                        )}

                        {/* Overlays */}
                        <OverlayLayer
                            overlays={overlays}
                            setOverlays={setOverlays}
                            activeId={activeId}
                            setActiveId={setActiveId}
                            containerRef={containerRef}
                        />
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-zinc-900 border-t border-zinc-800 p-4">

                {/* If Active Item: Show Item Specific Tools */}
                {activeId && activeOverlay?.type === "text" && (
                    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                        {COLORS.map(c => (
                            <div
                                key={c}
                                className={`w-8 h-8 rounded-full cursor-pointer border-2 ${currentColor === c ? 'border-white' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => {
                                    setCurrentColor(c);
                                    setOverlays(prev => prev.map(o => o.id === activeId ? { ...o, color: c } : o));
                                }}
                            />
                        ))}
                        <Button variant="destructive" size="icon" onClick={handleDeleteActive}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                )}

                {/* Main Tools Container */}
                <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setShowEmojiPicker(true)}>
                        <div className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700">
                            <Smile className="text-white h-6 w-6" />
                        </div>
                        <span className="text-xs text-zinc-400">Emoji</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={handleAddText}>
                        <div className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700">
                            <Type className="text-white h-6 w-6" />
                        </div>
                        <span className="text-xs text-zinc-400">Text</span>
                    </div>

                    {!isVideo && (
                        <div
                            className={`flex flex-col items-center gap-1 cursor-pointer ${mode === 'crop' ? 'opacity-100' : 'opacity-70'}`}
                            onClick={() => setMode(mode === 'crop' ? 'edit' : 'crop')}
                        >
                            <div className={`p-3 bg-zinc-800 rounded-full hover:bg-zinc-700 ${mode === 'crop' ? 'bg-blue-600' : ''}`}>
                                <Crop className="text-white h-6 w-6" />
                            </div>
                            <span className="text-xs text-zinc-400">Crop</span>
                        </div>
                    )}

                    {isVideo && (
                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                            <div className="p-3 bg-zinc-800 rounded-full hover:bg-zinc-700">
                                <Scissors className="text-white h-6 w-6" />
                            </div>
                            <span className="text-xs text-zinc-400">Trim</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Popups */}
            {showEmojiPicker && (
                <div className="absolute bottom-20 left-0 right-0 z-[1010] flex justify-center">
                    <div className="relative">
                        <Button
                            size="sm"
                            className="absolute -top-10 right-0 z-10 rounded-full"
                            variant="secondary"
                            onClick={() => setShowEmojiPicker(false)}
                        >
                            <X size={16} />
                        </Button>
                        <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={handleAddEmoji}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaEditor;
