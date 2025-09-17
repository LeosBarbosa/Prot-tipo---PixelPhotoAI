/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { forwardRef, useState, useMemo, useCallback } from 'react';
// FIX: Changed import to use the correct, full-featured context from src.
import { useEditor } from '../src/context/EditorContext';
import { UploadIcon } from './icons';
// FIX: Corrected import path for CollageLayout type.
import { type CollageLayout } from '../types';

const layouts: Record<CollageLayout, { count: number; }> = {
    '2-vertical': { count: 2 },
    '2-horizontal': { count: 2 },
    '3-mixed-1': { count: 3 },
    '3-mixed-2': { count: 3 },
    '4-grid': { count: 4 },
};

const CollageCell: React.FC<{
    index: number;
    imageFile: File | null;
    onImageAdd: (image: File, index: number) => void;
}> = ({ index, imageFile, onImageAdd }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const imageUrl = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile]);

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (files && files[0]) {
            onImageAdd(files[0], index);
        }
    }, [index, onImageAdd]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
        }
    }, [handleFileSelect]);

    return (
        <label
            htmlFor={`collage-upload-${index}`}
            className={`relative w-full h-full bg-black/20 overflow-hidden cursor-pointer transition-all duration-300 flex items-center justify-center ${isDraggingOver ? 'bg-blue-500/20 ring-2 ring-blue-400' : 'hover:bg-black/40'}`}
            style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
            onDrop={handleDrop}
        >
            {!imageUrl && (
                <div className="text-center text-gray-400 flex flex-col items-center gap-2 pointer-events-none p-2">
                    <UploadIcon className="w-8 h-8" />
                    <span className="font-semibold">Adicionar Imagem</span>
                    <span className="text-xs">Arraste ou clique</span>
                </div>
            )}
            <input
                id={`collage-upload-${index}`}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
            />
        </label>
    );
};

const CollageCanvas = forwardRef<HTMLDivElement>((props, ref) => {
    // FIX: Use the unified `useEditor` hook.
    const { collageLayout, collageImages, collageSettings, handleSetCollageImage } = useEditor()!;
    const layoutConfig = layouts[collageLayout];

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        width: '100%',
        height: '100%',
        gap: `${collageSettings.spacing}px`,
        borderRadius: `${collageSettings.rounding}px`,
        padding: `${collageSettings.spacing}px`,
        overflow: 'hidden',
    };

    if (collageLayout === '2-vertical') {
        gridStyle.gridTemplateColumns = '1fr 1fr';
    } else if (collageLayout === '2-horizontal') {
        gridStyle.gridTemplateRows = '1fr 1fr';
    } else if (collageLayout === '4-grid') {
        gridStyle.gridTemplateColumns = '1fr 1fr';
        gridStyle.gridTemplateRows = '1fr 1fr';
    } else if (collageLayout === '3-mixed-1') { // Big left, two small right
        gridStyle.gridTemplateColumns = '2fr 1fr';
        gridStyle.gridTemplateRows = '1fr 1fr';
    } else if (collageLayout === '3-mixed-2') { // Big top, two small bottom
        gridStyle.gridTemplateColumns = '1fr 1fr';
        gridStyle.gridTemplateRows = '2fr 1fr';
    }

    const getCellStyle = (index: number): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            borderRadius: `${collageSettings.rounding}px`,
            overflow: 'hidden',
        };
        if (collageLayout === '3-mixed-1' && index === 0) {
            baseStyle.gridRow = 'span 2';
        }
        if (collageLayout === '3-mixed-2' && index === 0) {
            baseStyle.gridColumn = 'span 2';
        }
        return baseStyle;
    };

    return (
        <div className="w-full max-w-4xl aspect-square flex items-center justify-center p-4">
            <div ref={ref} className="bg-gray-800/50 w-full h-full" style={{ borderRadius: `${collageSettings.rounding}px` }}>
                <div style={gridStyle}>
                    {Array.from({ length: layoutConfig.count }).map((_, i) => (
                        <div key={i} style={getCellStyle(i)}>
                             <CollageCell
                                index={i}
                                imageFile={collageImages[i] || null}
                                onImageAdd={handleSetCollageImage}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default CollageCanvas;