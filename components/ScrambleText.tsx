'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrambleTextProps {
  text: string;
  delay?: number;
  scrambleSpeed?: number;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * ScrambleText Component
 * 
 * Creates a "Matrix-style" text reveal animation where characters
 * gradually decode from random letters/symbols to reveal the actual text.
 * 
 * Used on mobile block screen for the disclaimer message.
 */
export default function ScrambleText({
  text,
  delay = 0,
  scrambleSpeed = 30,
  className = '',
  as: Component = 'span',
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState('');
  const frameRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const charsRef = useRef<string>('ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθικλμνξπρστυφχψω01');

  useEffect(() => {
    let currentIndex = 0;
    let scrambleCount = 0;
    const maxScrambles = 2;
    const revealChars = 3; // Number of characters to show ahead being scrambled

    const getRandomChar = () => {
      return charsRef.current[Math.floor(Math.random() * charsRef.current.length)];
    };

    const animate = () => {
      if (currentIndex <= text.length) {
        const decoded = text.slice(0, currentIndex);
        
        // Show a few scrambling characters ahead of the decode point
        const upcoming = text.slice(currentIndex, currentIndex + revealChars);
        const scrambled = upcoming
          .split('')
          .map((char) => (char === ' ' ? ' ' : getRandomChar()))
          .join('');

        setDisplayText(decoded + scrambled);

        scrambleCount++;
        if (scrambleCount >= maxScrambles) {
          currentIndex++;
          scrambleCount = 0;
        }

        frameRef.current = setTimeout(animate, currentIndex === text.length ? 0 : scrambleSpeed);
      } else {
        // Final render with complete text
        setDisplayText(text);
      }
    };

    const startTimeout = setTimeout(() => {
      animate();
    }, delay);

    return () => {
      if (frameRef.current) clearTimeout(frameRef.current);
      clearTimeout(startTimeout);
    };
  }, [text, delay, scrambleSpeed]);

  return <Component className={className}>{displayText || text}</Component>;
}
