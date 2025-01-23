import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, Paper, Grid, Card, CardContent,
    Button, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Container,
    ButtonGroup, Chip, Snackbar
} from '@mui/material';
import { Add, Delete, Search, ChevronRight, Add as AddIcon, Share as ShareIcon } from '@mui/icons-material';
import api, { createShareLink } from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import HoldingsList from '../components/HoldingsList';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [watchlists, setWatchlists] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const { user } = useAuth();
    const [selectedStock, setSelectedStock] = useState(null);
    const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [activeSection, setActiveSection] = useState('holdings'); // 'holdings' or 'watchlists'
    const [selectedWatchlist, setSelectedWatchlist] = useState(null);
    const [watchlistStockDetails, setWatchlistStockDetails] = useState({});
    const [shareLink, setShareLink] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    useEffect(() => {
        fetchWatchlists();
    }, []);

    const fetchWatchlists = async () => {
        try {
            const response = await api.get('/watchlists');
            setWatchlists(response.data);
        } catch (error) {
            console.error('Error fetching watchlists:', error);
        }
    };

    const fetchQuote = async (symbol) => {
        try {
            const response = await api.get(`/stocks/${symbol}/quote`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return null;
        }
    };

    const createWatchlist = async (name) => {
        try {
            const response = await api.post('/watchlists', { name });
            await fetchWatchlists();
        } catch (error) {
            console.error('Error creating watchlist:', error);
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

    const addStockToWatchlist = async (watchlistId, symbol) => {
        try {
            await api.post(`/watchlists/${watchlistId}/stocks/${symbol}`);
            await fetchWatchlists();
        } catch (error) {
            console.error('Error adding stock to watchlist:', error);
        }
    };

    const removeStockFromWatchlist = async (watchlistId, symbol) => {
        try {
            await api.delete(`/watchlists/${watchlistId}/stocks/${symbol}`);
            await fetchWatchlists();
        } catch (error) {
            console.error('Error removing stock from watchlist:', error);
        }
    };

    const deleteWatchlist = async (watchlistId) => {
        try {
            await api.delete(`/watchlists/${watchlistId}`);
            await fetchWatchlists();
        } catch (error) {
            console.error('Error deleting watchlist:', error);
        }
    };

    const fetchStockDetails = async (symbol) => {
        try {
            const response = await fetchQuote(symbol);
            if (response) {
                setWatchlistStockDetails(prev => ({
                    ...prev,
                    [symbol]: response
                }));
            }
        } catch (error) {
            console.error(`Error fetching stock details for ${symbol}:`, error);
        }
    };

    useEffect(() => {
        if (selectedWatchlist) {
            selectedWatchlist.stockSymbols.forEach(symbol => {
                fetchStockDetails(symbol);
            });
        }
    }, [selectedWatchlist]);

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    const formatPercentage = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00%' : `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    };

    const handleCreateWatchlist = async () => {
        try {
            await createWatchlist(newWatchlistName);
            setOpenDialog(false);
            setNewWatchlistName('');
        } catch (error) {
            console.error('Failed to create watchlist:', error);
        }
    };

    const handleSearch = async (query) => {
        try {
            const response = await searchStocks(query);
            console.log('Search response:', response);
            
            if (response && response.data) {
                // Filter for US stocks and format the results
                const usStocks = response.data.filter(stock => 
                    stock.country === 'United States' || 
                    stock.exchange.includes('NYSE') || 
                    stock.exchange.includes('NASDAQ')
                );
                console.log('Filtered US stocks:', usStocks);
                setSearchResults(usStocks);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching stocks:', error);
            setSearchResults([]);
        }
    };

    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (query.trim()) {
            const timeoutId = setTimeout(() => {
                handleSearch(query);
            }, 300);
            setSearchTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    };

    const handleAddToWatchlist = async (watchlistId, symbol) => {
        try {
            await addStockToWatchlist(watchlistId, symbol);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to add to watchlist:', error);
        }
    };

    const handleRemoveFromWatchlist = async (watchlistId, symbol) => {
        try {
            await removeStockFromWatchlist(watchlistId, symbol);
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
        }
    };

    const handleDeleteWatchlist = async (watchlistId) => {
        try {
            await deleteWatchlist(watchlistId);
        } catch (error) {
            console.error('Failed to delete watchlist:', error);
            alert('Network error while deleting watchlist. Please check your connection and try again.');
        }
    };

    const handleStockClick = (symbol) => {
        navigate(`/stock/${symbol}`);
    };

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
            
            {/* Navigation Buttons */}
            <Box 
                sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 64,
                    zIndex: 1000,
                    boxShadow: 1
                }}
            >
                <Container maxWidth="lg">
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between"
                        gap={2} 
                        sx={{ py: 2 }}
                    >
                        <ButtonGroup variant="contained">
                            <Button
                                onClick={() => setActiveSection('holdings')}
                                variant={activeSection === 'holdings' ? 'contained' : 'outlined'}
                            >
                                Holdings
                            </Button>
                            <Button
                                onClick={() => setActiveSection('watchlists')}
                                variant={activeSection === 'watchlists' ? 'contained' : 'outlined'}
                            >
                                Watchlists
                            </Button>
                        </ButtonGroup>
                        <Box>
                            <Button
                                variant="contained"
                                startIcon={<ShareIcon />}
                                onClick={handleShare}
                                sx={{ mr: 2 }}
                            >
                                Share Portfolio
                            </Button>
                            {activeSection === 'watchlists' && (
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenDialog(true)}
                                >
                                    Create Watchlist
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {activeSection === 'holdings' ? (
                    <HoldingsList />
                ) : (
                    <Grid container spacing={3}>
                        {watchlists.map((watchlist) => (
                            <Grid item xs={12} sm={6} md={4} key={watchlist.id}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" gutterBottom>
                                                {watchlist.name}
                                            </Typography>
                                            <IconButton 
                                                onClick={() => handleDeleteWatchlist(watchlist.id)}
                                                size="small"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                        <List>
                                            {watchlist.stockSymbols.map((symbol) => (
                                                <ListItem 
                                                    key={symbol}
                                                    button
                                                    onClick={() => handleStockClick(symbol)}
                                                >
                                                    <ListItemText 
                                                        primary={symbol}
                                                        secondary={
                                                            watchlistStockDetails[symbol] ? (
                                                                <>
                                                                    {formatCurrency(watchlistStockDetails[symbol].close)}
                                                                    <span style={{ 
                                                                        color: watchlistStockDetails[symbol].percent_change >= 0 
                                                                            ? 'green' 
                                                                            : 'red',
                                                                        marginLeft: '8px'
                                                                    }}>
                                                                        {formatPercentage(watchlistStockDetails[symbol].percent_change)}
                                                                    </span>
                                                                </>
                                                            ) : 'Loading...'
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton 
                                                            edge="end" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFromWatchlist(watchlist.id, symbol);
                                                            }}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                        <Box mt={2}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<Add />}
                                                onClick={() => {
                                                    setSelectedWatchlist(watchlist);
                                                    setWatchlistDialogOpen(true);
                                                }}
                                            >
                                                Add Stock
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Create Watchlist Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>Create New Watchlist</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Watchlist Name"
                            fullWidth
                            value={newWatchlistName}
                            onChange={(e) => setNewWatchlistName(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button 
                            onClick={handleCreateWatchlist}
                            variant="contained"
                            disabled={!newWatchlistName.trim()}
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Stock to Watchlist Dialog */}
                <Dialog 
                    open={watchlistDialogOpen} 
                    onClose={() => {
                        setWatchlistDialogOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                    }}
                >
                    <DialogTitle>Add Stock to Watchlist</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Search Stocks"
                            fullWidth
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <List>
                            {searchResults.map((stock) => (
                                <ListItem 
                                    key={stock.symbol}
                                    button
                                    onClick={() => {
                                        handleAddToWatchlist(selectedWatchlist.id, stock.symbol);
                                        setWatchlistDialogOpen(false);
                                    }}
                                >
                                    <ListItemText 
                                        primary={stock.symbol}
                                        secondary={stock.name}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setWatchlistDialogOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}>
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Share Link Snackbar */}
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

export default Dashboard; 