import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const handleClose = () => navigate('/');
  const handleSuccess = () => navigate('/chat');

  return (
    <div className="min-h-screen bg-slate-900">
      <Login isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  );
};

export default LoginPage;