'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

/**
 * Voice-reactive avatar page using WebSocket + Gemini Live API
 * - Auto-connects on mount
 * - Shows Gintoki avatar that rotates based on voice intensity
 */
export default function VoicePage() {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const [rotation, setRotation] = useState(0);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptRef = useRef(0);
    const isUnmountingRef = useRef(false);

    const API_BASE = 'ws://localhost:8000';
    const API_KEY = 'fido';
    const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
    const BASE_RECONNECT_DELAY = 2000; // Start with 2 seconds

    // Auto-connect and start listening on mount
    useEffect(() => {
        isUnmountingRef.current = false;

        const autoStart = async () => {
            await connect();
            setTimeout(() => {
                startListening();
            }, 500);
        };
        autoStart();

        return () => {
            isUnmountingRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Connect to WebSocket
    async function connect() {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            setConnectionError('');

            const ws = new WebSocket(`${API_BASE}/clone/voice/live?api_key=${API_KEY}`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('🎙️ WebSocket connected');
                reconnectAttemptRef.current = 0; // Reset on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    handleServerMessage(msg);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionError('Connection error - check if server is running');
                setIsConnected(false);
            };

            ws.onclose = (event) => {
                console.log('🎙️ WebSocket closed', event.code);
                setIsConnected(false);
                setIsListening(false);
                wsRef.current = null;

                // Don't reconnect if component is unmounting or closed intentionally (code 1000)
                if (isUnmountingRef.current || event.code === 1000) {
                    setConnectionError('Disconnected from server');
                    return;
                }

                // Calculate exponential backoff delay
                const delay = Math.min(
                    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
                    MAX_RECONNECT_DELAY
                );
                reconnectAttemptRef.current++;

                setConnectionError(`Disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`);
                console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);

                reconnectTimeoutRef.current = setTimeout(async () => {
                    if (!isUnmountingRef.current) {
                        await connect();
                        setTimeout(() => startListening(), 500);
                    }
                }, delay);
            };

        } catch (err) {
            setConnectionError(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    // Disconnect from WebSocket
    function disconnect() {
        stopListening();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }

    // Handle messages from server
    function handleServerMessage(msg: { type: string; session_id?: string; data?: string; text?: string; message?: string }) {
        switch (msg.type) {
            case 'connected':
                setIsConnected(true);
                setConnectionError('');
                console.log('Session ID:', msg.session_id);
                break;

            case 'audio':
                // Decode and queue audio for playback
                if (!msg.data) break;
                const audioData = base64ToFloat32(msg.data);
                playAudioChunk(audioData);

                // Calculate intensity and apply rotation
                const intensity = calculateIntensity(audioData);
                applyRotation(intensity);
                break;

            case 'error':
                setConnectionError(msg.message || 'Unknown error');
                break;

            case 'pong':
                break;

            default:
                console.log('Unknown message:', msg);
        }
    }

    // Calculate audio intensity (RMS)
    function calculateIntensity(audioData: Float32Array): number {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        const rms = Math.sqrt(sum / audioData.length);
        // Normalize and amplify (typical voice RMS is 0.01-0.3)
        return Math.min(1, rms * 5);
    }

    // Apply rotation based on intensity (DougDoug style wobble)
    function applyRotation(intensity: number) {
        // Random direction, magnitude based on intensity
        const maxAngle = 8; // Max rotation in degrees
        const angle = (Math.random() - 0.5) * 2 * maxAngle * intensity;
        setRotation(angle);

        // Reset rotation after a short delay
        if (rotationTimeoutRef.current) {
            clearTimeout(rotationTimeoutRef.current);
        }
        rotationTimeoutRef.current = setTimeout(() => {
            setRotation(0);
        }, 100);
    }

    // Convert base64 PCM to Float32Array for Web Audio
    function base64ToFloat32(base64: string): Float32Array {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        return float32;
    }

    // Queue audio for sequential playback
    function playAudioChunk(audioData: Float32Array) {
        audioQueueRef.current.push(audioData);

        if (!isPlayingRef.current) {
            processAudioQueue();
        }
    }

    // Process queued audio chunks sequentially
    async function processAudioQueue() {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) {
            return;
        }

        isPlayingRef.current = true;

        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        const ctx = audioContextRef.current;
        let nextStartTime = ctx.currentTime;

        while (audioQueueRef.current.length > 0) {
            const audioData = audioQueueRef.current.shift()!;

            const buffer = ctx.createBuffer(1, audioData.length, 24000);
            const channelData = new Float32Array(audioData.length);
            channelData.set(audioData);
            buffer.copyToChannel(channelData, 0);

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(nextStartTime);

            nextStartTime += buffer.duration;
        }

        const waitTime = Math.max(0, (nextStartTime - ctx.currentTime) * 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        isPlayingRef.current = false;

        if (audioQueueRef.current.length > 0) {
            processAudioQueue();
        }
    }

    // Start listening (microphone → WebSocket)
    async function startListening() {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            await connect();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(stream);

            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    return;
                }

                const inputData = e.inputBuffer.getChannelData(0);

                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                const uint8 = new Uint8Array(int16.buffer);
                const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8)));

                wsRef.current.send(JSON.stringify({
                    type: 'audio',
                    data: base64
                }));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsListening(true);
            setConnectionError('');

        } catch (err) {
            setConnectionError(`Microphone error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        }
    }

    // Stop listening
    function stopListening() {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        setIsListening(false);
    }

    const showAvatar = isConnected && isListening && !connectionError;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] to-[#15151f] flex items-end justify-center overflow-hidden">
            {/* Error/Loading State */}
            {connectionError && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-3 rounded-lg text-sm backdrop-blur-sm">
                    {connectionError}
                    <button
                        onClick={() => { connect(); setTimeout(startListening, 500); }}
                        className="ml-4 text-red-200 underline hover:text-white"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Connecting indicator */}
            {!isConnected && !connectionError && (
                <div className="text-gray-400 text-lg animate-pulse">
                    Connecting...
                </div>
            )}

            {/* Gintoki Avatar */}
            {showAvatar && (
                <div
                    className="relative w-screen h-screen transition-transform duration-75 ease-out origin-bottom"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                    }}
                >
                    <Image
                        src="/assets/Gintoki-Sakata.svg"
                        alt="Gintoki"
                        fill
                        priority
                        className="object-contain object-bottom drop-shadow-2xl"
                    />
                </div>
            )}

            {/* Listening indicator */}
            {showAvatar && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-500 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Listening
                </div>
            )}
        </div>
    );
}
