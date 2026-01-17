import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.locale("en");

interface UserStatusProps {
  isOnline: boolean;
  lastSeen: string | null;
  className?: string;
}

export const UserStatus: React.FC<UserStatusProps> = ({
  isOnline,
  lastSeen,
  className = "",
}) => {
  if (isOnline) {
    return <span className={`text-green-500 text-xs font-medium ${className}`}>Active now</span>;
  }

  if (lastSeen) {
    const lastSeenTime = dayjs(lastSeen);
    const now = dayjs();
    const diffMinutes = now.diff(lastSeenTime, "minute");
    const diffHours = now.diff(lastSeenTime, "hour");
    const diffDays = now.diff(lastSeenTime, "day");

    let timeText = "";
    if (diffMinutes < 1) {
      timeText = "Just now";
    } else if (diffMinutes < 60) {
      timeText = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      timeText = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      timeText = `${diffDays}d ago`;
    } else {
      timeText = lastSeenTime.format("DD MMM");
    }

    return (
      <span className={`text-gray-500 text-xs font-medium ${className}`}>
        Active {timeText}
      </span>
    );
  }

  return <span className={`text-gray-500 text-xs font-medium ${className}`}>Unknown status</span>;
};
