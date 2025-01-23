import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
    Box, Container, Typography, Paper, List, ListItem, 
    ListItemText, IconButton, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField 
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';

const WatchlistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [watchlist, setWatchlist] = useState(null);
    const [stockDetails, setStockDetails] = useState({});
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            console.log('Auth state:', { 
                hasToken: !!token, 
                hasUser: !!user,
                userId: user?.id,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'no token'
            });
            
            if (!token || !user) {
                console.log('No authentication found, redirecting to login');
                navigate('/login');
                return;
            }
            
            await fetchWatchlistDetails();
        };
        
        checkAuthAndFetch();
    }, [id, token, user, navigate]);

    useEffect(() => {
        if (watchlist?.stockSymbols?.length > 0) {
            fetchStockDetails();
        }
    }, [watchlist]);

    const fetchStockDetails = async () => {
        try {
            const details = {};
            for (const symbol of watchlist.stockSymbols) {
                const data = await fetchStockQuote(symbol);
                if (data) {
                    details[symbol] = data;
                }
            }
            setStockDetails(details);
        } catch (error) {
            console.error('Error fetching stock details:', error);
        }
    };

    const fetchStockQuote = async (symbol) => {
        try {
            const response = await api.get(`/stocks/${symbol}/quote`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return null;
        }
    };

    const fetchWatchlistDetails = async () => {
        try {
            const response = await api.get(`/watchlists/${id}`);
            setWatchlist(response.data);
        } catch (error) {
            console.error('Error fetching watchlist details:', error);
        }
    };

    const searchStocks = async (query) => {
        try {
            const response = await api.get(`/stocks/search?symbol=${query}`);
            return response.data;
        } catch (error) {
            console.error('Error searching stocks:', error);
            return [];
        }
    };

    const addStockToWatchlist = async (symbol) => {
        try {
            await api.post(`/watchlists/${id}/stocks/${symbol}`);
            await fetchWatchlistDetails();
        } catch (error) {
            console.error('Error adding stock to watchlist:', error);
        }
    };

    const removeStockFromWatchlist = async (symbol) => {
        try {
            await api.delete(`/watchlists/${id}/stocks/${symbol}`);
            await fetchWatchlistDetails();
        } catch (error) {
            console.error('Error removing stock from watchlist:', error);
        }
    };

    const handleSearch = async (query) => {
        if (!query || query.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await searchStocks(query);
            // Filter for US stocks only
            const usStocks = (data.data || []).filter(stock => 
                stock.country === 'United States' || 
                stock.exchange?.includes('NYSE') || 
                stock.exchange?.includes('NASDAQ')
            );
            setSearchResults(usStocks);
        } catch (error) {
            console.error('Error searching stocks:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                handleSearch(searchQuery);
            }
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    if (!token || !user) {
        return null; // Will redirect in useEffect
    }

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {error ? (
                    <Paper sx={{ p: 3, mb: 2 }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                ) : null}
                
                {!watchlist ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography>Loading watchlist...</Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <IconButton onClick={() => navigate('/watchlist')} sx={{ mr: 2 }}>
                                <ArrowBack />
                            </IconButton>
                            <Typography variant="h5">{watchlist.name}</Typography>
                        </Box>

                        <Box display="flex" justifyContent="flex-end" mb={2}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenAddDialog(true)}
                            >
                                Add Stock
                            </Button>
                        </Box>

                        <List>
                            {watchlist.stockSymbols?.map((symbol) => (
                                <ListItem
                                    key={symbol}
                                    button
                                    onClick={() => navigate(`/stock/${symbol}`)}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <ListItemText 
                                        primary={symbol}
                                        secondary={
                                            stockDetails[symbol] ? (
                                                <Box>
                                                    <Typography component="span" color="textSecondary">
                                                        ${stockDetails[symbol].close?.toFixed(2) || 'N/A'}
                                                    </Typography>
                                                    <Typography 
                                                        component="span" 
                                                        sx={{ 
                                                            ml: 2,
                                                            color: stockDetails[symbol].percent_change >= 0 ? 'success.main' : 'error.main'
                                                        }}
                                                    >
                                                        {stockDetails[symbol].percent_change >= 0 ? '+' : ''}
                                                        {stockDetails[symbol].percent_change?.toFixed(2) || 0}%
                                                    </Typography>
                                                </Box>
                                            ) : 'Loading...'
                                        }
                                    />
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeStockFromWatchlist(symbol);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}

                <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
                    <DialogTitle>Add Stock to Watchlist</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Search US Stocks"
                            placeholder="Enter stock symbol or name"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            helperText="Showing US stocks only"
                        />
                        <List>
                            {isSearching ? (
                                <ListItem>
                                    <ListItemText primary="Searching..." />
                                </ListItem>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((stock) => (
                                    <ListItem
                                        key={stock.symbol}
                                        button
                                        onClick={() => addStockToWatchlist(stock.symbol)}
                                    >
                                        <ListItemText 
                                            primary={`${stock.symbol} - ${stock.exchange}`}
                                            secondary={stock.name}
                                        />
                                    </ListItem>
                                ))
                            ) : searchQuery ? (
                                <ListItem>
                                    <ListItemText primary="No US stocks found" />
                                </ListItem>
                            ) : null}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default WatchlistDetail; 