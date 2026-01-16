import React, { useState, useLayoutEffect, useRef } from "react";
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

    // Refs for manual drag handling (Hybrid Drag)
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const itemStartRef = useRef({ x: 0, y: 0 });
    const currentDragItemIdRef = useRef<string | null>(null);
    const hasMovedRef = useRef(false);

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
                            touchAction: "none",
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            
                            // If item is already active, let Moveable handle the drag
                            if (activeId === item.id) {
                                return;
                            }

                            // Start Manual Drag for unselected items
                            isDraggingRef.current = true;
                            currentDragItemIdRef.current = item.id;
                            dragStartRef.current = { x: e.clientX, y: e.clientY };
                            itemStartRef.current = { x: item.x, y: item.y };
                            hasMovedRef.current = false;
                            
                            // Capture pointer for smooth dragging even if we leave the element
                            e.currentTarget.setPointerCapture(e.pointerId);
                            
                            // IMPORTANT: Do NOT setActiveId here. 
                            // We defer selection to onPointerUp to avoid Moveable mounting mid-drag.
                        }}
                        onPointerMove={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current && currentDragItemIdRef.current === item.id) {
                                const dx = e.clientX - dragStartRef.current.x;
                                const dy = e.clientY - dragStartRef.current.y;
                                
                                // Threshold to consider it a move (avoid jitter on taps)
                                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                                    hasMovedRef.current = true;
                                }

                                updateOverlay(item.id, {
                                    x: itemStartRef.current.x + dx,
                                    y: itemStartRef.current.y + dy
                                });
                            }
                        }}
                        onPointerUp={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current) {
                                isDraggingRef.current = false;
                                currentDragItemIdRef.current = null;
                                e.currentTarget.releasePointerCapture(e.pointerId);
                                
                                // Select the item on release (whether tap or drag-drop)
                                setActiveId(item.id);
                            }
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
                    pinchable={true}
                    origin={false}
                    keepRatio={true}
                    renderDirections={["nw", "ne", "se", "sw"]}

                    onDragStart={(e) => {
                        e.set([overlays.find(o => o.id === activeId)?.x || 0, overlays.find(o => o.id === activeId)?.y || 0]);
                    }}
                    onDrag={(e) => {
                        e.target.style.transform = e.transform;
                    }}
                    onDragEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { x: e.lastEvent.translate[0], y: e.lastEvent.translate[1] });
                        }
                    }}

                    onScaleStart={(e) => {
                        const item = overlays.find(o => o.id === activeId);
                        e.set([item?.scale || 1, item?.scale || 1]);
                        if (e.dragStart) {
                            e.dragStart.set([item?.x || 0, item?.y || 0]);
                        }
                    }}
                    onScale={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onScaleEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { 
                                scale: e.lastEvent.scale[0],
                                x: e.lastEvent.drag.translate[0],
                                y: e.lastEvent.drag.translate[1]
                            });
                        }
                    }}

                    onRotateStart={(e) => {
                        e.set(overlays.find(o => o.id === activeId)?.rotation || 0);
                    }}
                    onRotate={(e) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onRotateEnd={(e) => {
                        if (e.lastEvent) {
                            updateOverlay(activeId, { rotation: e.lastEvent.rotation });
                        }
                    }}

                    onPinch={(e: any) => {
                        e.target.style.transform = e.drag.transform;
                    }}
                    onPinchEnd={(e: any) => {
                         if (e.lastEvent) {
                            updateOverlay(activeId, { 
                                scale: e.lastEvent.scale[0],
                                rotation: e.lastEvent.rotation,
                                x: e.lastEvent.drag.translate[0],
                                y: e.lastEvent.drag.translate[1]
                            });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default OverlayLayer;