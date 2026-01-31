import { useCallback, useRef, useState, useEffect } from 'react';
import type { PinchGestureState, ZoomState } from '../lib/infiniteColumns';

export interface UseZoomGesturesResult {
	zoomState: ZoomState;
	pinchState: PinchGestureState;
	handleTouchStart: (e: TouchEvent) => void;
	handleTouchMove: (e: TouchEvent) => void;
	handleTouchEnd: (e: TouchEvent) => void;
	handleWheel: (e: WheelEvent) => void;
	setZoomLevel: (level: ZoomState['level'], countryId?: string) => void;
	resetZoom: () => void;
}

export interface ZoomGestureOptions {
	resolveFocus?: (center: { x: number; y: number }) => string | undefined;
}

export function useZoomGestures(
	containerRef: React.RefObject<HTMLElement>,
	options: ZoomGestureOptions = {}
): UseZoomGesturesResult {
	const [zoomState, setZoomState] = useState<ZoomState>({
		level: 'table',
		scale: 1,
		transitioning: false,
		scrollPosition: { x: 0, y: 0 },
	});

	const [pinchState, setPinchState] = useState<PinchGestureState>({
		isActive: false,
		startDistance: 0,
		startScale: 1,
		currentScale: 1,
		centerPoint: { x: 0, y: 0 },
	});

	const lastTouchTime = useRef(0);
	const gestureCooldown = useRef(0);
	const animationFrameId = useRef<number | undefined>(undefined);

	// Calculate distance between two touch points
	const getTouchDistance = useCallback((touches: TouchList): number => {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}, []);

	// Calculate center point between two touches
	const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
		if (touches.length < 2) return { x: 0, y: 0 };
		return {
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2,
		};
	}, []);

	// Handle touch start
	const handleTouchStart = useCallback((e: TouchEvent) => {
		if (e.touches.length === 2) {
			e.preventDefault();
			const distance = getTouchDistance(e.touches);
			const center = getTouchCenter(e.touches);

			setPinchState({
				isActive: true,
				startDistance: distance,
				startScale: zoomState.scale,
				currentScale: zoomState.scale,
				centerPoint: center,
			});
		}
	}, [getTouchDistance, getTouchCenter, zoomState.scale]);

	// Handle touch move
	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (e.touches.length === 2 && pinchState.isActive) {
			e.preventDefault();

			const currentDistance = getTouchDistance(e.touches);
			const scale = (currentDistance / pinchState.startDistance) * pinchState.startScale;

			// Constrain scale
			const constrainedScale = Math.max(0.5, Math.min(3, scale));

			setPinchState(prev => ({
				...prev,
				currentScale: constrainedScale,
			}));

			// Update zoom state with smooth transitions
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}

			animationFrameId.current = requestAnimationFrame(() => {
				setZoomState(prev => ({
					...prev,
					scale: constrainedScale,
					transitioning: true,
				}));
			});
		}
	}, [pinchState.isActive, pinchState.startDistance, pinchState.startScale, getTouchDistance]);

	// Handle touch end
	const handleTouchEnd = useCallback((e: TouchEvent) => {
		if (pinchState.isActive) {
			const finalScale = pinchState.currentScale;
			const currentTime = Date.now();

			// Cooldown check to prevent double-jumps
			if (currentTime - gestureCooldown.current < 500) {
				setPinchState({
					isActive: false,
					startDistance: 0,
					startScale: 1,
					currentScale: 1,
					centerPoint: { x: 0, y: 0 },
				});
				return;
			}

			// Determine zoom level based on pinch direction
			// "One pinch = One step" logic
			let newLevel: ZoomState['level'] = zoomState.level;
			let focusId: string | undefined = zoomState.focusedCountryId;
			let changed = false;

			// PINCH IN (Zoom Out)
			if (finalScale < 0.95) {
				if (zoomState.level === 'detail') {
					newLevel = 'table';
					focusId = undefined;
					changed = true;
				} else if (zoomState.level === 'table') {
					newLevel = 'timeline';
					focusId = undefined;
					changed = true;
				}
			}
			// PINCH OUT (Zoom In)
			else if (finalScale > 1.05) {
				if (zoomState.level === 'timeline') {
					newLevel = 'table';
					focusId = undefined;
					changed = true;
				} else if (zoomState.level === 'table') {
					const focusPoint = options.resolveFocus
						? options.resolveFocus(pinchState.centerPoint)
						: undefined;

					newLevel = 'detail';
					if (focusPoint) focusId = focusPoint;
					changed = true;
				}
			}

			if (changed) {
				gestureCooldown.current = currentTime; // Set cooldown
				setZoomState(prev => ({
					...prev,
					level: newLevel,
					scale: newLevel === 'timeline' ? 0.05 : (newLevel === 'table' ? 1 : 2),
					transitioning: false,
					focusedCountryId: focusId,
				}));
			} else {
				// Reset scale if no change
				setZoomState(prev => ({
					...prev,
					transitioning: false,
				}));
			}

			setPinchState({
				isActive: false,
				startDistance: 0,
				startScale: 1,
				currentScale: 1,
				centerPoint: { x: 0, y: 0 },
			});

			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		}

		// Detect double tap for quick zoom (Only Table <-> Detail)
		const currentTime = Date.now();
		if (currentTime - lastTouchTime.current < 300 && e.touches.length === 0) {
			if (currentTime - gestureCooldown.current > 500) {
				setZoomState(prev => {
					// Double tap only toggles Table/Detail. No Timeline on double tap to avoid confusion.
					let nextLevel: ZoomState['level'] = prev.level;
					if (prev.level === 'table') nextLevel = 'detail';
					else if (prev.level === 'detail') nextLevel = 'table';

					if (nextLevel !== prev.level) {
						gestureCooldown.current = currentTime;
						return {
							...prev,
							level: nextLevel,
							scale: nextLevel === 'table' ? 1 : 2,
							transitioning: true,
						};
					}
					return prev;
				});
			}
		}
		lastTouchTime.current = currentTime;
	}, [pinchState, options, zoomState]);

	// Handle wheel for zoom
	const handleWheel = useCallback((e: WheelEvent) => {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();

			const currentTime = Date.now();
			if (currentTime - gestureCooldown.current < 500) return;

			// Use simple direction check for discrete steps
			const isZoomIn = e.deltaY < 0;

			setZoomState(prev => {
				let newLevel = prev.level;
				let focusId = prev.focusedCountryId;
				let changed = false;

				if (isZoomIn) {
					if (prev.level === 'timeline') {
						newLevel = 'table';
						changed = true;
					} else if (prev.level === 'table') {
						newLevel = 'detail';
						if (options.resolveFocus) focusId = options.resolveFocus({ x: e.clientX, y: e.clientY });
						changed = true;
					}
				} else {
					if (prev.level === 'detail') {
						newLevel = 'table';
						focusId = undefined;
						changed = true;
					} else if (prev.level === 'table') {
						newLevel = 'timeline';
						focusId = undefined;
						changed = true;
					}
				}

				if (changed) {
					gestureCooldown.current = currentTime;
					return {
						...prev,
						level: newLevel,
						scale: newLevel === 'timeline' ? 0.05 : (newLevel === 'table' ? 1 : 2),
						transitioning: true,
						focusedCountryId: focusId,
					};
				}
				return prev;
			});

			setTimeout(() => {
				setZoomState(prev => ({ ...prev, transitioning: false }));
			}, 300);
		}
	}, [options]);

	// Programmatically set zoom level
	const setZoomLevel = useCallback((level: ZoomState['level'], countryId?: string) => {
		const scales = { table: 1, detail: 2, timeline: 0.05 };
		gestureCooldown.current = Date.now();
		setZoomState(prev => ({
			...prev,
			level,
			scale: scales[level],
			transitioning: true,
			focusedCountryId: countryId,
		}));

		setTimeout(() => {
			setZoomState(prev => ({ ...prev, transitioning: false }));
		}, 300);
	}, []);

	// Reset zoom
	const resetZoom = useCallback(() => {
		gestureCooldown.current = Date.now();
		setZoomState({
			level: 'table',
			scale: 1,
			transitioning: true,
			scrollPosition: { x: 0, y: 0 },
		});

		setTimeout(() => {
			setZoomState(prev => ({ ...prev, transitioning: false }));
		}, 300);
	}, []);

	// Add event listeners
	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;

		element.addEventListener('touchstart', handleTouchStart, { passive: false });
		element.addEventListener('touchmove', handleTouchMove, { passive: false });
		element.addEventListener('touchend', handleTouchEnd, { passive: false });
		element.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			element.removeEventListener('touchstart', handleTouchStart);
			element.removeEventListener('touchmove', handleTouchMove);
			element.removeEventListener('touchend', handleTouchEnd);
			element.removeEventListener('wheel', handleWheel);

			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

	return {
		zoomState,
		pinchState,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		handleWheel,
		setZoomLevel,
		resetZoom,
	};
}