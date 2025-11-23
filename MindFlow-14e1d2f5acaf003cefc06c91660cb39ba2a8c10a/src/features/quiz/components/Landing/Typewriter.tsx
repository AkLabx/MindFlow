import React, { useState, useEffect } from 'react';

export const Typewriter = () => {
  const words = ["Exploring", "Learning", "Creating", "Mastering"];
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Typing Loop
  useEffect(() => {
    const currentWord = words[index];
    // Stop typing timer if we reached the target state (full word or empty)
    if (!isDeleting && text === currentWord) return;
    if (isDeleting && text === "") return;

    const timer = setTimeout(() => {
      if (isDeleting) {
        setText((prev) => prev.slice(0, -1));
      } else {
        setText((prev) => currentWord.slice(0, prev.length + 1));
      }
    }, isDeleting ? 50 : 150);

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, words]);

  // State Transition (Pause & Switch)
  useEffect(() => {
    const currentWord = words[index];
    
    if (!isDeleting && text === currentWord) {
      // Finished typing, pause before deleting
      const timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }
    
    if (isDeleting && text === "") {
      // Finished deleting, switch word
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % words.length);
    }
  }, [text, isDeleting, index, words]);

  return (
    <span className="inline-block w-[100px] text-left" aria-hidden="true">
      {text}
      <span className="animate-pulse ml-0.5 text-indigo-300">|</span>
    </span>
  );
};