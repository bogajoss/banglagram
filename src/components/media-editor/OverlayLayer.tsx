import React, { useState, useLayoutEffect } from "react";
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
    fontFamily?: string;
    background?: boolean;
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
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        setContainer(containerRef.current);
    }, [containerRef]);

    const updateOverlay = (id: string, updates: Partial<OverlayItem>) => {
        setOverlays((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {overlays.map((item) => {
                const isText = item.type === "text";
                const hasBg = isText && item.background;
                
                // Determine text color vs background color for contrast
                const bgColor = hasBg ? (item.color || "white") : "transparent";
                const textColor = hasBg 
                    ? (item.color === "#FFFFFF" || item.color === "#FFFF00" ? "#000000" : "#FFFFFF")
                    : (item.color || "white");

                return (
                    <div
                        key={item.id}
                        id={item.id}
                        className="absolute cursor-move pointer-events-auto origin-center touch-none select-none"
                        style={{
                            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg) scale(${item.scale})`,
                            color: textColor,
                            backgroundColor: bgColor,
                            padding: hasBg ? "4px 12px" : "0px",
                            borderRadius: hasBg ? "8px" : "0px",
                            fontSize: item.fontSize || 32,
                            fontFamily: item.fontFamily || "sans-serif",
                            fontWeight: "bold",
                            textShadow: hasBg ? "none" : "1px 1px 2px rgba(0,0,0,0.8)",
                            whiteSpace: "pre-wrap",
                            zIndex: item.id === activeId ? 50 : 10,
                            textAlign: "center",
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveId(item.id);
                        }}
                    >
                        {item.content}
                    </div>
                );
            })}

            {activeId && container && (
                <Moveable
                    target={`#${activeId}`}
                    container={container}
                    draggable={true}
                    throttleDrag={0}
                    scalable={true}
                    throttleScale={0}
                    rotatable={true}
                    throttleRotate={0}
                    origin={false}
                    keepRatio={true}
                    renderDirections={["nw", "ne", "se", "sw"]}

                    onDrag={(e) => {
                        e.target.style.transform = e.transform;
                    }}
                    onDragEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { x: e.lastEvent.translate[0], y: e.lastEvent.translate[1] });
                        }
                    }}

                    onScale={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onScaleEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { scale: e.lastEvent.scale[0] });
                        }
                    }}

                    onRotate={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onRotateEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { rotation: e.lastEvent.rotation });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default OverlayLayer;
