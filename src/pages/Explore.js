import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Grid,
    Divider,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Container
} from '@mui/material';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Explore = () => {
    const [news, setNews] = useState([]);
    const [topMovers, setTopMovers] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopMovers = async () => {
            try {
                const response = await api.get('/stocks/top-movers');
                setTopMovers(response.data);
            } catch (error) {
                console.error('Error fetching top movers:', error);
            }
        };

        const fetchNews = async () => {
            try {
                const response = await api.get('/stocks/news');
                // Check if response.data has the expected structure
                const newsData = response.data?.feed || [];
                setNews(newsData);
            } catch (error) {
                console.error('Error fetching news:', error);
                setNews([]); // Set empty array on error
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            await Promise.all([fetchTopMovers(), fetchNews()]);
            setIsLoading(false);
        };

        fetchData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <Box>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Market Movers Section */}
                    {topMovers && (
                        <>
                            {/* Top Gainers */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ overflow: 'hidden', height: '100%' }}>
                                    <Typography variant="h6" sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
                                        Top Gainers
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Symbol</TableCell>
                                                    <TableCell>Price</TableCell>
                                                    <TableCell>Change</TableCell>
                                                    <TableCell>Volume</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {topMovers.top_gainers?.slice(0, 5).map((stock, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{stock.ticker}</TableCell>
                                                        <TableCell>${parseFloat(stock.price).toFixed(2)}</TableCell>
                                                        <TableCell sx={{ color: 'success.main' }}>
                                                            +{parseFloat(stock.change_percentage).toFixed(2)}%
                                                        </TableCell>
                                                        <TableCell>{parseInt(stock.volume).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>

                            {/* Top Losers */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ overflow: 'hidden', height: '100%' }}>
                                    <Typography variant="h6" sx={{ p: 2, bgcolor: 'error.main', color: 'white' }}>
                                        Top Losers
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Symbol</TableCell>
                                                    <TableCell>Price</TableCell>
                                                    <TableCell>Change</TableCell>
                                                    <TableCell>Volume</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {topMovers.top_losers?.slice(0, 5).map((stock, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>{stock.ticker}</TableCell>
                                                        <TableCell>${parseFloat(stock.price).toFixed(2)}</TableCell>
                                                        <TableCell sx={{ color: 'error.main' }}>
                                                            {parseFloat(stock.change_percentage).toFixed(2)}%
                                                        </TableCell>
                                                        <TableCell>{parseInt(stock.volume).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        </>
                    )}

                    {/* Market News */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h4" gutterBottom sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                                Latest Market News
                            </Typography>
                            <Grid container spacing={3}>
                                {news.length > 0 ? (
                                    news.map((item, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Box sx={{ 
                                                mb: 3,
                                                p: 2,
                                                borderRadius: 1,
                                                bgcolor: 'background.paper',
                                                boxShadow: 1
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.source}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" component="a" 
                                                    href={item.url} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ 
                                                        textDecoration: 'none',
                                                        color: 'primary.main',
                                                        display: 'block',
                                                        mb: 2,
                                                        '&:hover': {
                                                            textDecoration: 'underline'
                                                        }
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                {item.summary && (
                                                    <Typography variant="body1" color="text.primary" sx={{ 
                                                        lineHeight: 1.6,
                                                        fontSize: '1rem'
                                                    }}>
                                                        {item.summary}
                                                    </Typography>
                                                )}
                                                {index < news.length - 1 && <Divider sx={{ mt: 3 }} />}
                                            </Box>
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Typography variant="body1" color="text.secondary" align="center">
                                            No news available at the moment.
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Explore;