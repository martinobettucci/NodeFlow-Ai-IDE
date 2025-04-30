import OpenAI from 'openai';
import { fal } from '@fal-ai/client';
import { OpenAIImageResponse, FalVideoResponse } from '../types';
import { toFile, resizeFileTo512 } from './fileUtils';

// OpenAI API functions
export async function testApiKey(type: 'openai' | 'falai', apiKey: string): Promise<boolean> {
  try {
    if (type === 'openai') {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const rsp = await client.models.list();
      return Array.isArray(rsp.data) && rsp.data.length > 0;
    } else if (type === 'falai') {
      fal.config({
        credentials: apiKey,
      });
      
      try {
        await fal.run('fal-ai/text-to-image');
        return true;
      } catch (error) {
        if (error instanceof Error && 
            !error.message.includes('unauthorized') && 
            !error.message.includes('invalid_key')) {
          // If error is not auth-related, consider the key valid
          return true;
        }
        return false;
      }
    }
    return false;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('invalid_key')) {
        console.error(`Invalid ${type} API key:`, error.message);
      } else {
        console.error(`Error testing ${type} API key:`, error.message);
      }
    } else {
      console.error(`Unknown error testing ${type} API key:`, error);
    }
    return false;
  }
}

// Generate text using OpenAI
export async function generateText(apiKey: string, prompt: string): Promise<string> {
  try {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a creative assistant that generates concise, engaging text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
    });
    
    return response.choices[0]?.message.content || '';
  } catch (error) {
    console.error('Failed to generate text:', error);
    throw error;
  }
}

// Generate image using OpenAI
export async function generateImage(
  apiKey: string,
  prompt: string,
  settings: {
    model?: 'dall-e-2' | 'dall-e-3' | 'gpt-image-1';
    size?: string;
    quality?: string;
    style?: 'vivid' | 'natural';
    background?: 'auto' | 'transparent' | 'opaque';
    output_format?: 'png' | 'jpeg' | 'webp';
    output_compression?: number;
    moderation?: 'auto' | 'low';
  } = {},
  imageInputs?: string[],
  mode: 'generate' | 'edit' | 'variations' = 'generate',
  maskImage?: string
): Promise<string> {
  try {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    let response: OpenAIImageResponse;
    const model = settings.model || 'dall-e-3';
    const isGPTImage = model === 'gpt-image-1';
    
    // Only include response_format for DALL-E models
    const baseParams = {
      n: 1,
      size: settings.size || '1024x1024',
      ...(isGPTImage ? {} : { response_format: 'b64_json' }),
      ...(settings.style && { style: settings.style }),
      ...(settings.background && { background: settings.background }),
      ...(settings.output_format && { output_format: settings.output_format }),
      ...(settings.output_compression && { output_compression: settings.output_compression }),
    };
    
    switch (mode) {
      case 'edit':
        if (!imageInputs?.length) throw new Error('Image input required for edit mode');

        // Resize images to 512x512 if needed (OpenAI requirement)
        const resizedImages = await Promise.all(
          imageInputs.map(async (input) => {
            const file = await toFile(input);
            return file.size > 512 * 512 ? await resizeFileTo512(file) : input;
          })
        );
        
        // Convert images and mask to files
        const imageFiles = await Promise.all(
          resizedImages.map(input => toFile(input))
        );
        const maskFile = maskImage ? await toFile(maskImage) : undefined;
        
        // Send all images in one request
        response = await client.images.edit({
          ...baseParams,
          model,
          image: imageFiles,
          ...(maskFile && { mask: maskFile }),
          prompt,
        }) as unknown as OpenAIImageResponse;
        
        break;
        
      case 'variations':
        if (!imageInputs?.length) {
          throw new Error('Image input required for variations');
        }
        
        // For variations, we only use the first image since OpenAI only supports one at a time
        const variationFile = await toFile(imageInputs[0]);
        
        response = await client.images.createVariation({
          ...baseParams,
          model: 'dall-e-2', // Only dall-e-2 supports variations
          image: variationFile,
        }) as unknown as OpenAIImageResponse;
        break;
        
      default: // text-to-image generation
        // Only apply moderation for GPT-4V model
        const moderation = settings.model === 'gpt-image-1' ? settings.moderation : undefined;

        response = await client.images.generate({
          ...baseParams,
          model,
          prompt,
          quality: settings.quality,
          style: settings.style,
          ...(moderation && { moderation }),
        }) as unknown as OpenAIImageResponse;
        break;
    }
    
    if (!response.data[0]?.b64_json) {
      throw new Error('No image data returned from API');
    }
    
    const format = settings.output_format || 'png';
    return `data:image/${format};base64,${response.data[0].b64_json}`;
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw error;
  }
}

