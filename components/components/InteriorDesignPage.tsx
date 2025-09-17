/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo, useCallback } from 'react';
// FIX: Correct import from context
import { useEditor } from '../context/EditorContext';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { generateInteriorDesign } from '../services/geminiService';
import { dataURLtoFile } from '../utils/imageUtils';
import Spinner from './Spinner';
import { UploadIcon, SparkleIcon, BrushIcon, EyeIcon } from './icons';

const InteriorDesignStartScreen: React.FC<{ onFileSelect: (file: File) => void }> = ({ onFileSelect }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={`w-full max-w-3xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-blue-500/10 border-dashed border-blue-400' : 'border-transparent'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); onFileSelect(e.dataTransfer.files[0]); }}
        >
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl">Reforma de Interiores com IA</h1>
                <p className="max-w-xl text-lg text-gray-400">Envie uma foto do seu espaço, desenhe sobre a área que deseja alterar e deixe nossa IA gerar novas ideias de design em segundos.</p>
                <label htmlFor="interior-upload" className="relative mt-4 inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-full cursor-pointer group hover:bg-blue-500 transition-colors">
                    <UploadIcon className="w-6 h-6 mr-3" />
                    Enviar Foto do Ambiente
                </label>
                <input id="interior-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
        </div>
    );
};

const InteriorDesignPage: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [generatedDesigns, setGeneratedDesigns] = useState<string[]>([]);
    const [roomType, setRoomType] = useState<string>('Sala de Estar');
    const [roomStyle, setRoomStyle] = useState<string>('Moderno');
    const [prompt, setPrompt] = useState<string>('');
    const [brushSize, setBrushSize] = useState(40);

    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useEditor()!;

    const imageRef = useRef<HTMLImageElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);

    const { maskDataUrl, startDrawing, stopDrawing, draw, clearMask } = useMaskCanvas(maskCanvasRef, brushSize);

    const imageUrl = useMemo(() => uploadedImage ? URL.createObjectURL(uploadedImage) : null, [uploadedImage]);

    const handleGenerate = async () => {
        if (!uploadedImage || !maskDataUrl) {
            setError("Por favor, carregue uma imagem e desenhe uma máscara sobre a área a ser alterada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Gerando novo design...");
        try {
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            const resultDataUrl = await generateInteriorDesign(uploadedImage, maskFile, roomType, roomStyle, prompt);
            setGeneratedDesigns(prev => [resultDataUrl, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const handleFileSelect = useCallback((file: File) => {
      setUploadedImage(file);
      setGeneratedDesigns([]);
      clearMask();
      setError(null);
    }, [clearMask, setError]);

    return (
        <div className="w-full h-full flex flex-col md:flex-row animate-fade-in overflow-hidden">
            <aside className="w-full md:w-96 p-4 bg-gray-900/40 border-r border-gray-700/50 flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-xl font-bold text-white text-center">Controles da Reforma</h2>

                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-300">Tipo de Ambiente</label>
                    <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Sala de Estar', 'Quarto', 'Cozinha', 'Banheiro', 'Escritório', 'Sala de Jantar'].map(type => <option key={type} value={type}>{type}</option>)}
                    </select>

                    <label className="block text-sm font-medium text-gray-300">Estilo de Design</label>
                    <select value={roomStyle} onChange={e => setRoomStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                        {['Moderno', 'Minimalista', 'Industrial', 'Boêmio', 'Rústico', 'Contemporâneo', 'Escandinavo'].map(style => <option key={style} value={style}>{style}</option>)}
                    </select>

                    <label className="block text-sm font-medium text-gray-300">Instruções Adicionais</label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Ex: adicione uma planta grande, mude a cor da parede para azul..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base min-h-[100px]"
                        disabled={isLoading}
                    />
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2"><BrushIcon className="w-5 h-5 text-gray-400" /><label htmlFor="brush-size" className="font-medium text-gray-300">Tamanho do Pincel</label></div>
                            <span className="font-mono text-gray-200">{brushSize}</span>
                        </div>
                        <input id="brush-size" type="range" min="10" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading || !uploadedImage} />
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                    <button onClick={handleGenerate} disabled={isLoading || !maskDataUrl} className="w-full bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-5 rounded-lg transition-all disabled:from-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <SparkleIcon className="w-5 h-5" />
                        Gerar Design
                    </button>
                    <button onClick={clearMask} disabled={isLoading || !maskDataUrl} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm disabled:opacity-50">
                        Limpar Seleção
                    </button>
                </div>
            </aside>

            <main className="flex-grow p-4 flex items-center justify-center relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <Spinner />
                        {/* FIX: Use loadingMessage state variable instead of the setter function in JSX. */}
                        <p className="text-gray-300 text-lg font-semibold animate-pulse">{loadingMessage || 'Processando...'}</p>
                    </div>
                )}
                {!uploadedImage && <InteriorDesignStartScreen onFileSelect={handleFileSelect} />}
                {imageUrl && (
                    <div className="w-full h-full flex flex-col gap-4">
                        <div className="relative flex-grow w-full h-full min-h-0 flex items-center justify-center">
                            <img ref={imageRef} src={imageUrl} alt="Base" className="block max-w-full max-h-full object-contain" />
                            {/* FIX: Moved mouse event handlers to the canvas to fix type errors */}
                            <canvas
                                ref={maskCanvasRef}
                                width={imageRef.current?.naturalWidth}
                                height={imageRef.current?.naturalHeight}
                                className="absolute top-0 left-0 w-full h-full opacity-50 cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseMove={draw}
                                onMouseLeave={stopDrawing}
                            />
                        </div>
                        <div className="flex-shrink-0 h-48 bg-black/20 rounded-lg p-2 border border-gray-700/50">
                            <h3 className="text-lg font-semibold mb-2 px-2">Resultados Gerados</h3>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {generatedDesigns.length === 0 && <p className="text-gray-500 px-2">Seus designs aparecerão aqui...</p>}
                                {generatedDesigns.map((src, index) => (
                                    <img key={index} src={src} className="h-32 w-auto rounded-md object-cover flex-shrink-0" alt={`Design Gerado ${index + 1}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InteriorDesignPage;