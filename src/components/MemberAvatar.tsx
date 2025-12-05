import React, { memo } from "react";

interface MemberAvatarProps {
  avatar: string;
  className?: string;
}

export const MemberAvatar = memo<MemberAvatarProps>(
  ({ avatar, className = "w-10 h-10 text-2xl" }) => (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-white shadow-sm bg-slate-50 select-none ${className}`}
    >
      {avatar}
    </div>
  )
);

MemberAvatar.displayName = "MemberAvatar";
