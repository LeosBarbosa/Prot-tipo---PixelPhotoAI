/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';

/**
 * Converts a data URL string into a File object.
 * @param dataurl The data URL string to convert.
 * @param filename The name of the file to be created.
 * @returns A File object.
 */
export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

/**
 * Converts a File object into a data URL string.
 * @param file The File object to convert.
 * @returns A Promise that resolves with the data URL string.
 */
export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

/**
 * Creates a mask image data URL from a crop selection.
 * @param crop The pixel crop object.
 * @param imageWidth The natural width of the original image.
 * @param imageHeight The natural height of the original image.
 * @returns A data URL string of the mask image.
 */
export const createMaskFromCrop = (crop: PixelCrop, imageWidth: number, imageHeight: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    // The mask should be white for the selected area and black for the rest.
    // For simplicity with the Gemini API, often just the filled area on a transparent canvas is enough.
    // Let's create a full-size mask as it's more robust.
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, imageWidth, imageHeight);
    ctx.fillStyle = 'white';
    ctx.fillRect(crop.x, crop.y, crop.width, crop.height);
    return canvas.toDataURL('image/png');
};
