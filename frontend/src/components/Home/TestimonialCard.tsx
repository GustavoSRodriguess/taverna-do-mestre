import React from 'react';

interface TestimonialCardProps {
  text: string;
  author: string;
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ text, author, className = '' }) => {
  return (
    <div className={`p-6 border border-purple-600 rounded-lg ${className}`}>
      <p className="text-gray-400 mb-4">{text}</p>
      <p className="text-purple-500 font-bold">{author}</p>
    </div>
  );
};

export default TestimonialCard;