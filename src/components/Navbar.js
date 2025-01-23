import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExploreIcon from '@mui/icons-material/Explore';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleLogoClick = () => {
        navigate('/dashboard');
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        handleProfileMenuClose();
        navigate('/profile');
    };

    const handleLogout = async () => {
        try {
            await logout();
            handleProfileMenuClose();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                        flexGrow: 1, 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                    onClick={handleLogoClick}
                >
                    StockTracker
                </Typography>
                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            color="inherit"
                            startIcon={<ExploreIcon />}
                            onClick={() => navigate('/explore')}
                        >
                            Explore
                        </Button>
                        <Typography variant="body1">
                            {user.email}
                        </Typography>
                        <IconButton 
                            color="inherit"
                            onClick={handleProfileMenuOpen}
                            aria-controls="profile-menu"
                            aria-haspopup="true"
                        >
                            <AccountCircleIcon />
                        </IconButton>
                        <Menu
                            id="profile-menu"
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleProfileMenuClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                        >
                            <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 