/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import { useEditor } from '../context/EditorContext';
import ComparisonSlider from './ComparisonSlider';
import Spinner from './Spinner';

const ImageViewer: React.FC = () => {
    const {
        activeTool,
        currentImage,
        currentImageUrl,
        originalImageUrl,
        imgRef,
        canvasRef,
        isLoading,
        loadingMessage,
        zoom,
        panOffset,
        handleWheel,
        handlePanStart,
        isPanModeActive,
        isCurrentlyPanning,
        crop,
        setCrop,
        completedCrop,
        setCompletedCrop,
        aspect,
        compareMode,
        maskDataUrl,
        startDrawing,
        stopDrawing,
        draw,
        generatedVideoUrl,
    } = useEditor();

    // Reset crop when image changes
    useEffect(() => {
        setCompletedCrop(undefined);
        setCrop(undefined);
    }, [currentImage, setCompletedCrop, setCrop]);

    // If a video has been generated, it takes precedence.
    if (generatedVideoUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <video
                    key={generatedVideoUrl} // Ensures the player reloads for a new video
                    src={generatedVideoUrl}
                    controls // Enables native browser controls (play, pause, volume)
                    autoPlay // Starts playback automatically
                    loop     // Loops the video
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
            </div>
        );
    }

    if (!currentImageUrl) {
        // This case is for tools like Video Generator that don't need an initial image.
        // It shows a neutral state before a video is generated.
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500">A visualização aparecerá aqui.</p>
            </div>
        );
    }
    
    const isCropping = !!crop;

    return (
        <div
            className="w-full h-full flex items-center justify-center overflow-hidden relative select-none"
            onWheel={activeTool !== 'crop' ? handleWheel : undefined}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                    <Spinner />
                    <p className="text-gray-300 text-lg font-semibold animate-pulse">{loadingMessage || 'Processando...'}</p>
                </div>
            )}
            
            <div
                className={`relative transition-transform duration-200 ease-out ${isPanModeActive ? (isCurrentlyPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                style={{
                    transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseDown={handlePanStart}
            >
                {compareMode === 'split' ? (
                    <ComparisonSlider
                        originalSrc={originalImageUrl!}
                        modifiedSrc={currentImageUrl}
                    />
                ) : (
                    <>
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            className="max-w-full max-h-full"
                        >
                            <img
                                ref={imgRef}
                                src={currentImageUrl}
                                alt="Imagem atual"
                                className="object-contain max-w-full max-h-full"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </ReactCrop>

                        {/* Mask Canvas - visible when cropping or explicitly enabled by a tool */}
                        {(isCropping || maskDataUrl) && (
                            <canvas
                                ref={canvasRef}
                                width={imgRef.current?.naturalWidth}
                                height={imgRef.current?.naturalHeight}
                                className="absolute top-0 left-0 w-full h-full opacity-50 cursor-crosshair pointer-events-auto"
                                style={{ pointerEvents: isPanModeActive ? 'none' : 'auto' }}
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseMove={draw}
                                onMouseLeave={stopDrawing}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageViewer;