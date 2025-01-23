import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import WatchlistPage from './pages/WatchlistPage';
import WatchlistDetail from './pages/WatchlistDetail';
import Explore from './pages/Explore';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/explore" element={<Explore />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/stock/:symbol" element={
        <PrivateRoute>
          <StockDetails />
        </PrivateRoute>
      } />
      <Route path="/watchlist" element={
        <PrivateRoute>
          <WatchlistPage />
        </PrivateRoute>
      } />
      <Route path="/watchlist/:id" element={
        <PrivateRoute>
          <WatchlistDetail />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 