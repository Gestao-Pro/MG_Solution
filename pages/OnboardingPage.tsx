import React from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingModal from '../components/OnboardingModal';
import { UserProfile } from '../types';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSave = (profile: UserProfile) => {
    try {
      const email = localStorage.getItem('userEmail') || '';
      const profileKey = email ? `userProfile:${email}` : 'userProfile';
      const onboardKey = email ? `hasOnboarded:${email}` : 'hasOnboarded';
      localStorage.setItem(profileKey, JSON.stringify(profile));
      localStorage.setItem(onboardKey, 'true');
    } catch {}
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {(() => {
        let initial: UserProfile | undefined = undefined;
        try {
          const email = localStorage.getItem('userEmail') || '';
          const profileKey = email ? `userProfile:${email}` : 'userProfile';
          const raw = localStorage.getItem(profileKey);
          if (raw) initial = JSON.parse(raw);
        } catch {}
        return <OnboardingModal onSave={handleSave} initialProfile={initial} />;
      })()}
    </div>
  );
};

export default OnboardingPage;