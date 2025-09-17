/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { BrushIcon } from '../icons';

const GenerativeEditPanel: React.FC = () => {
    const {
        isLoading,
        prompt,
        setPrompt,
        maskDataUrl,
        clearMask,
        handleGenerativeEdit,
        brushSize,
        setBrushSize,
    } = useEditor();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerativeEdit();
  };

  const isGenerateDisabled = isLoading || !maskDataUrl || !prompt.trim();

  return (
    <form onSubmit={handleGenerate} className="w-full flex flex-col gap-4 animate-fade-in">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300">Edição Generativa</h3>
            <p className="text-sm text-gray-400 -mt-1">
                {maskDataUrl
                ? 'Descreva o que adicionar na área selecionada.'
                : 'Use o mouse para selecionar uma área para alterar.'
                }
            </p>
        </div>
        
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
                <label htmlFor="brush-size" className="font-medium text-gray-300">Tamanho do Pincel</label>
                <span className="font-mono text-gray-200">{brushSize}</span>
            </div>
            <input id="brush-size" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
        </div>

        {maskDataUrl ? (
            <div className="animate-fade-in flex flex-col gap-4">
            <textarea
                id="gen-fill-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: um chapéu de pirata, um dragão voando..."
                className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px]"
                disabled={isLoading}
                rows={4}
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={clearMask}
                    disabled={isLoading}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                >
                    Limpar Seleção
                </button>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
                    disabled={isGenerateDisabled}
                >
                    <BrushIcon className="w-5 h-5" />
                    Gerar
                </button>
            </div>
            </div>
        ) : (
            <div className="text-center text-gray-400 text-base p-6 bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-700">
                Selecione uma área para começar
            </div>
        )}
    </form>
  );
};

export default GenerativeEditPanel;
