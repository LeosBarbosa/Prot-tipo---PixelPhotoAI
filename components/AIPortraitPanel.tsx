/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Changed import to use the correct, full-featured context from src.
import { useEditor } from '../src/context/EditorContext';
import { FaceSmileIcon } from './icons';

const AIPortraitPanel: React.FC = () => {
    // FIX: Use the unified `useEditor` hook.
    const { isLoading, handleGeneratePortrait } = useEditor()!;

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm max-w-lg mx-auto">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Gerador de Retrato IA</h3>
                <p className="text-sm text-gray-400 mt-1">Transforme sua selfie casual em um retrato de negócios profissional com apenas um clique.</p>
            </div>

            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA manterá suas características faciais, mas irá gerar novas roupas, um novo fundo e iluminação profissional para criar o retrato perfeito.
            </p>

            <button
                onClick={handleGeneratePortrait}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <FaceSmileIcon className="w-5 h-5" />
                Gerar Retrato Profissional
            </button>
        </div>
    );
};

export default AIPortraitPanel;