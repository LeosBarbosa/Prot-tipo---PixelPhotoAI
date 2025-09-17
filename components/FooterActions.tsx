/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { UndoIcon, RedoIcon, UploadIcon, DownloadIcon } from './icons';

const FooterActions: React.FC = React.memo(() => {
    const {
        handleUploadNew,
        currentImage,
        originalImage,
        canUndo,
        canRedo,
        undo,
        redo,
        resetHistory,
    } = useEditor()!;

    const handleDownload = () => {
        if (!currentImage) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(currentImage);
        link.download = `pixshop-edit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <footer className="p-4 border-t border-gray-700/50 bg-gray-900/50 flex flex-col items-center justify-center gap-2 mt-auto flex-shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <button onClick={undo} disabled={!canUndo} className={`flex items-center justify-center text-center bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Desfazer"><UndoIcon className="w-4 h-4 mr-2" />Desfazer</button>
                <button onClick={redo} disabled={!canRedo} className={`flex items-center justify-center text-center bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Refazer"><RedoIcon className="w-4 h-4 mr-2" />Refazer</button>
                <button onClick={resetHistory} disabled={!originalImage || originalImage === currentImage} className={`text-center bg-transparent border border-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>Resetar</button>
            </div>
            <div className="flex w-full gap-2 mt-2">
                <button onClick={handleUploadNew} className="w-1/2 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-3 px-5 rounded-md transition-colors text-sm"><UploadIcon className="w-5 h-5" />Nova Imagem</button>
                <button onClick={handleDownload} disabled={!currentImage} className="w-1/2 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-5 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Baixar
                </button>
            </div>
        </footer>
    );
});

export default FooterActions;
