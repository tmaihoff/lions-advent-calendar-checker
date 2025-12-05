import React, { memo, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = memo<CardProps>(
  ({ children, className = "", hover = true }) => (
    <div
      className={`bg-white rounded-2xl shadow-soft border border-christmas-green/10 overflow-hidden ${
        hover ? "card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
);

Card.displayName = "Card";
