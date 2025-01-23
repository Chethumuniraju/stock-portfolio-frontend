import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import StockDetails from './pages/StockDetails';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import WatchlistPage from './pages/WatchlistPage';
import WatchlistDetail from './pages/WatchlistDetail';
import { AuthProvider } from './contexts/AuthContext';
import Explore from './pages/Explore';
import SharedPortfolio from './pages/SharedPortfolio';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/shared/:shareId" element={<SharedPortfolio />} />
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
