import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full flex flex-col items-center text-center transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
      <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm flex-grow">{description}</p>
    </div>
  );
};