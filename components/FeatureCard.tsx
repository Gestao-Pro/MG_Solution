import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 h-full flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <div className="bg-indigo-600/20 p-3 rounded-lg text-indigo-400 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm flex-grow">{description}</p>
    </div>
  );
};