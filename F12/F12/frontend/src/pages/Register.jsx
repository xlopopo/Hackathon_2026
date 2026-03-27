/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export const Register = () => {
  // ... состояния
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(email, password, 'psychologist', name);
    if (result.success) {
      const user = authService.getCurrentUser();
       
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'psychologist') navigate('/psychologist');
       
      else navigate('/');
    } else {
       
      setError(result.error);
    }
  };
  // ... JSX
};