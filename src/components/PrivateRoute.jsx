import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ element: Component, ...rest }) {
  const { currentUser } = useAuth();

  return currentUser ? <Component {...rest} /> : <Navigate to="/login" />;
}

export default PrivateRoute;
