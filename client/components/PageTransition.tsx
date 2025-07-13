import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset visibility when route changes
    setIsVisible(false);
    
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div 
      className={`transition-all duration-300 ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Fade in animation component
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300, 
  className = "" 
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`transition-all ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4"
      } ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms` 
      }}
    >
      {children}
    </div>
  );
}

// Staggered animation for lists
export function StaggeredFadeIn({ 
  children, 
  staggerDelay = 100, 
  className = "" 
}: {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Scale animation for buttons and interactive elements
export function ScaleOnHover({ 
  children, 
  className = "" 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`transition-transform duration-200 hover:scale-105 ${className}`}>
      {children}
    </div>
  );
}

// Slide in from different directions
export function SlideIn({ 
  children, 
  direction = "left", 
  delay = 0, 
  className = "" 
}: {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return "translate-x-0 translate-y-0";
    
    switch (direction) {
      case "left":
        return "-translate-x-8 translate-y-0";
      case "right":
        return "translate-x-8 translate-y-0";
      case "up":
        return "translate-x-0 -translate-y-8";
      case "down":
        return "translate-x-0 translate-y-8";
      default:
        return "-translate-x-8 translate-y-0";
    }
  };

  return (
    <div 
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${getTransform()} ${className}`}
    >
      {children}
    </div>
  );
} 