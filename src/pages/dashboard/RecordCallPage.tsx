import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MicIcon, PauseIcon, HopIcon as StopIcon, UploadIcon, FileAudioIcon } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  clientName: z.string().min(2, { message: 'Client name is required' }),
});

type FormData = z.infer<typeof schema>;

export default function RecordCallPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('record');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = useSupabase();
  const { error, success } = useToast();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // Handle file uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        // Create a URL for the audio file
        const url = URL.createObjectURL(acceptedFiles[0]);
        setAudioURL(url);
        setAudioBlob(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const message = fileRejections[0]?.errors[0]?.message || 'File upload failed';
      error(message);
    },
  });

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      error(err.message || 'Could not start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      // We don't set isRecording to false here, just pause the recording
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudio = async (data: FormData) => {
    if (!audioBlob) {
      error('No audio to process');
      return;
    }

    try {
      setIsProcessing(true);
      // Start progress simulation
      let progressValue = 0;
      const interval = setInterval(() => {
        progressValue += 5;
        if (progressValue > 95) {
          clearInterval(interval);
        } else {
          setProgress(progressValue);
        }
      }, 300);

      // Prepare file for upload
      const file = uploadedFile || new File([audioBlob], `recording-${Date.now()}.wav`, { 
        type: 'audio/wav' 
      });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `calls/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('audio').getPublicUrl(filePath);
      
      // Create record in database
      const { data: callData, error: dbError } = await supabase
        .from('calls')
        .insert([
          {
            title: data.title,
            client_name: data.clientName,
            audio_url: urlData.publicUrl,
            duration: recordingTime,
            status: 'processing'
          }
        ])
        .select()
        .single();
      
      if (dbError) throw dbError;

      // Simulate API call to OpenAI for transcription
      // In production, this would be a real API call to an edge function
      // that handles the transcription process
      
      // Clear interval and set progress to 100%
      clearInterval(interval);
      setProgress(100);
      
      // Wait a bit for visual feedback
      setTimeout(() => {
        success('Call uploaded and processing started');
        // Redirect to the call detail page
        if (callData?.id) {
          navigate(`/call/${callData.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1000);
      
    } catch (err: any) {
      error(err.message || 'Failed to process audio');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Record or Upload a Call</h1>
        <p className="text-gray-600 mt-1">
          Record a new call or upload an existing audio file to analyze
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Tabs 
          defaultValue="record" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="record">Record Call</TabsTrigger>
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
          </TabsList>
          
          {/* Record Tab */}
          <TabsContent value="record" className="space-y-6 py-4">
            <div className="text-center">
              {!audioURL && (
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <MicIcon className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-gray-600 mb-4">
                    Click the button below to start recording your call
                  </p>
                  
                  <div className="flex justify-center gap-3">
                    {!isRecording ? (
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <MicIcon className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={pauseRecording}
                          size="lg"
                          variant="outline"
                        >
                          <PauseIcon className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          variant="destructive"
                        >
                          <StopIcon className="h-5 w-5 mr-2" />
                          Stop Recording
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {isRecording && (
                <div className="mt-6 text-center">
                  <div className="text-2xl font-semibold text-primary animate-pulse">
                    Recording... {formatTime(recordingTime)}
                  </div>
                </div>
              )}

              {audioURL && !isRecording && (
                <div className="mt-6">
                  <p className="mb-3 font-medium">Recording Preview</p>
                  <audio src={audioURL} controls className="w-full mb-4" />
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAudioURL(null);
                        setAudioBlob(null);
                        setRecordingTime(0);
                      }}
                    >
                      Discard and Record Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6 py-4">
            <div className="text-center">
              {!uploadedFile ? (
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <UploadIcon className="h-12 w-12 text-gray-400" />
                    <div className="text-center">
                      <p className="text-lg font-medium">
                        {isDragActive ? 'Drop the audio file here' : 'Drag and drop your audio file here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or click to browse (MP3, WAV, M4A up to 50MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg flex items-center">
                    <FileAudioIcon className="h-10 w-10 text-primary mr-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setAudioURL(null);
                        setAudioBlob(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {audioURL && (
                    <div className="mb-6">
                      <p className="mb-2 font-medium">Audio Preview</p>
                      <audio src={audioURL} controls className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Form section - shown when audio is available */}
        {audioBlob && (
          <form onSubmit={handleSubmit(processAudio)} className="mt-8 space-y-6 border-t pt-6">
            <h3 className="text-lg font-medium">Call Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Call Title
                </label>
                <Input
                  id="title"
                  placeholder="E.g., Initial consultation with client"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                  disabled={isProcessing}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
                  Client Name
                </label>
                <Input
                  id="clientName"
                  placeholder="E.g., John Smith"
                  {...register('clientName')}
                  className={errors.clientName ? 'border-red-500' : ''}
                  disabled={isProcessing}
                />
                {errors.clientName && (
                  <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>
                )}
              </div>
            </div>
            
            {isProcessing ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  Processing your audio...
                </p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  This may take a minute. We're transcribing and analyzing your call.
                </p>
              </div>
            ) : (
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setAudioURL(null);
                    setAudioBlob(null);
                    setUploadedFile(null);
                    setActiveTab('record');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!isValid || isProcessing}
                >
                  Process Call
                </Button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}