/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import html2canvas from 'html2canvas';

// Hooks
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
import { dataURLtoFile } from '../utils/imageUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type CompareMode, type SharpenMode, type CollageLayout, type VideoAspectRatio } from '../types';

const DEFAULT_LOCAL_FILTERS = {
    brightness: 100, contrast: 100, saturate: 100, sepia: 0, invert: 0,
    grayscale: 0, hueRotate: 0, blur: 0
};

interface EditorContextType {
    // Modal & Tool State
    activeTool: ToolId | null;
    setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;

    // Global State
    currentImage: File | null;
    originalImage: File | null;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;

    // History State
    isHistoryLoading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    setInitialImage: (file: File) => void;
    handleUploadNew: () => void;

    // Image & Canvas Refs/URLs
    imgRef: React.RefObject<HTMLImageElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentImageUrl: string | null;
    originalImageUrl: string | null;

    // UI State
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    compareMode: CompareMode;
    setCompareMode: React.Dispatch<React.SetStateAction<CompareMode>>;
    isDownloadModalOpen: boolean;
    setIsDownloadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Pan & Zoom
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number; y: number; };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    resetZoomAndPan: () => void;
    
    // Crop State
    crop?: Crop;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop?: PixelCrop;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect?: number;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    handleApplyCrop: () => void;

    // Mask Canvas State
    maskDataUrl: string | null;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    handleAutoSelect: () => Promise<void>;

    // Local Adjustments State
    localFilters: typeof DEFAULT_LOCAL_FILTERS;
    setLocalFilters: React.Dispatch<React.SetStateAction<typeof DEFAULT_LOCAL_FILTERS>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: typeof DEFAULT_LOCAL_FILTERS) => string;
    handleApplyLocalAdjustments: () => void;
    resetLocalFilters: () => void;

    // Generative Edit State
    generativeMode: 'fill' | 'remove' | 'compose';
    setGenerativeMode: React.Dispatch<React.SetStateAction<'fill' | 'remove' | 'compose'>>;
    secondImageFile: File | null;
    setSecondImageFile: React.Dispatch<React.SetStateAction<File | null>>;

    // Video State
    generatedVideoUrl: string | null;
    handleGenerateVideo: (prompt: string, aspectRatio: string) => Promise<void>;

    // API Call Handlers
    handleApplyStyle: (stylePrompt: string) => Promise<void>;
    handleRemoveBackground: () => Promise<void>;
    handleApplyAIAdjustment: (adjustmentPrompt: string) => Promise<void>;
    handleGenerativeEdit: () => Promise<void>;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => Promise<void>;
    handleTransform: (transformType: TransformType) => Promise<void>;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
};

