import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AdminHomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/overview', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminHomePage;
