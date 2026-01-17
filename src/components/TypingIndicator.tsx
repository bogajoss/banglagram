import React from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className = "",
}) => {
  if (typingUsers.length === 0) return null;

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.length} people are typing...`;

  const dotStyle = {
    animation: "bounce 1.4s infinite",
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
        .dot-1 { animation-delay: 0ms; }
        .dot-2 { animation-delay: 160ms; }
        .dot-3 { animation-delay: 320ms; }
      `}</style>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full dot-1" style={{ ...dotStyle }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full dot-2" style={{ ...dotStyle }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full dot-3" style={{ ...dotStyle }} />
      </div>
      {typingText}
    </div>
  );
};
