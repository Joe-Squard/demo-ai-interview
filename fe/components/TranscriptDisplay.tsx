'use client';

import React from 'react';

type Props = {
  title: string;
  content: string;
  className?: string;
};

const TranscriptDisplay: React.FC<Props> = ({ title, content, className }) => {
  return (
    <div className={`${className} bg-gray-700 p-4 rounded-xl`}>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-white whitespace-pre-wrap">{content}</p>
    </div>
  );
};

export default TranscriptDisplay;
