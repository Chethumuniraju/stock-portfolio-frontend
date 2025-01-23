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

const Explore = () => {
    const [news, setNews] = useState(null);
    const [topMovers, setTopMovers] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTopMovers = async () => {
            try {
                console.log('Fetching top movers...');
                const response = await fetch('http://localhost:8080/api/stocks/top-movers');
                if (response.ok) {
                    const data = await response.json();
                    console.log('Top movers data:', data);
                    setTopMovers(data);
                }
            } catch (error) {
                console.error('Error fetching top movers:', error);
            }
        };

        const fetchNews = async () => {
            try {
                console.log('Fetching news data...');
                const response = await fetch('http://localhost:8080/api/stocks/news');
                console.log('Response status:', response.status);
                
                if (response.status === 429) {
                    const errorText = await response.text();
                    console.warn('API rate limit reached:', errorText);
                    setNews([]);
                    return;
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Failed to fetch news: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                console.log('Received news data:', data);
                
                // Check for the correct structure based on Alpha Vantage API
                if (data && data.feed) {
                    const newsItems = data.feed.slice(0, 10).map(item => ({
                        title: item.title,
                        url: item.url,
                        time_published: item.time_published,
                        summary: item.summary,
                        source: item.source
                    }));
                    setNews(newsItems);
                } else {
                    console.warn('No news feed found in response:', data);
                    setNews([]);
                }
            } catch (error) {
                console.error('Error fetching news:', error);
                setNews([]);
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
                                {news && news.map((item, index) => (
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
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Explore;