// A hook specifically for the panels to simplify access to loading/error states
export const useLoadingError = () => {
    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useEditor()!;
    return { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage };
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Modal State
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    
    // Global State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    
    // UI State
    const [prompt, setPrompt] = useState<string>('');
    const [compareMode, setCompareMode] = useState<CompareMode>('single');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Editing State
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);
    const [generativeMode, setGenerativeMode] = useState<'fill' | 'remove' | 'compose'>('fill');
    const [secondImageFile, setSecondImageFile] = useState<File | null>(null);
    const [brushSize, setBrushSize] = useState<number>(30);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    // Hooks for complex state
    const { maskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning } = usePanAndZoom();

    // History hook and its cleanup callback
    const onHistoryStateChange = useCallback(() => {
        clearMask();
        setSecondImageFile(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
        setError(null);
        setPrompt('');
        setGeneratedVideoUrl(null);
    }, [clearMask]);

    const {
        currentImage, originalImage, canUndo, canRedo, isHistoryLoading, addImageToHistory,
        setInitialImage, clearHistory, undo, redo, resetHistory
    } = useHistoryState(onHistoryStateChange);
    
    // Clear generated video when not in video tool to prevent it from showing up in other editors
    useEffect(() => {
        if (activeTool !== 'videoGen') {
            setGeneratedVideoUrl(null);
        }
    }, [activeTool]);

    // Image URL Management
    const urlCache = useRef(new Map<File, string>());
    const getImageUrl = useCallback((file: File | null): string | null => {
        if (!file) return null;
        if (urlCache.current.has(file)) return urlCache.current.get(file)!;
        const url = URL.createObjectURL(file);
        urlCache.current.set(file, url);
        return url;
    }, []);
    useEffect(() => () => {
        for (const url of urlCache.current.values()) URL.revokeObjectURL(url);
        urlCache.current.clear();
    }, []);

    const currentImageUrl = useMemo(() => getImageUrl(currentImage), [currentImage, getImageUrl]);
    const originalImageUrl = useMemo(() => getImageUrl(originalImage), [originalImage, getImageUrl]);

    // Derived State
    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);

    // API Call Wrapper
    const handleApiCall = useCallback(async (apiFunc: () => Promise<string>, context: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const resultUrl = await apiFunc();
            const newImageFile = dataURLtoFile(resultUrl, `${context}-${Date.now()}.png`);
            addImageToHistory(newImageFile);
        } catch (err) {
            setError(`Falha na operação de ${context}. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [addImageToHistory]);

    // API Handlers
    const handleApplyStyle = useCallback(async (stylePrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando estilo...");
        await handleApiCall(() => geminiService.applyStyle(currentImage, stylePrompt), 'aplicar-estilo');
    }, [currentImage, handleApiCall]);

    const handleRemoveBackground = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Removendo fundo...");
        await handleApiCall(() => geminiService.removeBackground(currentImage), 'remover-fundo');
    }, [currentImage, handleApiCall]);

    const handleApplyAIAdjustment = useCallback(async (adjustmentPrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando ajuste...");
        await handleApiCall(() => geminiService.generateAdjustedImage(currentImage, adjustmentPrompt), 'ajuste-ia');
    }, [currentImage, handleApiCall]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Editando com IA...");
        await handleApiCall(async () => {
            if (generativeMode === 'compose') {
                if (!prompt.trim()) throw new Error("Prompt é necessário para composição.");
                return geminiService.generativeEdit(currentImage, prompt, 'compose', { secondImage: secondImageFile ?? undefined });
            }
            if (!maskDataUrl) throw new Error("Máscara é necessária para preencher/remover.");
            if (generativeMode === 'fill' && !prompt.trim()) throw new Error("Prompt é necessário para preencher.");
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            return geminiService.generativeEdit(currentImage, prompt, generativeMode, { maskImage: maskFile });
        }, 'edicao-generativa');
    }, [currentImage, maskDataUrl, generativeMode, prompt, secondImageFile, handleApiCall]);

    const handleApplyUpscale = useCallback(async (factor: number, preserveFace: boolean) => {
        if (!currentImage) return;
        setLoadingMessage(`Aumentando escala em ${factor}x...`);
        await handleApiCall(() => geminiService.upscaleImage(currentImage, factor, preserveFace), 'upscale');
    }, [currentImage, handleApiCall]);
    
    const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: string) => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Gerando seu vídeo, isso pode levar alguns instantes...");
        setGeneratedVideoUrl(null); 
        try {
            const resultUrl = await geminiService.generateVideo(prompt, aspectRatio);
            setGeneratedVideoUrl(resultUrl);
        } catch (err) {
            setError(`Falha na geração de vídeo. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, []);

    const handleAutoSelect = useCallback(async () => {
        // This function is for auto-masking, which is not a core tool yet.
        // It's kept for potential future use in the GenerativeEditPanel.
    }, []);

    // Local Edit Handlers
    const buildFilterString = useCallback((filters: typeof DEFAULT_LOCAL_FILTERS) => {
        return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) invert(${filters.invert}%) grayscale(${filters.grayscale}%) hue-rotate(${filters.hueRotate}deg) blur(${filters.blur}px)`;
    }, []);

    const handleApplyLocalAdjustments = useCallback(() => {
        if (!currentImageUrl) return;
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.filter = buildFilterString(localFilters);
            ctx.drawImage(image, 0, 0);
            const newImageFile = dataURLtoFile(canvas.toDataURL('image/png'), 'adjusted.png');
            addImageToHistory(newImageFile);
        };
        image.src = currentImageUrl;
    }, [currentImageUrl, buildFilterString, localFilters, addImageToHistory]);
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);

    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width; canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
        addImageToHistory(dataURLtoFile(canvas.toDataURL('image/png'), 'cropped.png'));
    }, [completedCrop, addImageToHistory]);

    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!currentImageUrl) return;
        setIsLoading(true);
        const image = new Image();
        image.src = currentImageUrl;
        await new Promise(res => image.onload = res);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = image;
        if (transformType === 'rotate-left' || transformType === 'rotate-right') {
            canvas.width = height; canvas.height = width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((transformType === 'rotate-left' ? -90 : 90) * Math.PI / 180);
            ctx.drawImage(image, -width / 2, -height / 2);
        } else {
            canvas.width = width; canvas.height = height;
            if (transformType === 'flip-h') { ctx.translate(width, 0); ctx.scale(-1, 1); }
            if (transformType === 'flip-v') { ctx.translate(0, height); ctx.scale(1, -1); }
            ctx.drawImage(image, 0, 0);
        }
        addImageToHistory(dataURLtoFile(canvas.toDataURL('image/png'), 'transformed.png'));
        setIsLoading(false);
    }, [currentImageUrl, addImageToHistory]);
    
    const handleUploadNew = useCallback(() => {
        clearHistory();
        setActiveTool(null);
    }, [clearHistory]);

    const value: EditorContextType = {
        activeTool, setActiveTool,
        currentImage, originalImage, isLoading, setIsLoading, error, setError, loadingMessage, setLoadingMessage,
        isHistoryLoading, canUndo, canRedo, undo, redo, resetHistory, setInitialImage, handleUploadNew,
        imgRef, canvasRef, currentImageUrl, originalImageUrl,
        prompt, setPrompt, compareMode, setCompareMode, isDownloadModalOpen, setIsDownloadModalOpen,
        zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan,
        crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, handleApplyCrop,
        maskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, handleAutoSelect,
        localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, handleApplyLocalAdjustments, resetLocalFilters,
        generativeMode, setGenerativeMode, secondImageFile, setSecondImageFile,
        generatedVideoUrl, handleGenerateVideo,
        handleApplyStyle, handleRemoveBackground, handleApplyAIAdjustment, handleGenerativeEdit, handleApplyUpscale, handleTransform,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};