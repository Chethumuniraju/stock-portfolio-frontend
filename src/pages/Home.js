import React from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import Navbar from '../components/Navbar';
import HoldingsList from '../components/HoldingsList';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user } = useAuth();

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
            </Container>
        </Box>
    );
};

export default Home; 