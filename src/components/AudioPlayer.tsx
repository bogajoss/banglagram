import React, { useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "./ui/button";

interface AudioPlayerProps {
    src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(src);
            audioRef.current.onended = () => {
                setIsPlaying(false);
                setProgress(0);
            };
            audioRef.current.ontimeupdate = () => {
                if (audioRef.current) {
                    const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                    setProgress(p || 0);
                }
            };
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1 mt-1 w-fit min-w-[150px]">
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={togglePlay}
            >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <div className="h-1 flex-grow bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default AudioPlayer;
