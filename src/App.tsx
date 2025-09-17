/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { EditorProvider } from './context/EditorContext';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import MainViewer from './components/MainViewer';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import DownloadModal from './components/DownloadModal';
import { useEditor } from './context/EditorContext';

const EditorUI: React.FC = () => {
    const context = useEditor();
    
    // Fallback for context loading or errors during initialization
    if (!context) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const {
        currentImage,
        isHistoryLoading,
        error,
        setError,
        setInitialImage,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
    } = context;

    const handleFileSelect = (files: FileList | null) => {
        if (files && files[0]) {
            setInitialImage(files[0]);
        }
    };

    const renderContent = () => {
        if (isHistoryLoading) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <Spinner />
                </div>
            );
        }
        if (error) {
            return (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold text-red-300">Ocorreu um Erro</h2>
                        <p className="text-md text-red-400">{error}</p>
                        <button onClick={() => setError(null)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors">Tentar Novamente</button>
                    </div>
                </div>
            );
        }
        if (!currentImage) {
            return (
                 <div className="w-full h-full flex items-center justify-center p-4">
                    <StartScreen onFileSelect={handleFileSelect} />
                </div>
            );
        }
        
        return (
          <div className="w-full h-full flex flex-col lg:flex-row animate-fade-in overflow-hidden">
                <LeftPanel />
                <MainViewer />
                <RightPanel />
          </div>
        );
    };

    return (
        <div className="h-screen text-gray-100 flex flex-col bg-gray-900">
            <Header />
            <main className="flex-grow w-full max-w-[1920px] mx-auto flex overflow-hidden">
                {renderContent()}
            </main>
            {currentImage && (
                <DownloadModal 
                    isOpen={isDownloadModalOpen} 
                    onClose={() => setIsDownloadModalOpen(false)} 
                    imageFile={currentImage} 
                />
            )}
        </div>
    )
};

const App: React.FC = () => {
    return (
        <EditorProvider>
            <EditorUI />
        </EditorProvider>
    );
};

export default App;