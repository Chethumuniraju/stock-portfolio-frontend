import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Paper, Button, Snackbar } from '@mui/material';
import Navbar from '../components/Navbar';
import HoldingsList from '../components/HoldingsList';
import { useAuth } from '../contexts/AuthContext';
import ShareIcon from '@mui/icons-material/Share';
import { createShareLink } from '../services/api';

const Home = () => {
    const { user } = useAuth();
    const [shareLink, setShareLink] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleShare = async () => {
        try {
            const response = await createShareLink();
            const shareUrl = `${window.location.origin}/shared/${response.shareId}`;
            setShareLink(shareUrl);
            await navigator.clipboard.writeText(shareUrl);
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error generating share link:', error);
        }
    };

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Welcome Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper 
                            sx={{ 
                                p: 3, 
                                mb: 3, 
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                color: 'white'
                            }}
                        >
                            <Typography variant="h4" gutterBottom fontWeight="medium">
                                Welcome back, {user?.name || user?.email}
                            </Typography>
                            <Typography variant="subtitle1">
                                Track your portfolio and manage your investments
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Holdings Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
                                Your Portfolio
                            </Typography>
                            <HoldingsList />
                        </Paper>
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<ShareIcon />}
                        onClick={handleShare}
                        sx={{ ml: 2 }}
                    >
                        Share Portfolio
                    </Button>
                </Box>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    message="Share link copied to clipboard!"
                />
            </Container>
        </Box>
    );
};

export default Home; 