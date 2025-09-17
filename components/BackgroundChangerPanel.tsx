/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
// FIX: Changed import to use the correct, full-featured context from src.
import { useEditor } from '../src/context/EditorContext';
import { LandscapeIcon } from './icons';

const BackgroundChangerPanel: React.FC = () => {
    // FIX: Use the unified `useEditor` hook.
    const { isLoading, handleBackgroundChange } = useEditor()!;
    const [prompt, setPrompt] = useState('');
    
    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        handleBackgroundChange(prompt);
    };

    return (
        <form onSubmit={handleGenerate} className="w-full bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Alterar Fundo com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Descreva o novo cenário para a sua imagem.</p>
            </div>
            
            <div>
                <label htmlFor="bg-change-prompt" className="sr-only">Descrição do Fundo</label>
                <textarea
                    id="bg-change-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: uma praia ensolarada com coqueiros, uma cidade futurista à noite, uma floresta mágica com luzes..."
                    className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[120px]"
                    disabled={isLoading}
                    rows={5}
                />
            </div>

            <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:from-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !prompt.trim()}
            >
                <LandscapeIcon className="w-5 h-5" />
                Alterar Fundo
            </button>
        </form>
    );
};

export default BackgroundChangerPanel;