import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedAreaPixels: Area) => void;
    aspect?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
    imageSrc,
    onCropComplete,
    aspect = 4 / 5,
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const handleCropComplete = useCallback(
        (_: Area, croppedAreaPixels: Area) => {
            onCropComplete(croppedAreaPixels);
        },
        [onCropComplete]
    );

    return (
        <div className="relative w-full h-[300px] bg-black">
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={onCropChange}
                onCropComplete={handleCropComplete}
                onZoomChange={onZoomChange}
                onRotationChange={onRotationChange}
            />
            <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                    <label className="text-white text-xs mb-1 block">Zoom</label>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value: number[]) => setZoom(value[0])}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
