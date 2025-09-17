/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useCallback } from 'react';
import { UploadIcon } from '../../icons';

interface ImageDropzoneProps {
    imageFile: File | null;
    onFileSelect: (file: File | null) => void;
    label: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ imageFile, onFileSelect, label }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const imageUrl = useMemo(() => {
        if (!imageFile) return null;
        try {
            return URL.createObjectURL(imageFile);
        } catch (e) {
            console.error("Error creating object URL", e);
            return null;
        }
    }, [imageFile]);

    const handleFileChange = useCallback((files: FileList | null) => {
        if (files && files[0]) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files) {
            handleFileChange(e.dataTransfer.files);
        }
    }, [handleFileChange]);

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <h4 className="font-semibold text-gray-300 text-sm">{label}</h4>
            <label
                htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
                className={`relative w-full aspect-square bg-gray-900/50 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    isDraggingOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-500'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                onDrop={handleDrop}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt={label} className="w-full h-full object-contain p-1 rounded-md" />
                ) : (
                    <div className="text-center text-gray-500 p-2">
                        <UploadIcon className="w-8 h-8 mx-auto" />
                        <span className="text-xs mt-1 block">Clique ou arraste</span>
                    </div>
                )}
                <input
                    id={`upload-${label.replace(/\s+/g, '-')}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files)}
                />
            </label>
        </div>
    );
};

export default ImageDropzone;
