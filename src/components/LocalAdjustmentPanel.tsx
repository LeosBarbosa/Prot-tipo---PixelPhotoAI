/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Replace deprecated context hooks with the unified useEditor hook.
import { useEditor } from '../context/EditorContext';
import { generateHistogram, applyLUT } from '../utils/imageProcessing';
import ToneCurve from './ToneCurve';

interface LocalAdjustmentPanelProps {
  filters: {
    brightness: number;
    contrast: number;
    saturate: number;
    sepia: number;
    invert: number;
    grayscale: number;
    hueRotate: number;
    blur: number;
  };
  onFilterChange: (filter: keyof LocalAdjustmentPanelProps['filters'], value: number) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading: boolean;
  hasAdjustments: boolean;
}

const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
}> = ({ label, value, min, max, onChange, disabled }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300 flex justify-between">
            <span>{label}</span>
            <span className="text-white font-mono">{value}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full"
        />
    </div>
);


const LocalAdjustmentPanel: React.FC<LocalAdjustmentPanelProps> = ({
  filters,
  onFilterChange,
  onApply,
  onReset,
  isLoading,
  hasAdjustments
}) => {
  // FIX: Use the unified useEditor hook to get context values.
  const { currentImage, setPreviewImageData, previewImageData } = useEditor()!;
  const [activeTool, setActiveTool] = useState<'sliders' | 'curves'>('sliders');
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [histogram, setHistogram] = useState<{ r: number[], g: number[], b: number[] } | null>(null);
  
  // Load original image data and generate histogram when panel opens or image changes
  useEffect(() => {
    if (activeTool !== 'curves' || !currentImage) {
        setOriginalImageData(null);
        setHistogram(null);
        return;
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
      setHistogram(generateHistogram(imageData));
    };
    // FIX: Create an object URL from the File object to set the image source.
    const imageUrl = URL.createObjectURL(currentImage);
    img.src = imageUrl;

    // Cleanup preview on panel close/image change
    return () => {
        URL.revokeObjectURL(imageUrl);
        setPreviewImageData(null);
    }
  }, [currentImage, activeTool, setPreviewImageData]);

  const handleCurveChange = useCallback((lut: number[]) => {
      if (!originalImageData) return;
      // Create a copy to avoid modifying the original data
      const imageDataCopy = new ImageData(
          new Uint8ClampedArray(originalImageData.data),
          originalImageData.width,
          originalImageData.height
      );
      const newImageData = applyLUT(imageDataCopy, lut);
      setPreviewImageData(newImageData);
  }, [originalImageData, setPreviewImageData]);

  const handleReset = () => {
    onReset();
    setPreviewImageData(null);
  }
  
  const handleApply = () => {
    onApply();
    // After applying, the preview is no longer needed as it's part of the history
    setPreviewImageData(null);
  }

  const isApplyDisabled = isLoading || (!hasAdjustments && !previewImageData);

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
        <div className="flex w-full max-w-sm mx-auto bg-gray-900/50 border border-gray-600 rounded-lg p-1">
            <button onClick={() => setActiveTool('sliders')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm ${activeTool === 'sliders' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                Ajustes
            </button>
            <button onClick={() => setActiveTool('curves')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm ${activeTool === 'curves' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                Curvas
            </button>
        </div>
        
        {activeTool === 'sliders' && (
            <div className="animate-fade-in space-y-3">
                <p className="text-sm text-center text-gray-400">
                    Ajuste sua imagem em tempo real com filtros CSS.
                </p>
                <Slider label="Brilho" value={filters.brightness} min={0} max={200} onChange={e => onFilterChange('brightness', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Contraste" value={filters.contrast} min={0} max={200} onChange={e => onFilterChange('contrast', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Saturação" value={filters.saturate} min={0} max={200} onChange={e => onFilterChange('saturate', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Girar Matiz" value={filters.hueRotate} min={0} max={360} onChange={e => onFilterChange('hueRotate', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Desfoque" value={filters.blur} min={0} max={20} onChange={e => onFilterChange('blur', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Sépia" value={filters.sepia} min={0} max={100} onChange={e => onFilterChange('sepia', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Escala de Cinza" value={filters.grayscale} min={0} max={100} onChange={e => onFilterChange('grayscale', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Inverter" value={filters.invert} min={0} max={100} onChange={e => onFilterChange('invert', Number(e.target.value))} disabled={isLoading} />
            </div>
        )}

        {activeTool === 'curves' && (
             <div className="animate-fade-in">
                <p className="text-sm text-center text-gray-400 mb-4">
                    Ajuste os tons da imagem arrastando os pontos da curva.
                </p>
                <ToneCurve
                    histogram={histogram}
                    onCurveChange={handleCurveChange}
                    onReset={() => setPreviewImageData(null)}
                    disabled={isLoading}
                />
            </div>
        )}


        <div className="border-t border-gray-700 my-2"></div>
        
        <div className="flex gap-2 mt-2">
            <button
                onClick={handleReset}
                disabled={isApplyDisabled}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Resetar
            </button>
            <button
                onClick={handleApply}
                disabled={isApplyDisabled}
                className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                Aplicar
            </button>
        </div>
    </div>
  );
};

export default LocalAdjustmentPanel;