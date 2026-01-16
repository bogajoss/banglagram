import React, { useState, useRef, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
    Type,
    Smile,
    Crop,
    Scissors,
    X,
    Trash2,
    Square,
    Smartphone,
    Monitor,
    Image as ImageIcon,
    Baseline,
    ChevronRight
} from "lucide-react";
import OverlayLayer, { type OverlayItem } from "./OverlayLayer";
import getCroppedImg from "./utils/canvasUtils";
import { toBlob } from "html-to-image";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MediaEditorProps {
    file: File;
    onSave: (editedFile: File) => void;
    onCancel: () => void;
}

const COLORS = ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#FFA500", "#800080", "#008080"];
const FONTS = [
    { name: "Classic", family: "sans-serif" },
    { name: "Serif", family: "serif" },
    { name: "Mono", family: "monospace" },
    { name: "Rounded", family: "ui-rounded, system-ui, sans-serif" },
    { name: "Cursive", family: "cursive" }
];

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
    const [aspectRatio, setAspectRatio] = useState<number>(4 / 5);
    const [originalAspect, setOriginalAspect] = useState<number>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Overlay State
    const [overlays, setOverlays] = useState<OverlayItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tools State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState("#FFFFFF");
    const [currentFontFamily, setCurrentFontFamily] = useState(FONTS[0].family);
    const [isEditingText, setIsEditingText] = useState(false);
    const [textToEdit, setTextToEdit] = useState("");
    const [textBackground, setTextBackground] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onMediaLoaded = (mediaSize: { width: number; height: number }) => {
        setOriginalAspect(mediaSize.width / mediaSize.height);
    };

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
        let initialX = 0;
        let initialY = 0;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            initialX = rect.width / 2;
            initialY = rect.height / 2;
        }
        
        // Start editing immediately
        setCurrentColor("#FFFFFF");
        setCurrentFontFamily(FONTS[0].family);
        setTextBackground(false);
        setTextToEdit("");
        
        const newItem: OverlayItem = {
            id: newId,
            type: "text",
            content: "", // Empty initially, will be filled by modal
            x: initialX,
            y: initialY,
            scale: 1,
            rotation: 0,
            color: "#FFFFFF",
            fontSize: 32,
            fontFamily: FONTS[0].family,
            background: false
        };

        setOverlays((prev) => [...prev, newItem]);
        setActiveId(newId);
        setIsEditingText(true);
    };

    const handleAddEmoji = (emojiData: EmojiClickData) => {
        const newId = `emoji-${Date.now()}`;
        let initialX = 0;
        let initialY = 0;
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            initialX = rect.width / 2;
            initialY = rect.height / 2;
        }

        setOverlays((prev) => [
            ...prev,
            {
                id: newId,
                type: "emoji",
                content: emojiData.emoji,
                x: initialX,
                y: initialY,
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

    const handleStartTextEdit = () => {
        if (activeId) {
            const item = overlays.find((o) => o.id === activeId);
            if (item && item.type === 'text') {
                setTextToEdit(item.content);
                setCurrentColor(item.color || "#FFFFFF");
                setCurrentFontFamily(item.fontFamily || FONTS[0].family);
                setTextBackground(!!item.background);
                setIsEditingText(true);
            }
        }
    };

    const handleTextEditComplete = () => {
        if (activeId) {
            if (!textToEdit.trim()) {
                // Remove if empty
                setOverlays(prev => prev.filter(o => o.id !== activeId));
                setActiveId(null);
            } else {
                setOverlays((prev) =>
                    prev.map((o) => (o.id === activeId ? { 
                        ...o, 
                        content: textToEdit,
                        color: currentColor,
                        fontFamily: currentFontFamily,
                        background: textBackground
                    } : o))
                );
            }
        }
        setIsEditingText(false);
        setTextToEdit("");
    };

    const handleSave = async () => {
        try {
            if (isVideo) {
                onSave(file);
                return;
            }

            if (!containerRef.current) return;

            setMode("edit");
            setActiveId(null);

            await new Promise(r => setTimeout(r, 150));

            const blob = await toBlob(containerRef.current, {
                cacheBust: false,
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
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden">
            
            {/* Top Toolbar (Floating) */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
                 {/* Cancel Button */}
                <div className="pointer-events-auto">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                        onClick={onCancel}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Right Side Tools */}
                <div className="pointer-events-auto flex gap-4">
                     {/* Tools Stack */}
                    <div className="flex gap-2 bg-black/40 backdrop-blur-sm rounded-full p-2">
                         {!activeId && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                                    onClick={handleAddText}
                                >
                                    <Type className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 rounded-full h-10 w-10"
                                    onClick={() => setShowEmojiPicker(true)}
                                >
                                    <Smile className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("text-white hover:bg-white/20 rounded-full h-10 w-10", mode === 'crop' && "bg-white/20 text-blue-400")}
                                    onClick={() => setMode(mode === 'crop' ? 'edit' : 'crop')}
                                >
                                    {isVideo ? <Scissors className="h-5 w-5" /> : <Crop className="h-5 w-5" />}
                                </Button>
                            </>
                         )}
                         {activeId && (
                             <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-500/20 rounded-full h-10 w-10"
                                onClick={handleDeleteActive}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                         )}
                    </div>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div
                className="w-full h-full relative flex items-center justify-center bg-[#1a1a1a]"
                onClick={() => setActiveId(null)}
            >
                 {mode === "crop" && !isVideo ? (
                    <div className="relative w-full h-full max-w-lg mx-auto bg-black">
                         {/* Crop Controls Overlay */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-white/20 m-4 rounded-xl"></div>
                        
                        <Cropper
                            image={currentPreview}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            onMediaLoaded={onMediaLoaded}
                            classes={{ containerClassName: "bg-black" }}
                        />
                        
                        {/* Crop Actions Footer */}
                        <div className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 px-4">
                             <div className="flex gap-4 bg-black/60 backdrop-blur-md p-2 rounded-full">
                                <Button size="sm" variant="ghost" onClick={() => setAspectRatio(1)} className={cn("rounded-full h-8 w-8 p-0", aspectRatio === 1 ? "bg-white text-black" : "text-white")}>
                                    <Square size={14} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAspectRatio(4 / 5)} className={cn("rounded-full h-8 w-8 p-0", aspectRatio === 4/5 ? "bg-white text-black" : "text-white")}>
                                    <Smartphone size={14} />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAspectRatio(16 / 9)} className={cn("rounded-full h-8 w-8 p-0", aspectRatio === 16/9 ? "bg-white text-black" : "text-white")}>
                                    <Monitor size={14} />
                                </Button>
                                 <Button size="sm" variant="ghost" onClick={() => setAspectRatio(originalAspect)} className={cn("rounded-full h-8 w-8 p-0", aspectRatio === originalAspect ? "bg-white text-black" : "text-white")}>
                                    <ImageIcon size={14} />
                                </Button>
                             </div>
                             
                             <Button onClick={handleApplyCrop} className="w-full max-w-[200px] rounded-full bg-white text-black hover:bg-white/90 font-bold">
                                 Apply
                             </Button>
                        </div>
                    </div>
                 ) : (
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl bg-black inline-flex overflow-hidden"
                         style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            aspectRatio: isVideo ? undefined : `${originalAspect}`,
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

                        <OverlayLayer
                            overlays={overlays}
                            setOverlays={setOverlays}
                            activeId={activeId}
                            setActiveId={setActiveId}
                            containerRef={containerRef}
                            onEditText={handleStartTextEdit}
                        />
                        
                        {/* Gradient Overlays for better visibility of controls */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    </div>
                 )}
            </div>

            {/* Bottom Done Button (Floating) */}
             {mode !== 'crop' && (
                <div className="absolute bottom-6 right-6 z-50">
                    <Button 
                        onClick={handleSave} 
                        className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold shadow-lg"
                    >
                        Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            )}


            {/* Full Screen Text Editor */}
            {isEditingText && (
                <div className="fixed inset-0 z-[1050] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4">
                        <Button variant="ghost" className="text-white" onClick={() => setIsEditingText(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-white text-black hover:bg-gray-200 rounded-full px-6" 
                            onClick={handleTextEditComplete}
                        >
                            Done
                        </Button>
                    </div>

                    {/* Editor Canvas */}
                    <div className="flex-grow flex items-center justify-center p-4 relative">
                        <Textarea
                            autoFocus
                            value={textToEdit}
                            onChange={(e) => setTextToEdit(e.target.value)}
                            className="bg-transparent border-none text-center text-3xl font-bold text-white resize-none focus-visible:ring-0 min-h-[150px] w-full max-w-lg mx-auto shadow-none placeholder:text-white/30"
                            placeholder="Type something..."
                            style={{ 
                                color: textBackground ? (currentColor === "#FFFFFF" ? "#000000" : "#FFFFFF") : currentColor,
                                fontFamily: currentFontFamily,
                                backgroundColor: textBackground ? (currentColor === "#FFFFFF" ? "#FFFFFF" : currentColor) : "transparent",
                                borderRadius: '8px',
                                padding: '1rem'
                            }}
                        />
                    </div>

                    {/* Tools (Keyboard Accessory View) */}
                    <div className="p-4 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
                         {/* Font Family Selector */}
                         <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <Button 
                                variant="outline" 
                                size="icon"
                                className={cn("rounded-full border-white/20 text-white hover:bg-white/20 h-10 w-10 shrink-0", textBackground && "bg-white text-black hover:bg-white/90")}
                                onClick={() => setTextBackground(!textBackground)}
                            >
                                <Baseline className="h-5 w-5" />
                            </Button>
                            <div className="w-px h-8 bg-white/20 mx-2 self-center" />
                             {FONTS.map(font => (
                                 <button
                                    key={font.name}
                                    onClick={() => setCurrentFontFamily(font.family)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
                                        currentFontFamily === font.family 
                                            ? "bg-white text-black border-white" 
                                            : "bg-transparent text-white border-white/30 hover:bg-white/10"
                                    )}
                                    style={{ fontFamily: font.family }}
                                 >
                                    {font.name}
                                 </button>
                             ))}
                         </div>

                        {/* Color Picker */}
                        <div className="flex justify-center gap-3 overflow-x-auto p-1 scrollbar-hide">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0",
                                        currentColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setCurrentColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Emoji Picker Modal */}
            {showEmojiPicker && (
                <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowEmojiPicker(false)}>
                    <div className="bg-zinc-900 w-full max-w-sm rounded-t-xl sm:rounded-xl overflow-hidden h-[50vh] sm:h-[400px] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-2 border-b border-zinc-800 flex justify-center">
                            <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
                        </div>
                        <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={handleAddEmoji}
                            width="100%"
                            height="100%"
                            previewConfig={{ showPreview: false }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaEditor;