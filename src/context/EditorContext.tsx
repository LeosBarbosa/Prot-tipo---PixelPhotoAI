/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useCallback, useRef, useContext, ReactNode, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import html2canvas from 'html2canvas';
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
// FIX: Changed import path to src/utils/fileUtils.ts where dataURLtoFile is exported.
import { dataURLtoFile } from '../utils/fileUtils';
import { 
    extractArt, applyStyle, generateAdjustedImage, removeBackground, 
    generativeEdit, upscaleImage, generateMask, generateProfessionalPortrait, 
    faceSwap 
} from '../services/geminiService';
import { Tab, TransformType, CompareMode, SharpenMode, CollageLayout, VideoAspectRatio } from '../types';
import { applyLUT, generateHistogram } from '../utils/imageProcessing';

const DEFAULT_LOCAL_FILTERS = {
    brightness: 100, contrast: 100, saturate: 100, sepia: 0, invert: 0,
    grayscale: 0, hueRotate: 0, blur: 0
};

// Define o tipo para o valor do contexto
interface EditorContextType {
    // Estado & Histórico
    currentImage: File | null;
    originalImage: File | null;
    isHistoryLoading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    activeTab: Tab;
    setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    setInitialImage: (file: File) => void;
    
    // Estado da UI
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    singleViewImage: 'before' | 'after';
    setSingleViewImage: React.Dispatch<React.SetStateAction<'before' | 'after'>>;
    isDownloadModalOpen: boolean;
    setIsDownloadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    compareMode: CompareMode;
    setCompareMode: React.Dispatch<React.SetStateAction<CompareMode>>;
    previewImageData: ImageData | null;
    setPreviewImageData: React.Dispatch<React.SetStateAction<ImageData | null>>;
    
    // Refs e URLs de Imagem
    imgRef: React.RefObject<HTMLImageElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentImageUrl: string | null;
    originalImageUrl: string | null;
    
