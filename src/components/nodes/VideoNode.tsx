import React, { useState, useRef, useEffect } from 'react';
import BaseNode from './BaseNode';
import { NodeMode, NodeType } from '../../types';
import { Upload, Sparkles, RotateCcw, Play, Pause, RefreshCw, Copy } from 'lucide-react';
import { useApiKeys } from '../../contexts/APIKeyContext';
import { generateVideo } from '../../services/apiService';

const VideoNode: React.FC<any> = ({ data, selected }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [endImageDragActive, setEndImageDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endImageFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { falaiKey } = useApiKeys();
  
  // Initialize settings with defaults if not set
  useEffect(() => {
    if (!data.settings) {
      data.updateNodeData({
        settings: {
          negative_prompt: '',
          aspect_ratio: '16:9',
          resolution: '720p',
          cfg_scale: 1,
          guidance_scale: 10,
          num_frames: 180,
          enable_safety_checker: false,
          seed: undefined,
          strength: 0.8,
        }
      });
    }
  }, []);
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle end image file drop
  const handleEndImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEndImageDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEndImageFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Handle end image file selection
  const handleEndImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleEndImageFile(e.target.files[0]);
    }
  };
  
  // Process selected file
  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      data.updateNodeData({
        content,
        uploaded_url: undefined, // Reset uploaded URL when content changes
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Process selected end image file
  const handleEndImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      data.updateNodeData({
        settings: {
          ...data.settings,
          end_image_url: content,
          end_image_uploaded_url: undefined, // Reset uploaded URL when content changes
        }
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Generate video using FAL.AI
  const handleGenerateVideo = async () => {
    if (data.type !== NodeType.VIDEO_GENERATED || !falaiKey) {
      return;
    }
    
    try {
      setIsGenerating(true);
      data.updateNodeData({
        generationStatus: 'generating',
        generationError: undefined,
      });
      
      // Get input from connected nodes
      const connectedInputs = data.getConnectedInputs();
      
      if (connectedInputs.length === 0 && !data.settings?.end_image_url) {
        throw new Error('No input connected and no end image set. Connect a text, image, or video node, or set an end image.');
      }
      
      const textInputs = connectedInputs.filter((input: any) => 
        input.category === 'text' && input.content
      );
      
      const imageInputs = connectedInputs.filter((input: any) => 
        input.category === 'image' && input.content
      );
      
      const videoInputs = connectedInputs.filter((input: any) => 
        input.category === 'video' && input.content
      );
      
      let generatedVideo;
      const textPrompt = textInputs.length > 0 
        ? textInputs[0].content 
        : 'Transform this into a beautiful video sequence';
      
      // Prepare options from settings
      const videoOptions = {
        negative_prompt: data.settings?.negative_prompt || '',
        aspect_ratio: data.settings?.aspect_ratio || '16:9',
        resolution: data.settings?.resolution || '720p',
        cfg_scale: data.settings?.cfg_scale || 1,
        guidance_scale: data.settings?.guidance_scale || 10,
        num_frames: data.settings?.num_frames || 180,
        enable_safety_checker: data.settings?.enable_safety_checker || false,
        seed: data.settings?.seed,
        strength: data.settings?.strength || 0.8,
        end_image_url: data.settings?.end_image_url,
      };
      
      if (videoInputs.length > 0) {
        // Use video2video if we have a video input
        const videoInput = videoInputs[0].content;
        
        // Check if we already have an uploaded URL for this content
        if (data.uploaded_url && data.last_uploaded_content === videoInput) {
          videoOptions.video_url = data.uploaded_url;
          
          generatedVideo = await generateVideo(
            falaiKey, 
            textPrompt, 
            undefined, 
            data.uploaded_url,
            videoOptions
          );
        } else {
          generatedVideo = await generateVideo(
            falaiKey, 
            textPrompt, 
            undefined, 
            videoInput,
            videoOptions
          );
          
          // Store the uploaded URL for future use
          data.updateNodeData({
            uploaded_url: generatedVideo.videoUrl,
            last_uploaded_content: videoInput
          });
        }
      } else if (imageInputs.length > 0) {
        // Use img2video if we have an image input
        const imageInput = imageInputs[0].content;
        
        // Check if we already have an uploaded URL for this content
        if (data.uploaded_url && data.last_uploaded_content === imageInput) {
          generatedVideo = await generateVideo(
            falaiKey, 
            textPrompt, 
            data.uploaded_url,
            undefined,
            videoOptions
          );
        } else {
          generatedVideo = await generateVideo(
            falaiKey, 
            textPrompt, 
            imageInput,
            undefined,
            videoOptions
          );
          
          // Store the uploaded URL for future use
          data.updateNodeData({
            uploaded_url: generatedVideo.imageUrl,
            last_uploaded_content: imageInput
          });
        }
      } else {
        // Use text2video if we have only text input
        generatedVideo = await generateVideo(
          falaiKey, 
          textPrompt,
          undefined,
          undefined,
          videoOptions
        );
      }
      
      data.updateNodeData({
        content: generatedVideo,
        generationStatus: 'success',
        generationSeed: generatedVideo.seed // Store the seed used for generation
      });
      
      // Update the seed setting if one was generated
      if (generatedVideo.seed && !data.settings.seed) {
        data.updateNodeData({
          settings: {
            ...data.settings,
            seed: generatedVideo.seed
          }
        });
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
      data.updateNodeData({
        generationStatus: 'error',
        generationError: error instanceof Error ? error.message : 'Failed to generate video',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Toggle video playback
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Generate a new random seed
  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000000);
    data.updateNodeData({
      settings: {
        ...data.settings,
        seed: newSeed
      }
    });
  };
  
  // Copy current seed to clipboard
  const copySeedToClipboard = () => {
    if (data.settings?.seed) {
      navigator.clipboard.writeText(data.settings.seed.toString())
        .then(() => {
          alert('Seed copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy seed: ', err);
        });
    }
  };
  
  return (
    <BaseNode data={data} selected={selected}>
      <div className="space-y-2">
        {data.content ? (
          <div className="relative">
            <div className="relative w-full h-full bg-slate-800/50 p-2 rounded-lg">
              <video 
                ref={videoRef}
                src={data.content} 
                className="mx-auto max-w-full max-h-[200px] object-contain rounded border border-slate-700"
                loop
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={togglePlayback}
                className="p-2 bg-slate-800/80 rounded-full hover:bg-slate-700/80"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </div>
            {data.mode === NodeMode.STATIC && (
              <button
                onClick={() => {
                  data.updateNodeData({ content: '' });
                }}
                className="absolute top-1 right-1 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-900/20' 
                : 'border-slate-700 hover:border-slate-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            onClick={() => data.mode === NodeMode.STATIC && fileInputRef.current?.click()}
          >
            {data.mode === NodeMode.STATIC ? (
              <>
                <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="text-xs text-slate-400">
                  Click or drop video here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Generated video will appear here
              </p>
            )}
          </div>
        )}
        
        {data.mode === NodeMode.GENERATED && (
          <>
            {/* Seed control */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Seed:</span>
                <span className="text-slate-300 cursor-pointer hover:text-white" onClick={copySeedToClipboard} title="Click to copy">
                  {data.settings?.seed || 'random'}
                </span>
                {data.settings?.seed && (
                  <Copy className="w-3 h-3 text-slate-400 cursor-pointer hover:text-white" onClick={copySeedToClipboard} />
                )}
              </div>
              <button
                onClick={generateRandomSeed}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                title="Generate new seed"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Generation button and status */}
            <div className="flex justify-between">
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !falaiKey}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
              </button>
              
              {data.generationStatus === 'error' && (
                <div className="text-xs text-red-400 truncate" title={data.generationError}>
                  Error: {data.generationError}
                </div>
              )}
              
              {data.content && data.generationStatus === 'success' && (
                <button
                  onClick={() => {
                    data.updateNodeData({
                      content: '',
                      generationStatus: 'idle',
                    });
                  }}
                  className="flex items-center px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </button>
              )}
            </div>

            {/* Advanced Settings - End Image Selector */}
            <div className="mt-2">
              <div className="text-xs font-medium text-slate-400 mb-1">End Image (optional):</div>
              {data.settings?.end_image_url ? (
                <div className="relative mb-2">
                  <img 
                    src={data.settings.end_image_url} 
                    alt="End Image" 
                    className="w-full max-h-[80px] object-contain rounded border border-slate-700"
                  />
                  <button
                    onClick={() => {
                      data.updateNodeData({
                        settings: {
                          ...data.settings,
                          end_image_url: undefined,
                          end_image_uploaded_url: undefined
                        }
                      });
                    }}
                    className="absolute top-1 right-1 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-md p-2 text-center transition-colors mb-2 ${
                    endImageDragActive 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEndImageDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEndImageDragActive(false);
                  }}
                  onDrop={handleEndImageDrop}
                  onClick={() => endImageFileInputRef.current?.click()}
                >
                  <p className="text-xs text-slate-400">
                    Click to add end image
                  </p>
                  <input
                    ref={endImageFileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleEndImageFileChange}
                  />
                </div>
              )}

              {/* Strength slider (only show if end image is set) */}
              {data.settings?.end_image_url && (
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400">Strength:</label>
                    <span className="text-xs text-slate-300">{data.settings.strength || 0.8}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={data.settings.strength || 0.8}
                    onChange={(e) => {
                      data.updateNodeData({
                        settings: {
                          ...data.settings,
                          strength: parseFloat(e.target.value)
                        }
                      });
                    }}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BaseNode>
  );
};

export default VideoNode;