// Generate video using FAL.AI
export async function generateVideo(
  apiKey: string,
  prompt: string,
  imageInput?: string,
  videoInput?: string,
  options: {
    negative_prompt?: string,
    aspect_ratio?: '16:9' | '9:16',
    resolution?: '720p' | '480p',
    cfg_scale?: number,
    guidance_scale?: number,
    num_frames?: number,
    enable_safety_checker?: boolean,
    end_image_url?: string,
    strength?: number,
    seed?: number
  } = {}
): Promise<string> {
  try {
    fal.config({
      credentials: apiKey,
    });
    
    // Initialize the request parameters
    let requestParams: any = {
      input: {
        prompt,
        negative_prompt: options.negative_prompt || '',
        aspect_ratio: options.aspect_ratio || '16:9',
        resolution: options.resolution || '720p',
        cfg_scale: options.cfg_scale !== undefined ? options.cfg_scale : 1,
        guidance_scale: options.guidance_scale !== undefined ? options.guidance_scale : 10,
        num_frames: options.num_frames || 180,
        enable_safety_checker: options.enable_safety_checker || false,
      },
      logs: true,
    };
    
    // Set the seed if provided
    if (options.seed !== undefined) {
      requestParams.input.seed = options.seed;
    }
    
    // Handle image upload if needed
    if (imageInput) {
      // Upload image to FAL storage
      try {
        // Convert data URL to a File object
        const file = await toFile(imageInput);
        
        // Upload to FAL storage
        const imageUrl = await fal.storage.upload(file);
        
        requestParams.input.image_url = imageUrl;
      } catch (error) {
        console.error('Error uploading image to FAL storage:', error);
        
        // Fallback to using the data URL directly
        requestParams.input.image_url = imageInput;
      }
    }
    
    // Handle end image upload if needed
    if (options.end_image_url) {
      try {
        // Convert data URL to a File object
        const file = await toFile(options.end_image_url);
        
        // Upload to FAL storage
        const endImageUrl = await fal.storage.upload(file);
        
        requestParams.input.end_image_url = endImageUrl;
        
        // Add strength parameter if specified
        if (options.strength !== undefined) {
          requestParams.input.strength = options.strength;
        }
      } catch (error) {
        console.error('Error uploading end image to FAL storage:', error);
        
        // Fallback to using the data URL directly
        requestParams.input.end_image_url = options.end_image_url;
      }
    }
    
    // Handle video upload if needed
    if (videoInput) {
      try {
        // Convert data URL to a File object
        const file = await toFile(videoInput, 'input.mp4', { type: 'video/mp4' });
        
        // Upload to FAL storage
        const videoUrl = await fal.storage.upload(file);
        
        requestParams.input.video_url = videoUrl;
      } catch (error) {
        console.error('Error uploading video to FAL storage:', error);
        
        // Fallback to using the data URL directly
        requestParams.input.video_url = videoInput;
      }
    }
    
    // Submit the request to the FAL API
    const result = await fal.subscribe('fal-ai/framepack', requestParams);
    
    // Return the video URL
    if (result.data.video && result.data.video.url) {
      return result.data.video.url;
    } else if (result.data.video_url) {
      return result.data.video_url;
    } else if (result.data.b64_json) {
      return `data:video/mp4;base64,${result.data.b64_json}`;
    } else {
      throw new Error('No video data returned from API');
    }
  } catch (error) {
    console.error('Failed to generate video:', error);
    throw error;
  }
}