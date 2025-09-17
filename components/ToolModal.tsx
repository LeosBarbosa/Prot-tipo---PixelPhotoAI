/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../context/EditorContext';
import { CloseIcon } from './icons';

interface ToolModalProps {
    title: string;
    children: React.ReactNode;
}

const ToolModal: React.FC<ToolModalProps> = ({ title, children }) => {
    const { setActiveTool } = useEditor()!;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setActiveTool(null)}>
            <div 
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-7xl h-full flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={() => setActiveTool(null)} className="p-2 rounded-full hover:bg-gray-700/80 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
export default ToolModal;
