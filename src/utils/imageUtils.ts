/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';

/**
 * Cria uma imagem de máscara em data URL a partir de uma seleção de corte.
 * @param crop O objeto de corte de pixel.
 * @param imageWidth A largura natural da imagem original.
 * @param imageHeight A altura natural da imagem original.
 * @returns Uma string data URL da imagem de máscara.
 */
export const createMaskFromCrop = (crop: PixelCrop, imageWidth: number, imageHeight: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = 'white';
    ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
    return canvas.toDataURL('image/png');
};
