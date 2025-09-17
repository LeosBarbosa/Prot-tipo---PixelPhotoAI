/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BrushIcon } from './icons';
// FIX: Replace multiple deprecated hooks with the single `useEditor` hook.
import { useEditor } from '../context/EditorContext';

interface GenerativeFillPanelProps {
  onApply: () => void;
  isLoading: boolean;
  prompt: string;
  setPrompt: (prompt: string) => void;
  maskDataUrl: string | null;
  clearSelection: () => void;
}

const GenerativeFillPanel: React.FC<GenerativeFillPanelProps> = ({
  onApply,
  isLoading,
  prompt,
  setPrompt,
  maskDataUrl,
  clearSelection,
}) => {
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onApply();
  };

  const isGenerateDisabled = isLoading || !maskDataUrl || !prompt.trim();

  return (
    <form onSubmit={handleGenerate} className="w-full bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-300">Preenchimento com IA</h3>
        <p className="text-sm text-gray-400 -mt-1">
          {maskDataUrl
            ? 'Descreva o que você quer adicionar ou alterar na área selecionada.'
            : 'Use o mouse para selecionar uma área na imagem que você deseja alterar.'
          }
        </p>
      </div>

      {maskDataUrl ? (
        <div className="animate-fade-in flex flex-col gap-4">
          <textarea
            id="gen-fill-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: um chapéu de pirata, um dragão voando no céu..."
            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px]"
            disabled={isLoading}
            rows={4}
          />
          <div className="flex gap-2">
             <button
                type="button"
                onClick={clearSelection}
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

export default GenerativeFillPanel;