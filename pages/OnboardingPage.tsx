import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingModal from '../components/OnboardingModal';
import { UserProfile } from '../types';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (profile: UserProfile) => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    localStorage.setItem('hasOnboarded', 'true');
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <OnboardingModal onSave={handleSave} />
    </div>
  );
};

export default OnboardingPage;