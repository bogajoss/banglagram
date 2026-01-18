import React, { useState, useRef, useEffect } from "react";
import { Square, Trash2, Play, Pause, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopRecordingCleanup = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  }, []);

  const startRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stopRecordingCleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      onCancel();
    }
  }, [onCancel, stopRecordingCleanup]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startRecording();
    }, 0);
    return () => {
      clearTimeout(timer);
      stopRecordingCleanup();
    };
  }, [startRecording, stopRecordingCleanup]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioBlob) return;

    if (!audioPlayerRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioPlayerRef.current = new Audio(url);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
      audioPlayerRef.current.ontimeupdate = () => {
        setPlaybackTime(audioPlayerRef.current?.currentTime || 0);
      };
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 w-full bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full"
    >
      {!audioBlob ? (
        <>
          <div className="flex-1 flex items-center gap-2 px-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-red-500">
              {formatTime(recordingTime)}
            </span>
            <span className="text-xs text-zinc-500">Recording...</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={stopRecording}
          >
            <Square size={16} fill="currentColor" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-500 hover:text-red-500"
            onClick={onCancel}
          >
            <Trash2 size={18} />
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>
            <div className="h-1 flex-1 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${(playbackTime / recordingTime) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-500 w-10">
              {formatTime(recordingTime)}
            </span>
          </div>

          <Button
            size="icon"
            className="h-8 w-8 bg-blue-500 hover:bg-blue-600 rounded-full"
            onClick={handleSend}
          >
            <Send size={16} className="text-white" />
          </Button>
        </>
      )}
    </motion.div>
  );
};

export default VoiceRecorder;
