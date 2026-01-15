import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/bn";

dayjs.extend(relativeTime);
dayjs.locale("bn");

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
    return <span className={`text-green-500 text-xs font-medium ${className}`}>অ্যাক্টিভ এখনই</span>;
  }

  if (lastSeen) {
    const lastSeenTime = dayjs(lastSeen);
    const now = dayjs();
    const diffMinutes = now.diff(lastSeenTime, "minute");
    const diffHours = now.diff(lastSeenTime, "hour");
    const diffDays = now.diff(lastSeenTime, "day");

    let timeText = "";
    if (diffMinutes < 1) {
      timeText = "কয়েক সেকেন্ড আগে";
    } else if (diffMinutes < 60) {
      timeText = `${diffMinutes} মিনিট আগে`;
    } else if (diffHours < 24) {
      timeText = `${diffHours} ঘণ্টা আগে`;
    } else if (diffDays < 7) {
      timeText = `${diffDays} দিন আগে`;
    } else {
      timeText = lastSeenTime.format("DD MMM");
    }

    return (
      <span className={`text-gray-500 text-xs font-medium ${className}`}>
        শেষ সক্রিয়: {timeText}
      </span>
    );
  }

  return <span className={`text-gray-500 text-xs font-medium ${className}`}>অনলাইন অবস্থা জানা নেই</span>;
};
