/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ToolModal from './components/ToolModal';
import StartScreen from './components/StartScreen';
import EditorModalLayout from './components/EditorModalLayout';
import { type ToolId } from './types';

// Import all the tool panels
import SketchRenderPanel from './components/tools/SketchRenderPanel';
import ImageGenPanel from './components/tools/ImageGenPanel';
import CreativeFusionPanel from './components/tools/CreativeFusionPanel';
import OutpaintingPanel from './components/tools/OutpaintingPanel';
import ImageVariationPanel from './components/tools/ImageVariationPanel';
import ProductPhotographyPanel from './components/tools/ProductPhotographyPanel';
import CharacterDesignPanel from './components/tools/CharacterDesignPanel';
import ArchitecturalVizPanel from './components/tools/ArchitecturalVizPanel';
import InteriorDesignPanel from './components/tools/InteriorDesignPanel';
import FaceSwapPanel from './components/tools/FaceSwapPanel';
import AIPortraitPanel from './components/tools/AIPortraitPanel';
import VideoGenPanel from './components/tools/VideoGenPanel';

// Import restored editing panels
import CropPanel from './components/tools/CropPanel';
import StylePanel from './components/tools/StylePanel';
import AdjustmentPanel from './components/tools/AdjustmentPanel';
import GenerativeEditPanel from './components/tools/GenerativeEditPanel';
import RemoveBgPanel from './components/tools/RemoveBgPanel';
import UpscalePanel from './components/tools/UpscalePanel';

// Map Tool IDs to their corresponding components and modal titles
const toolMap: Record<ToolId, { Component: React.FC; title: string }> = {
    // Generation Tools
    sketchRender: { Component: SketchRenderPanel, title: 'Renderização de Esboço' },
    imageGen: { Component: ImageGenPanel, title: 'Gerador de Imagens AI' },
    creativeFusion: { Component: CreativeFusionPanel, title: 'Fusão Criativa' },
    outpainting: { Component: OutpaintingPanel, title: 'Pintura Expansiva (Outpainting)' },
    imageVariation: { Component: ImageVariationPanel, title: 'Variação de Imagem' },
    productPhotography: { Component: ProductPhotographyPanel, title: 'Fotografia de Produto AI' },
    characterDesign: { Component: CharacterDesignPanel, title: 'Design de Personagem' },
    architecturalViz: { Component: ArchitecturalVizPanel, title: 'Visualização Arquitetônica' },
    interiorDesign: { Component: InteriorDesignPanel, title: 'Reforma de Interiores' },
    faceSwap: { Component: FaceSwapPanel, title: 'Troca de Rosto (Face Swap)' },
    aiPortrait: { Component: AIPortraitPanel, title: 'Gerador de Retrato IA' },
    videoGen: { Component: VideoGenPanel, title: 'Gerador de Vídeo AI' },

    // Editing Tools
    crop: { Component: CropPanel, title: 'Cortar e Girar' },
    adjust: { Component: AdjustmentPanel, title: 'Ajustes' },
    style: { Component: StylePanel, title: 'Estilos Artísticos' },
    generativeEdit: { Component: GenerativeEditPanel, title: 'Edição Generativa' },
    removeBg: { Component: RemoveBgPanel, title: 'Removedor de Fundo' },
    upscale: { Component: UpscalePanel, title: 'Melhorar Resolução (Upscale)' },
};

const editingTools: ToolId[] = ['crop', 'adjust', 'style', 'generativeEdit', 'removeBg', 'upscale', 'videoGen'];

const AppContent: React.FC = () => {
    const { activeTool, setActiveTool, currentImage, setInitialImage } = useEditor()!;
    const currentToolInfo = activeTool ? toolMap[activeTool] : null;
    const isEditingToolActive = activeTool ? editingTools.includes(activeTool) : false;

    const handleFileSelect = (files: FileList | null) => {
        if (files && files[0]) {
            setInitialImage(files[0]);
        }
    };
    
    // If an editing tool is selected without an image, show the upload screen.
    // Exception for videoGen which doesn't need an initial image.
    if (isEditingToolActive && !currentImage && activeTool !== 'videoGen') {
        return (
            <div className="h-screen bg-gray-900 text-gray-100 flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StartScreen onFileSelect={handleFileSelect} />
                </main>
            </div>
        );
    }
    
    const closeModal = () => {
        // Reset specific tool states if needed when closing
        setActiveTool(null);
    }

    return (
        <div className="h-screen bg-gray-900 text-gray-100 flex flex-col">
            <Header />
            <main className="flex-grow overflow-y-auto">
                <HomePage />
            </main>
            {currentToolInfo && (
                <ToolModal title={currentToolInfo.title}>
                    {isEditingToolActive ? (
                        <EditorModalLayout controls={<currentToolInfo.Component />} />
                    ) : (
                        <currentToolInfo.Component />
                    )}
                </ToolModal>
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <EditorProvider>
            <AppContent />
        </EditorProvider>
    );
};

export default App;