    // Ajustes Locais
    localFilters: typeof DEFAULT_LOCAL_FILTERS;
    setLocalFilters: React.Dispatch<React.SetStateAction<typeof DEFAULT_LOCAL_FILTERS>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: typeof DEFAULT_LOCAL_FILTERS) => string;
    handleApplyLocalAdjustments: () => void;
    resetLocalFilters: () => void;
    
    // Corte
    crop?: Crop;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop?: PixelCrop;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect?: number;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    handleApplyCrop: () => void;
    
    // Pan & Zoom
    zoom: number;
    panOffset: { x: number; y: number; };
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    resetZoomAndPan: () => void;
    isCurrentlyPanning: boolean;
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    
    // Canvas de Máscara
    maskDataUrl: string | null;
    setMaskDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
    maskOpacity: number;
    setMaskOpacity: React.Dispatch<React.SetStateAction<number>>;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    clearMask: () => void;
    handleAutoSelect: () => Promise<void>;
    
    // Edição Generativa
    generativeMode: 'fill' | 'remove' | 'compose';
    setGenerativeMode: React.Dispatch<React.SetStateAction<'fill' | 'remove' | 'compose'>>;
    secondImageFile: File | null;
    setSecondImageFile: React.Dispatch<React.SetStateAction<File | null>>;
    handleGenerativeEdit: () => Promise<void>;
    
    // Upscale
    originalDimensions: { width: number; height: number; } | null;
    setOriginalDimensions: React.Dispatch<React.SetStateAction<{ width: number; height: number; } | null>>;
    
    // Ações da API
    handleExtractArt: () => Promise<void>;
    handleRemoveBackground: () => Promise<void>;
    handleApplyStyle: (stylePrompt: string) => Promise<void>;
    handleApplyAIAdjustment: (adjustmentPrompt: string) => Promise<void>;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => Promise<void>;
    handleTransform: (transformType: TransformType) => Promise<void>;
    handleApplyEnhancements: (enhancements: { noise: boolean; sharpen: boolean; faces: boolean; restore: boolean; }, sharpenMode: SharpenMode) => Promise<void>;
    handleGeneratePortrait: () => Promise<void>;
    handleFaceSwap: () => Promise<void>;
    handleBackgroundChange: (prompt: string) => Promise<void>;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => Promise<void>;
    handleApplyCollage: () => Promise<void>;

    // Cursor
    cursorPreview: { visible: boolean; x: number; y: number; };
    setCursorPreview: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; }>>;
    
    // Ações Gerais
    handleUploadNew: () => void;

    // Estado da Troca de Rosto
    faceSwapSourceImage: File | null;
    setFaceSwapSourceImage: React.Dispatch<React.SetStateAction<File | null>>;

    // Estado da Colagem
    collageLayout: CollageLayout;
    setCollageLayout: React.Dispatch<React.SetStateAction<CollageLayout>>;
    collageImages: { [key: number]: File | null };
    handleSetCollageImage: (image: File, index: number) => void;
    collageSettings: { spacing: number, rounding: number };
    setCollageSettings: React.Dispatch<React.SetStateAction<{ spacing: number, rounding: number }>>;
    resetCollage: () => void;
    collageCanvasRef: React.RefObject<HTMLDivElement>;

    // Estado do Vídeo
    generatedVideoUrl: string | null;

    // Curva de Tons
    histogram: { r: number[], g: number[], b: number[] } | null;
    originalImageDataForCurves: ImageData | null;
    applyLUT: (imageData: ImageData, lut: number[]) => ImageData;
    generateHistogram: (imageData: ImageData) => { r: number[], g: number[], b: number[] };
    loadOriginalImageDataForCurves: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('extract');
    const [prompt, setPrompt] = useState<string>('');
    
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
    const [singleViewImage, setSingleViewImage] = useState<'before' | 'after'>('after');
    const [compareMode, setCompareMode] = useState<CompareMode>('single');
    const [previewImageData, setPreviewImageData] = useState<ImageData | null>(null);
    
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [maskOpacity, setMaskOpacity] = useState(0.7);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);
    const [generativeMode, setGenerativeMode] = useState<'fill' | 'remove' | 'compose'>('fill');
    const [secondImageFile, setSecondImageFile] = useState<File | null>(null);
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
    const [cursorPreview, setCursorPreview] = useState({ visible: false, x: 0, y: 0 });
    const [brushSize, setBrushSize] = useState<number>(30);
    const [faceSwapSourceImage, setFaceSwapSourceImage] = useState<File | null>(null);
    const [collageLayout, setCollageLayout] = useState<CollageLayout>('2-vertical');
    const [collageImages, setCollageImages] = useState<{ [key: number]: File | null }>({});
    const [collageSettings, setCollageSettings] = useState({ spacing: 8, rounding: 8 });
    const collageCanvasRef = useRef<HTMLDivElement>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [histogram, setHistogram] = useState<{ r: number[], g: number[], b: number[] } | null>(null);
    const [originalImageDataForCurves, setOriginalImageDataForCurves] = useState<ImageData | null>(null);
    
    const { 
        maskDataUrl, setMaskDataUrl, clearMask, 
        startDrawing, stopDrawing, draw 
    } = useMaskCanvas(canvasRef, brushSize);
    
    const { 
        zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, 
        handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning 
    } = usePanAndZoom();

    const resetLocalFilters = useCallback(() => {
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
        setPreviewImageData(null);
    }, []);

    const onHistoryStateChange = useCallback(() => {
        clearMask();
        setSecondImageFile(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        resetLocalFilters();
        setError(null);
        setPrompt('');
        setPreviewImageData(null);
        setFaceSwapSourceImage(null);
        setGeneratedVideoUrl(null);
    }, [clearMask, resetLocalFilters]);

    const {
        currentImage, originalImage, canUndo, canRedo, isHistoryLoading, addImageToHistory,
        setInitialImage, clearHistory, undo, redo, resetHistory
    } = useHistoryState(onHistoryStateChange);

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

    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);

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
    
    const handleExtractArt = useCallback(async () => {
        if (!prompt.trim() || !maskDataUrl || !currentImage) return;
        setLoadingMessage("Extraindo arte...");
        await handleApiCall(() => extractArt(currentImage, dataURLtoFile(maskDataUrl, 'mask.png'), prompt), 'extrair-arte');
    }, [currentImage, prompt, maskDataUrl, handleApiCall]);

    const handleApplyStyle = useCallback(async (stylePrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando estilo...");
        await handleApiCall(() => applyStyle(currentImage, stylePrompt), 'aplicar-estilo');
    }, [currentImage, handleApiCall]);

    const handleRemoveBackground = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Removendo fundo...");
        await handleApiCall(() => removeBackground(currentImage), 'remover-fundo');
    }, [currentImage, handleApiCall]);

    const handleApplyAIAdjustment = useCallback(async (adjustmentPrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando ajuste...");
        await handleApiCall(() => generateAdjustedImage(currentImage, adjustmentPrompt), 'ajuste-ia');
    }, [currentImage, handleApiCall]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Editando com IA...");
        await handleApiCall(async () => {
            if (generativeMode === 'compose') {
                if (!prompt.trim()) throw new Error("Prompt é necessário para composição.");
                return generativeEdit(currentImage, prompt, 'compose', { secondImage: secondImageFile ?? undefined });
            }
            if (!maskDataUrl) throw new Error("Máscara é necessária para preencher/remover.");
            if (generativeMode === 'fill' && !prompt.trim()) throw new Error("Prompt é necessário para preencher.");
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            return generativeEdit(currentImage, prompt, generativeMode, { maskImage: maskFile });
        }, 'edicao-generativa');
    }, [currentImage, maskDataUrl, generativeMode, prompt, secondImageFile, handleApiCall]);
    
    const handleApplyUpscale = useCallback(async (factor: number, preserveFace: boolean) => {
        if (!currentImage) return;
        setLoadingMessage(`Aumentando escala em ${factor}x...`);
        await handleApiCall(() => upscaleImage(currentImage, factor, preserveFace), 'upscale');
    }, [currentImage, handleApiCall]);

    const handleApplyEnhancements = useCallback(async (
        enhancements: { noise: boolean; sharpen: boolean; faces: boolean; restore: boolean; },
        sharpenMode: SharpenMode
    ) => {
        if (!currentImage) return;
        let prompt = 'Aplique os seguintes aprimoramentos a esta imagem: ';
        if (enhancements.noise) prompt += 'remoção de ruído, ';
        if (enhancements.sharpen) prompt += `aumento de nitidez (modo: ${sharpenMode}), `;
        if (enhancements.faces) prompt += 'recuperação de faces, ';
        if (enhancements.restore) prompt += 'restauração de foto antiga, ';
        prompt = prompt.slice(0, -2) + '.';
        setLoadingMessage("Aplicando aprimoramentos...");
        await handleApiCall(() => generateAdjustedImage(currentImage, prompt), 'aprimoramentos-ia');
    }, [currentImage, handleApiCall]);

    const handleAutoSelect = useCallback(async () => {
        if (!currentImage) return;
        setIsLoading(true); setError(null); setLoadingMessage("Analisando imagem...");
        try {
            const generatedMaskDataUrl = await generateMask(currentImage);
            setMaskDataUrl(generatedMaskDataUrl);
        } catch (err) {
            setError(`Falha na seleção automática. ${err instanceof Error ? err.message : 'Erro desconhecido.'}`);
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [currentImage, setMaskDataUrl]);

    const handleGeneratePortrait = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Gerando retrato...");
        await handleApiCall(() => generateProfessionalPortrait(currentImage), 'retrato-ia');
    }, [currentImage, handleApiCall]);

    const handleFaceSwap = useCallback(async () => {
        if (!currentImage || !faceSwapSourceImage) return;
        setLoadingMessage("Trocando rostos...");
        await handleApiCall(() => faceSwap(faceSwapSourceImage, currentImage), 'troca-de-rosto');
    }, [currentImage, faceSwapSourceImage, handleApiCall]);

    const handleBackgroundChange = useCallback(async (prompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Alterando fundo...");
        const bgRemovedImage = await removeBackground(currentImage);
        const bgRemovedFile = dataURLtoFile(bgRemovedImage, 'bg_removed.png');
        await handleApiCall(() => generateAdjustedImage(bgRemovedFile, `Coloque esta imagem em um novo fundo descrito como: "${prompt}"`), 'alterar-fundo');
    }, [currentImage, handleApiCall]);

    const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: VideoAspectRatio) => {
        // This is a placeholder as the Gemini service for video is not implemented yet.
        setIsLoading(true); setLoadingMessage("Iniciando geração de vídeo...");
        await new Promise(res => setTimeout(res, 3000));
        const dummyVideoUrl = "https://storage.googleapis.com/web-dev-assets/video-api-demo/20240506_145034_355_A_high-quality_realistic_video_of_a_man_in_a_suit_walking_through_a_busy_city_street.mp4";
        setGeneratedVideoUrl(dummyVideoUrl);
        setIsLoading(false); setLoadingMessage(null);
    }, []);

    const handleApplyCollage = useCallback(async () => {
        if (!collageCanvasRef.current) return;
        setLoadingMessage("Criando colagem...");
        setIsLoading(true);
        try {
            const canvas = await html2canvas(collageCanvasRef.current, {
                backgroundColor: null,
                useCORS: true,
            });
            const dataUrl = canvas.toDataURL('image/png');
            const file = dataURLtoFile(dataUrl, 'collage.png');
            addImageToHistory(file);
        } catch (err) {
            setError("Falha ao criar a colagem.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [addImageToHistory]);

    const handleSetCollageImage = (image: File, index: number) => {
        setCollageImages(prev => ({ ...prev, [index]: image }));
    };

    const resetCollage = () => {
        setCollageImages({});
    };

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
            if (previewImageData) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if(!tempCtx) return;
                tempCanvas.width = previewImageData.width;
                tempCanvas.height = previewImageData.height;
                tempCtx.putImageData(previewImageData, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            } else {
                if (hasLocalAdjustments) ctx.filter = buildFilterString(localFilters);
                ctx.drawImage(image, 0, 0);
            }
            const newImageFile = dataURLtoFile(canvas.toDataURL('image/png'), 'adjusted.png');
            addImageToHistory(newImageFile);
        };
        image.src = currentImageUrl;
    }, [currentImageUrl, previewImageData, hasLocalAdjustments, buildFilterString, localFilters, addImageToHistory]);

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
    
    const handleUploadNew = useCallback(() => clearHistory(), [clearHistory]);
    
    const loadOriginalImageDataForCurves = useCallback(() => {
        if (!currentImageUrl) return;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setOriginalImageDataForCurves(data);
            setHistogram(generateHistogram(data));
        };
        img.src = currentImageUrl;
    }, [currentImageUrl]);

    // FIX: Completed the EditorProvider by creating the value object and returning the provider.
    const value: EditorContextType = {
        currentImage, originalImage, isHistoryLoading, error, setError, isLoading, setIsLoading,
        loadingMessage, setLoadingMessage, activeTab, setActiveTab, canUndo, canRedo, undo, redo,
        resetHistory, setInitialImage, prompt, setPrompt, singleViewImage, setSingleViewImage,
        isDownloadModalOpen, setIsDownloadModalOpen, compareMode, setCompareMode, previewImageData,
        setPreviewImageData, imgRef, canvasRef, currentImageUrl, originalImageUrl, localFilters,
        setLocalFilters, hasLocalAdjustments, buildFilterString, handleApplyLocalAdjustments,
        resetLocalFilters, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect,
        handleApplyCrop, zoom, panOffset, handleWheel, handlePanStart, resetZoomAndPan,
        isCurrentlyPanning, isPanModeActive, setIsPanModeActive, setZoom, maskDataUrl, setMaskDataUrl,
        maskOpacity, setMaskOpacity, brushSize, setBrushSize, startDrawing, stopDrawing, draw,
        clearMask, handleAutoSelect, generativeMode, setGenerativeMode, secondImageFile,
        setSecondImageFile, handleGenerativeEdit, originalDimensions, setOriginalDimensions,
        handleExtractArt, handleRemoveBackground, handleApplyStyle, handleApplyAIAdjustment,
        handleApplyUpscale, handleTransform, handleApplyEnhancements, handleGeneratePortrait,
        handleFaceSwap, handleBackgroundChange, handleGenerateVideo, handleApplyCollage,
        cursorPreview, setCursorPreview, handleUploadNew, faceSwapSourceImage, setFaceSwapSourceImage,
        collageLayout, setCollageLayout, collageImages, handleSetCollageImage, collageSettings,
        setCollageSettings, resetCollage, collageCanvasRef, generatedVideoUrl, histogram,
        originalImageDataForCurves, applyLUT, generateHistogram, loadOriginalImageDataForCurves,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
