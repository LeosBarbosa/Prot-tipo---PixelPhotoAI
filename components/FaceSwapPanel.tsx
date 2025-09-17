/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
// FIX: Changed import to use the correct, full-featured context from src.
import { useEditor } from '../src/context/EditorContext';
import { UploadIcon, FaceSmileIcon } from './icons';

const ImageSlot: React.FC<{
    label: string;
    imageFile: File | null;
    onFileSelect: (file: File) => void;
    isLoading: boolean;
}> = ({ label, imageFile, onFileSelect, isLoading }) => {
    const imageUrl = useMemo(() => {
        if (!imageFile) return null;
        try {
            return URL.createObjectURL(imageFile);
        } catch (e) {
            console.error("Error creating object URL", e);
            return null;
        }
    }, [imageFile]);

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <h4 className="font-semibold text-gray-300 text-sm">{label}</h4>
            <label className="relative w-full aspect-square bg-gray-900/50 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                {imageUrl ? (
                    <img src={imageUrl} alt={label} className="w-full h-full object-contain p-1 rounded-md" />
                ) : (
                    <div className="text-center text-gray-500 p-2">
                        <UploadIcon className="w-8 h-8 mx-auto" />
                        <span className="text-xs mt-1 block">Clique ou arraste</span>
                    </div>
                )}
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            onFileSelect(e.target.files[0]);
                        }
                    }}
                    disabled={isLoading}
                />
            </label>
        </div>
    );
};

const FaceSwapPanel: React.FC = () => {
    // FIX: Use the unified `useEditor` hook.
    const { isLoading, currentImage, faceSwapSourceImage, setFaceSwapSourceImage, handleFaceSwap } = useEditor()!;

    const isReady = currentImage && faceSwapSourceImage;

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Troca de Rosto (Face Swap)</h3>
                <p className="text-sm text-gray-400 -mt-1">Selecione a imagem de origem (com o rosto) e a imagem alvo.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ImageSlot
                    label="Rosto de Origem"
                    imageFile={faceSwapSourceImage}
                    onFileSelect={(file) => setFaceSwapSourceImage(file)}
                    isLoading={isLoading}
                />
                <ImageSlot
                    label="Imagem Alvo"
                    imageFile={currentImage}
                    onFileSelect={() => { /* currentImage is handled by main upload */ }}
                    isLoading={isLoading}
                />
            </div>
            
             <p className="text-xs text-center text-gray-500 -mt-2">A imagem alvo é a imagem principal que você carregou no editor.</p>

            <button
                onClick={handleFaceSwap}
                className="w-full mt-2 bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:from-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !isReady}
            >
                <FaceSmileIcon className="w-5 h-5" />
                Trocar Rostos
            </button>
        </div>
    );
};

export default FaceSwapPanel;