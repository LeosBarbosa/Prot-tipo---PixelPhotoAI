/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file is now the single source of truth for all type definitions in the application.

// Editor-wide types
export type Tab = 'extract' | 'adjust' | 'filter' | 'effects' | 'transform' | 'collage' | 'video' | 'ai-tools';
export type CompareMode = 'single' | 'split' | 'side-by-side';

// Transform Panel types
export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

// Enhancement Panel types
export type SharpenMode = 'light' | 'standard' | 'strong';

// Collage Panel types
export type CollageLayout = '2-vertical' | '2-horizontal' | '3-mixed-1' | '3-mixed-2' | '4-grid';

// Video Panel types
export type VideoAspectRatio = '16:9' | '1:1' | '9:16';

// FIX: Pruned ToolId to only include tools that are actually implemented and present in App.tsx's toolMap.
export type ToolId =
  // Generation Tools
  | 'sketchRender'
  | 'imageGen'
  | 'creativeFusion'
  | 'outpainting'
  | 'imageVariation'
  | 'productPhotography'
  | 'characterDesign'
  | 'architecturalViz'
  | 'interiorDesign'
  | 'faceSwap'
  | 'aiPortrait'
  | 'videoGen'
  // Editing Tools
  | 'crop'
  | 'adjust'
  | 'style'
  | 'generativeEdit'
  | 'removeBg'
  | 'upscale';
