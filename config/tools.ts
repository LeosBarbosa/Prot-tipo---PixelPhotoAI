/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
    BrushIcon, PhotoIcon, LayersIcon, SparkleIcon,
    LandscapeIcon, FaceSmileIcon, VideoCameraIcon,
    AdjustmentsHorizontalIcon, CropIcon, PaletteIcon,
    ScissorsIcon, ArrowUpOnSquareIcon
} from '../components/icons';
import { type ToolId } from '../types';

export type ToolCategory = 'generation' | 'workflow' | 'editing';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: ToolCategory;
}

export const tools: ToolConfig[] = [
    // Generation Tools
    {
        id: 'imageGen',
        name: 'Gerador de Imagens AI',
        description: 'Crie imagens únicas a partir de descrições de texto detalhadas.',
        icon: React.createElement(PhotoIcon, { className: 'w-8 h-8 text-purple-400' }),
        category: 'generation',
    },
    {
        id: 'sketchRender',
        name: 'Renderização de Esboço',
        description: 'Transforme seus desenhos e esboços em imagens realistas com IA.',
        icon: React.createElement(BrushIcon, { className: 'w-8 h-8 text-blue-400' }),
        category: 'generation',
    },
    {
        id: 'characterDesign',
        name: 'Design de Personagem',
        description: 'Desenvolva conceitos de personagens para jogos, histórias e mais.',
        icon: React.createElement(FaceSmileIcon, { className: 'w-8 h-8 text-cyan-400' }),
        category: 'generation',
    },
    {
        id: 'videoGen',
        name: 'Gerador de Vídeo AI',
        description: 'Crie vídeos curtos e clipes animados a partir de texto.',
        icon: React.createElement(VideoCameraIcon, { className: 'w-8 h-8 text-red-400' }),
        category: 'generation',
    },
    {
        id: 'imageVariation',
        name: 'Variação de Imagem',
        description: 'Crie múltiplas versões e estilos a partir de uma única imagem.',
        icon: React.createElement(LayersIcon, { className: 'w-8 h-8 text-green-400' }),
        category: 'generation',
    },
    {
        id: 'productPhotography',
        name: 'Fotografia de Produto AI',
        description: 'Gere fotos de produtos com qualidade de estúdio em qualquer cenário.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-yellow-400' }),
        category: 'generation',
    },

    // Workflows
    {
        id: 'interiorDesign',
        name: 'Reforma de Interiores',
        description: 'Visualize novos estilos de design em suas próprias fotos.',
        icon: React.createElement(LandscapeIcon, { className: 'w-8 h-8 text-teal-400' }),
        category: 'workflow',
    },
    {
        id: 'architecturalViz',
        name: 'Visualização Arquitetônica',
        description: 'Crie renderizações de alta qualidade para projetos arquitetônicos.',
        icon: React.createElement(VideoCameraIcon, { className: 'w-8 h-8 text-orange-400' }),
        category: 'workflow',
    },
    {
        id: 'creativeFusion',
        name: 'Fusão Criativa',
        description: 'Combine a composição de uma imagem com o estilo de outra.',
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: 'w-8 h-8 text-pink-400' }),
        category: 'workflow',
    },
    {
        id: 'outpainting',
        name: 'Pintura Expansiva',
        description: 'Amplie suas imagens expandindo o quadro em qualquer direção.',
        icon: React.createElement(PhotoIcon, { className: 'w-8 h-8 text-indigo-400' }),
        category: 'workflow',
    },
    {
        id: 'faceSwap',
        name: 'Troca de Rosto',
        description: 'Substitua o rosto em uma foto pelo de outra de forma realista.',
        icon: React.createElement(FaceSmileIcon, { className: 'w-8 h-8 text-red-400' }),
        category: 'workflow',
    },
    {
        id: 'aiPortrait',
        name: 'Gerador de Retrato IA',
        description: 'Transforme fotos casuais em retratos profissionais com IA.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-rose-400' }),
        category: 'workflow',
    },

    // Editing Tools
    {
        id: 'crop',
        name: 'Cortar e Girar',
        description: 'Ajuste o enquadramento, a proporção e a orientação da sua imagem.',
        icon: React.createElement(CropIcon, { className: 'w-8 h-8 text-lime-400' }),
        category: 'editing',
    },
    {
        id: 'adjust',
        name: 'Ajustes Manuais',
        description: 'Controle fino de brilho, contraste, saturação e outras propriedades.',
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: 'w-8 h-8 text-gray-400' }),
        category: 'editing',
    },
    {
        id: 'style',
        name: 'Estilos Artísticos',
        description: 'Transforme sua foto com estilos de arte famosos usando IA.',
        icon: React.createElement(PaletteIcon, { className: 'w-8 h-8 text-amber-400' }),
        category: 'editing',
    },
    {
        id: 'generativeEdit',
        name: 'Edição Generativa',
        description: 'Selecione uma área para remover, adicionar ou alterar objetos com texto.',
        icon: React.createElement(BrushIcon, { className: 'w-8 h-8 text-fuchsia-400' }),
        category: 'editing',
    },
    {
        id: 'removeBg',
        name: 'Removedor de Fundo',
        description: 'Isole o objeto principal da sua imagem com um clique.',
        icon: React.createElement(ScissorsIcon, { className: 'w-8 h-8 text-sky-400' }),
        category: 'editing',
    },
    {
        id: 'upscale',
        name: 'Melhorar Resolução',
        description: 'Aumente a resolução e a nitidez da imagem sem perder qualidade.',
        icon: React.createElement(ArrowUpOnSquareIcon, { className: 'w-8 h-8 text-emerald-400' }),
        category: 'editing',
    },
];