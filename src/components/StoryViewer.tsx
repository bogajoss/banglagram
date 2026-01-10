import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';

interface Story {
  id: number;
  username: string;
  img: string;
  isUser?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
  showToast: (msg: string) => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialStoryIndex, onClose, showToast }) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1; // Approx 5 seconds total
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const currentStory = stories[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* Close Button */}
      <button className="absolute top-4 right-4 z-50 text-white" onClick={onClose}>
        <X size={32} />
      </button>

      {/* Main Container */}
      <div className="relative w-full md:w-[400px] h-full md:h-[90vh] bg-black md:rounded-lg overflow-hidden flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-4 left-0 right-0 flex gap-1 px-2 z-20">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-white transition-all duration-100 ease-linear ${
                  idx < currentIndex ? 'w-full' : idx === currentIndex ? '' : 'w-0'
                }`}
                style={{ width: idx === currentIndex ? `${progress}%` : undefined }}
              />
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="absolute top-8 left-4 flex items-center gap-3 z-20 text-white">
            <img src={currentStory.img} className="w-8 h-8 rounded-full border border-white" alt={currentStory.username} />
            <span className="font-semibold text-sm">{currentStory.username}</span>
            <span className="text-white/70 text-xs">12h</span>
        </div>

        {/* Story Image */}
        <div className="flex-1 relative flex items-center justify-center bg-gray-900">
           <img src={currentStory.img} className="w-full h-full object-cover" alt="story" />
           
           {/* Tap Areas */}
           <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev}></div>
           <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext}></div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 flex items-center gap-4 z-20 bg-gradient-to-t from-black/50 to-transparent">
           <div className="flex-1 relative">
             <input type="text" placeholder={`Reply to ${currentStory.username}...`} className="w-full bg-transparent border border-white/50 rounded-full py-3 px-4 text-white text-sm placeholder-white/70 outline-none focus:border-white" />
           </div>
           <Heart size={28} className="text-white cursor-pointer hover:scale-110 transition-transform" onClick={() => showToast('Liked story')} />
           <Send size={28} className="text-white cursor-pointer hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Desktop Navigation Arrows */}
      <button className="hidden md:block absolute left-4 text-white/50 hover:text-white" onClick={handlePrev} disabled={currentIndex === 0}>
        <ChevronLeft size={48} />
      </button>
      <button className="hidden md:block absolute right-4 text-white/50 hover:text-white" onClick={handleNext} disabled={currentIndex === stories.length - 1}>
        <ChevronRight size={48} />
      </button>
    </div>
  );
}

export default StoryViewer;
