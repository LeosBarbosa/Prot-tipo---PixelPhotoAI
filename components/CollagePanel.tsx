/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Changed import to use the correct, full-featured context from src.
import { useEditor } from '../src/context/EditorContext';
// FIX: Corrected import path for CollageLayout type.
import { type CollageLayout } from '../types';

const layouts: { id: CollageLayout; name: string; count: number; }[] = [
    { id: '2-vertical', name: '2 Vert.', count: 2 },
    { id: '2-horizontal', name: '2 Horiz.', count: 2 },
    { id: '3-mixed-1', name: '3 Misto 1', count: 3 },
    { id: '3-mixed-2', name: '3 Misto 2', count: 3 },
    { id: '4-grid', name: 'Grade 4', count: 4 },
];

const CollagePanel: React.FC<{ onApply: () => void }> = ({ onApply }) => {
    // FIX: Use the unified `useEditor` hook.
    const {
        isLoading,
        collageLayout,
        setCollageLayout,
        collageImages,
        collageSettings,
        setCollageSettings,
        resetCollage
    } = useEditor()!;

    const currentLayoutConfig = layouts.find(l => l.id === collageLayout)!;
    const filledCells = Object.values(collageImages).filter(img => img !== null).length;
    const isReadyToApply = filledCells === currentLayoutConfig.count;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Criador de Colagem</h3>
                <p className="text-sm text-gray-400 -mt-1">Combine suas imagens em um layout único.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Layout</label>
                <div className="grid grid-cols-3 gap-2">
                    {layouts.map(layout => (
                        <button
                            key={layout.id}
                            onClick={() => setCollageLayout(layout.id)}
                            disabled={isLoading}
                            className={`p-2 rounded-md text-sm font-semibold transition-all duration-200 aspect-square flex items-center justify-center text-center ${collageLayout === layout.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-gray-200'}`}
                        >
                            {layout.name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 flex justify-between">
                    <span>Espaçamento</span>
                    <span className="text-white font-mono">{collageSettings.spacing}px</span>
                </label>
                <input
                    type="range" min="0" max="32"
                    value={collageSettings.spacing}
                    onChange={e => setCollageSettings(s => ({ ...s, spacing: Number(e.target.value) }))}
                    disabled={isLoading} className="w-full"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300 flex justify-between">
                    <span>Bordas Arredondadas</span>
                    <span className="text-white font-mono">{collageSettings.rounding}px</span>
                </label>
                <input
                    type="range" min="0" max="40"
                    value={collageSettings.rounding}
                    onChange={e => setCollageSettings(s => ({ ...s, rounding: Number(e.target.value) }))}
                    disabled={isLoading} className="w-full"
                />
            </div>
            
            <div className="border-t border-gray-700/50 my-2"></div>
            
            <button
                onClick={onApply}
                disabled={isLoading || !isReadyToApply}
                className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Finalizar Colagem
            </button>
            <button
                onClick={resetCollage}
                disabled={isLoading}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm"
            >
                Limpar Tudo
            </button>
        </div>
    );
};

export default CollagePanel;