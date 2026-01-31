"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "motion/react";

interface GlobalTimelineViewProps {
    onBack: () => void;
}

export default function GlobalTimelineView({ onBack }: GlobalTimelineViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Motion values for smooth interaction
    const rotateX = useMotionValue(20);
    const rotateY = useMotionValue(-45);
    const scrollZ = useMotionValue(-200);

    // Smooth springs
    const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 20 });
    const springScrollZ = useSpring(scrollZ, { stiffness: 80, damping: 20 });

    // Interaction state
    const lastMousePos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        lastMousePos.current = { x: clientX, y: clientY };
    };

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

        const deltaX = clientX - lastMousePos.current.x;
        const deltaY = clientY - lastMousePos.current.y;

        // Update rotation based on drag
        rotateY.set(rotateY.get() + deltaX * 0.3);
        rotateX.set(Math.max(0, Math.min(60, rotateX.get() - deltaY * 0.3))); // Clamp pitch

        lastMousePos.current = { x: clientX, y: clientY };
    }, [isDragging, rotateX, rotateY]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle scroll for moving forward/back in time (Z-axis)
    const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) return; // Ignore pinch gestures
        e.stopPropagation();

        const currentZ = scrollZ.get();
        scrollZ.set(Math.min(500, Math.max(-1000, currentZ - e.deltaY * 2)));
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchend', handleMouseUp);

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchend', handleMouseUp);
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [handleMouseMove]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full absolute inset-0 overflow-hidden bg-base-100 cursor-grab active:cursor-grabbing"
            style={{ perspective: "1000px" }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            <motion.div
                className="w-full h-full"
                style={{
                    transformStyle: "preserve-3d",
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    z: springScrollZ,
                    transformOrigin: "center center"
                }}
            >
                {/* 3D Line Visualization */}
                <div
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{
                        transform: 'translate(-50%, -50%)',
                        transformStyle: 'preserve-3d',
                        width: '2000px', // Very long line
                        height: '12px',
                    }}
                >
                    {/* The Line */}
                    <div className="w-full h-full bg-primary shadow-[0_0_50px_rgba(255,255,255,0.8)] rounded-full" />

                    {/* Time Markers */}
                    {Array.from({ length: 25 }).map((_, i) => {
                        const year = 1800 + i * 10;
                        return (
                            <div
                                key={year}
                                className="absolute top-1/2 rounded-full bg-base-content flex items-center justify-center border-4 border-primary group hover:scale-125 transition-transform duration-300"
                                style={{
                                    left: `${i * (100 / 24)}%`,
                                    width: '40px',
                                    height: '40px',
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                                    zIndex: 10,
                                    pointerEvents: 'auto', // Interactive dots
                                    cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(`Clicked year ${year}`);
                                }}
                            >
                                {/* Year Label */}
                                <span
                                    className="absolute -top-16 text-3xl font-bold text-white whitespace-nowrap opacity-80 group-hover:opacity-100"
                                    style={{
                                        transform: 'rotateX(-20deg) rotateY(45deg)', // Counter rotation should ideally be dynamic but fixed is okay for now
                                        textShadow: '0 4px 8px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    {year}
                                </span>

                                {/* Event placeholder */}
                                {i % 3 === 0 && (
                                    <div
                                        className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-base-200/80 backdrop-blur-md p-3 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    >
                                        <div className="text-xs font-bold text-primary mb-1">MAJOR EVENT</div>
                                        <div className="text-sm">Historical milestone for this era</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none">
                Drag to rotate • Scroll to travel time • Pinch out to exit
            </div>
        </div>
    );
}
