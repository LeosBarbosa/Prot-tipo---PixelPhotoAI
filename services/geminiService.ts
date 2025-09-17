/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// FIX: Corrected import from @google/genai
import { GoogleGenAI, GenerateContentResponse, Modality, Part } from "@google/genai";
import { fileToDataURL } from '../utils/imageUtils';
import { type PixelCrop } from 'react-image-crop';
import { createMaskFromCrop } from '../utils/imageUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToPart = async (file: File): Promise<Part> => {
    const dataUrl = await fileToDataURL(file);
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Request blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Image generation stopped unexpectedly. Reason: ${finishReason}.`);
    }
    
    // FIX: Access the text property directly from the response.
    const textFeedback = response.text?.trim();
    throw new Error(`The AI model did not return an image. ` + 
        (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can be due to safety filters. Try rephrasing your prompt."));
};

// --- GENERATIVE TOOLS ---

export const renderSketch = async (sketchImage: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(sketchImage);
    const textPart = { text: `You are an architectural/product rendering AI. Use the provided sketch image as the structural and compositional base. Apply the following style and details described in the prompt: "${prompt}". The result should be a photorealistic image that respects the lines and shapes of the original sketch. Return ONLY the final rendered image.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const outpaintImage = async (image: File, prompt: string, newAspectRatio: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `You are an outpainting AI. The provided image is the center of a larger scene. Expand the image to fill a new aspect ratio of ${newAspectRatio}, generating content that seamlessly integrates with the original image in style, lighting, and context. Use this description to guide the expansion: "${prompt}". Return ONLY the final expanded image.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const fuseImages = async (imageA: File, imageB: File): Promise<string> => {
    const imageAPart = await fileToPart(imageA);
    const imageBPart = await fileToPart(imageB);
    const textPart = { text: `You are an artistic fusion AI. The first image is the 'Composition', the second is the 'Style'. Combine the stylistic and thematic elements of the Style image with the compositional elements of the Composition image to create a new, cohesive image. The result should be a creative and harmonious fusion of the two inputs. Return ONLY the final image.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imageAPart, imageBPart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateImageVariation = async (image: File, strength: number): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Create a creative variation of the provided image. Maintain the main subject and overall composition, but introduce new textures, lighting, or background details to offer a fresh perspective. The strength of the variation should be approximately ${strength}%. Return ONLY the final image.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateImageFromText = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as any,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateProductPhoto = async (productImage: File, prompt: string): Promise<string> => {
    const imagePart = await fileToPart(productImage);
    const textPart = { text: `You are an AI product photographer. The provided image contains an object with a simple or non-existent background. Your task is to place this object into a new professional photographic setting described as: "${prompt}". The result should be photorealistic, with studio lighting, soft shadows, and a background that complements the product. Return ONLY the final composed image.` };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateCharacter = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a full-body character design, standing, with a white background, based on the following description: ${prompt}.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '9:16',
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateInteriorDesign = async (
      baseImage: File,
      maskImage: File,
      roomType: string,
      roomStyle: string,
      userPrompt: string
): Promise<string> => {
      const baseImagePart = await fileToPart(baseImage);
      const maskImagePart = await fileToPart(maskImage);
      const prompt = `You are an expert AI in interior design and renovation. Task: Redesign and fill the selected area (indicated by the white mask) of the base image. Environment Context: The space is a ${roomType}. Desired Style: Apply a ${roomStyle} style. Additional User Instructions: "${userPrompt}". Critical Rules: 1. Fill ONLY the masked area. Keep the rest of the original image completely intact. 2. The integration must be photorealistic, respecting the existing lighting, shadows, and perspective of the base image. 3. The final result should be only the complete, redesigned image.`;
      const textPart = { text: prompt };
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [baseImagePart, maskImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });
      return handleApiResponse(response); 
};

export const faceSwap = async (sourceImage: File, targetImage: File): Promise<string> => {
    const sourcePart = await fileToPart(sourceImage);
    const targetPart = await fileToPart(targetImage);
    const prompt = `You are a face swap specialist. You will receive two images. The first image is the 'source' (containing the face to be used) and the second is the 'target'. Your task is to replace the face of the main person in the target image with the face of the person in the source image. The result should be extremely realistic, blending the source face seamlessly with the body, skin tone, and lighting of the target image. Preserve the expression and angle of the source face as much as possible. Return only the final edited image.`;
    const textPart = { text: prompt };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [sourcePart, targetPart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateProfessionalPortrait = async (originalImage: File): Promise<string> => {
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a corporate portrait photography specialist. Your task is to transform the provided image into a professional business headshot. Keep the person's identity and facial features intact. Replace the clothing with an elegant business suit or blazer. Change the background to a professional, neutral studio background (like blurred gray or blue). Apply studio lighting that enhances the person's features. The final result should be photorealistic and high-quality. Return ONLY the final edited image.`;
    const textPart = { text: prompt };
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateVideo = async (prompt: string, aspectRatio: string): Promise<string> => {
    console.log(`Simulating video generation for prompt: "${prompt}" with aspect ratio: ${aspectRatio}`);
    // Simulate a long API call (e.g., 5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Return a hardcoded dummy video URL as requested
    const dummyVideoUrl = "https://storage.googleapis.com/web-dev-assets/video-api-demo/20240506_145034_355_A_high-quality_realistic_video_of_a_man_in_a_suit_walking_through_a_busy_city_street.mp4";
    
    // Simulate a potential error for testing
    if (prompt.toLowerCase().includes("error")) {
        throw new Error("Simulated video generation failed as requested.");
    }
    
    return dummyVideoUrl;
};


// --- EDITING TOOLS ---

export const removeBackground = async (image: File): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: 'Remove the background from this image, leaving only the main subject. The output should be a PNG with a transparent background.' };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const applyStyle = async (image: File, stylePrompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Redraw this entire image in the following artistic style: "${stylePrompt}". Preserve the original composition and subjects.` };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateAdjustedImage = async (image: File, adjustmentPrompt: string): Promise<string> => {
    const imagePart = await fileToPart(image);
    const textPart = { text: `Apply the following adjustment to this image: "${adjustmentPrompt}". Preserve the original content and composition.` };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generativeEdit = async (
    baseImage: File,
    prompt: string,
    mode: 'fill' | 'remove' | 'compose',
    options?: { maskImage?: File, secondImage?: File }
): Promise<string> => {
    const parts: Part[] = [await fileToPart(baseImage)];
    let textPrompt = '';

    switch (mode) {
        case 'fill':
            if (!options?.maskImage) throw new Error("Mask is required for fill mode.");
            parts.push(await fileToPart(options.maskImage));
            textPrompt = `Generatively fill the masked area of the image with: "${prompt}". Match the style and lighting of the original image.`;
            break;
        case 'remove':
            if (!options?.maskImage) throw new Error("Mask is required for remove mode.");
            parts.push(await fileToPart(options.maskImage));
            textPrompt = `Generatively remove the object in the masked area. Fill the space with realistic background content that matches the surrounding pixels.`;
            break;
        case 'compose':
            if (!options?.secondImage) throw new Error("Second image is required for compose mode.");
            parts.push(await fileToPart(options.secondImage));
            textPrompt = `Combine these two images based on the following instructions: "${prompt}".`;
            break;
    }
    parts.push({ text: textPrompt });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const upscaleImage = async (image: File, factor: number, preserveFace: boolean): Promise<string> => {
    const imagePart = await fileToPart(image);
    const prompt = `Upscale this image by a factor of ${factor}x. Enhance details and sharpness. ${preserveFace ? 'Pay special attention to preserving and enhancing facial features realistically.' : ''}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateMask = async (image: File): Promise<string> => {
    const imagePart = await fileToPart(image);
    const prompt = 'Analyze this image and generate a black and white mask of the most prominent subject. The subject should be white and the background black. Return only the mask image.';
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};