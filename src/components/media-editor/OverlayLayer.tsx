import React, { useEffect, useState } from "react";
import Moveable from "react-moveable";

export interface OverlayItem {
    id: string;
    type: "text" | "emoji";
    content: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color?: string;
    fontSize?: number;
}

interface OverlayLayerProps {
    overlays: OverlayItem[];
    setOverlays: React.Dispatch<React.SetStateAction<OverlayItem[]>>;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

const OverlayLayer: React.FC<OverlayLayerProps> = ({
    overlays,
    setOverlays,
    activeId,
    setActiveId,
    containerRef,
}) => {
    const [target, setTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (activeId) {
            const el = document.getElementById(activeId);
            setTarget(el);
        } else {
            setTarget(null);
        }
    }, [activeId]);

    const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
        setOverlays((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {overlays.map((item) => (
                <div
                    key={item.id}
                    id={item.id}
                    className="absolute cursor-move pointer-events-auto origin-center touch-none select-none"
                    style={{
                        transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale})`,
                        color: item.color || "white",
                        fontSize: item.fontSize || 32,
                        fontWeight: "bold",
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        whiteSpace: "pre-wrap",
                        zIndex: 10,
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(item.id);
                    }}
                >
                    {item.content}
                </div>
            ))}

            {activeId && target && (
                <Moveable
                    target={target}
                    container={containerRef.current}
                    draggable={true}
                    throttleDrag={0}
                    resizable={true}
                    throttleResize={0}
                    rotatable={true}
                    throttleRotate={0}
                    origin={false}
                    keepRatio={true}
                    renderDirections={["nw", "ne", "se", "sw"]}

                    onDrag={(e) => {
                        e.target.style.transform = e.transform;
                    }}
                    onDragEnd={(e) => {
                        // For simple state sync (simplified parsing):
                        const matrix = new DOMMatrix(getComputedStyle(e.target).transform);
                        updateOverlay(activeId, { x: matrix.e, y: matrix.f });
                    }}

                    onScale={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onRotate={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}

                    // Sync back to state on end
                    onRenderEnd={() => {
                        // This is a bit complex to parse back fully to pure x/y/rotation/scale components 
                        // without a matrix math library, so often usually people just rely on the visual DOM style 
                        // during edit and screenshot the container.
                        // But for saving, we might need it. For now, visual editing is key.
                    }}
                />
            )}
        </div>
    );
};

export default OverlayLayer;
