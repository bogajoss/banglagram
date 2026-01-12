import React from "react";
import { Link } from "react-router-dom";

interface RichTextProps {
  text: string;
  className?: string;
  truncateLength?: number;
  expanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

const RichText: React.FC<RichTextProps> = ({ 
  text, 
  className = "", 
  truncateLength, 
  expanded = false,
  onToggleExpand 
}) => {
  if (!text) return null;

  // Determine text to show
  let displayText = text;
  const shouldTruncate = truncateLength && text.length > truncateLength && !expanded;
  
  if (shouldTruncate) {
    displayText = text.slice(0, truncateLength);
  }

  // Regex to match #hashtag and @mention
  // \B matches a position where the previous character is not a word character (like space or start of string)
  // This prevents matching inside words like email@address.com or match#text
  const regex = /(\B#[a-zA-Z0-9_\u0980-\u09FF]+|\B@[a-zA-Z0-9_]+)/g;

  const parts = displayText.split(regex);

  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, index) => {
        if (part.match(/\B#[a-zA-Z0-9_\u0980-\u09FF]+/)) {
          // Hashtag
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              to={`/explore?q=%23${tag}`}
              className="text-[#006a4e] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        } else if (part.match(/\B@[a-zA-Z0-9_]+/)) {
          // Mention
          const username = part.slice(1);
          return (
            <Link
              key={index}
              to={`/profile/${username}`}
              className="text-[#006a4e] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
      {shouldTruncate && onToggleExpand && (
        <span 
          className="text-zinc-500 cursor-pointer font-semibold ml-1 hover:text-zinc-700 dark:hover:text-zinc-300"
          onClick={onToggleExpand}
        >
          ... আরও
        </span>
      )}
    </span>
  );
};

export default RichText;
