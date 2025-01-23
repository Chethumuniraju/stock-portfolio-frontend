import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, Paper, Grid, Card, CardContent,
    Button, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Container,
    ButtonGroup, Chip
} from '@mui/material';
import { Add, Delete, Search, ChevronRight, Add as AddIcon } from '@mui/icons-material';
import { searchStocks } from '../services/api';
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

    useEffect(() => {
        fetchWatchlists();
    }, []);

    const fetchWatchlists = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/watchlists', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Watchlists:', data);
            setWatchlists(data);
        } catch (error) {
            console.error('Failed to fetch watchlists:', error);
        }
    };

    const fetchStockDetails = async (symbol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/stocks/${symbol}/quote`);
            if (response.ok) {
                const data = await response.json();
                setWatchlistStockDetails(prev => ({
                    ...prev,
                    [symbol]: data
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
            const response = await fetch('http://localhost:8080/api/watchlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: newWatchlistName,
                    stockSymbols: []
                })
            });
            const data = await response.json();
            console.log('Created watchlist:', data);
            setWatchlists(current => [...current, data]);
            setOpenDialog(false);
            setNewWatchlistName('');
        } catch (error) {
            console.error('Failed to create watchlist:', error);
        }
    };

    const handleSearch = async (query) => {
        try {
            const response = await fetch(`http://localhost:8080/api/stocks/search?symbol=${query}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Search response:', data);
            
            if (data && data.data) {
                // Filter for US stocks and format the results
                const usStocks = data.data.filter(stock => 
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
            const response = await fetch(`http://localhost:8080/api/watchlists/${watchlistId}/stocks/${symbol}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Added to watchlist:', data);
            fetchWatchlists(); // Refresh watchlists
        } catch (error) {
            console.error('Failed to add to watchlist:', error);
        }
    };

    const handleRemoveFromWatchlist = async (watchlistId, symbol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/watchlists/${watchlistId}/stocks/${symbol}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Removed from watchlist:', data);
            fetchWatchlists(); // Refresh watchlists
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
        }
    };

    const handleDeleteWatchlist = async (watchlistId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/watchlists/${watchlistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                setWatchlists(current => current.filter(w => w.id !== watchlistId));
                if (selectedWatchlist?.id === watchlistId) {
                    setSelectedWatchlist(null);
                }
            } else if (response.status === 403) {
                alert('You do not have permission to delete this watchlist. Please try logging out and back in.');
            } else {
                alert('Failed to delete watchlist. Please try again later.');
            }
        } catch (error) {
            console.error('Failed to delete watchlist:', error);
            alert('Network error while deleting watchlist. Please check your connection and try again.');
        }
    };

    const handleStockClick = (symbol) => {
        navigate(`/stock/${symbol}`);
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
                        gap={2} 
                        sx={{ 
                            overflowX: 'auto',
                            py: 2,
                            '& .MuiButton-root': {
                                minWidth: 'fit-content',
                                borderBottom: 3,
                                borderColor: 'transparent',
                                borderRadius: 0,
                                px: 3,
                                '&.active': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }
                        }}
                    >
                        <Button
                            className={!selectedWatchlist ? 'active' : ''}
                            onClick={() => {
                                setSelectedWatchlist(null);
                            }}
                        >
                            Holdings
                        </Button>
                        {watchlists.map((watchlist) => (
                            <Box
                                key={watchlist.id}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    position: 'relative',
                                    '&:hover .delete-button': {
                                        opacity: 1
                                    }
                                }}
                            >
                                <Button
                                    className={selectedWatchlist?.id === watchlist.id ? 'active' : ''}
                                    onClick={() => setSelectedWatchlist(watchlist)}
                                    endIcon={
                                        <Chip 
                                            label={watchlist.stockSymbols?.length || 0}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    }
                                >
                                    {watchlist.name}
                                </Button>
                                <IconButton
                                    size="small"
                                    className="delete-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete "${watchlist.name}" watchlist?`)) {
                                            handleDeleteWatchlist(watchlist.id);
                                        }
                                    }}
                                    sx={{ 
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        position: 'absolute',
                                        right: -30,
                                        color: 'error.main',
                                        '&:hover': {
                                            bgcolor: 'error.lighter'
                                        }
                                    }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                        <Button
                            startIcon={<Add />}
                            onClick={() => setOpenDialog(true)}
                            sx={{ ml: 'auto' }}
                        >
                            New Watchlist
                        </Button>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Search Section - Always visible */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Search Stocks
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Search by stock symbol..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                sx={{ mb: 2 }}
                            />
                            {searchResults.length > 0 && (
                                <List>
                                    {searchResults.map((stock) => (
                                        <ListItem
                                            key={stock.symbol}
                                            button
                                            onClick={() => handleStockClick(stock.symbol)}
                                            sx={{
                                                '&:hover': { bgcolor: 'action.hover' },
                                                borderRadius: 1,
                                                mb: 1
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center">
                                                        <Typography variant="body1" fontWeight="medium">
                                                            {stock.symbol}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2" 
                                                            color="textSecondary"
                                                            sx={{ ml: 2 }}
                                                        >
                                                            {stock.name || stock.instrument_name}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={`Exchange: ${stock.exchange}`}
                                            />
                                            {selectedWatchlist ? (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<Add />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToWatchlist(selectedWatchlist.id, stock.symbol);
                                                        setSearchQuery('');
                                                        setSearchResults([]);
                                                    }}
                                                    sx={{ mr: 1 }}
                                                >
                                                    Add to {selectedWatchlist.name}
                                                </Button>
                                            ) : (
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedStock(stock);
                                                        setWatchlistDialogOpen(true);
                                                    }}
                                                >
                                                    <Add />
                                                </IconButton>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Content Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            {!selectedWatchlist ? (
                                <>
                                    <Typography variant="h6" gutterBottom>
                                        Your Portfolio
                                    </Typography>
                                    <HoldingsList />
                                </>
                            ) : (
                                <>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Typography variant="h6">{selectedWatchlist.name}</Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<Add />}
                                            size="small"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            Add Stock
                                        </Button>
                                    </Box>
                                    <List>
                                        {selectedWatchlist.stockSymbols.map((symbol) => {
                                            const stockDetail = watchlistStockDetails[symbol] || {};
                                            const currentPrice = parseFloat(stockDetail.close) || 0;
                                            const percentChange = parseFloat(stockDetail.percent_change) || 0;

                                            return (
                                                <ListItem
                                                    key={symbol}
                                                    button
                                                    onClick={() => navigate(`/stock/${symbol}`)}
                                                    sx={{
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1,
                                                        mb: 1
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" alignItems="center">
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {symbol}
                                                                </Typography>
                                                                <Typography 
                                                                    variant="body2" 
                                                                    color="textSecondary"
                                                                    sx={{ ml: 2 }}
                                                                >
                                                                    {formatCurrency(currentPrice)}
                                                                </Typography>
                                                                <Typography 
                                                                    variant="body2"
                                                                    color={percentChange >= 0 ? "success.main" : "error.main"}
                                                                    sx={{ ml: 2 }}
                                                                >
                                                                    {formatPercentage(percentChange)}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                    <IconButton
                                                        edge="end"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFromWatchlist(selectedWatchlist.id, symbol);
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Dialogs */}
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
                    <Button onClick={handleCreateWatchlist}>Create</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={watchlistDialogOpen} onClose={() => setWatchlistDialogOpen(false)}>
                <DialogTitle>Add to Watchlist</DialogTitle>
                <DialogContent>
                    <List>
                        {watchlists.map((watchlist) => (
                            <ListItem
                                key={watchlist.id}
                                button
                                onClick={() => {
                                    handleAddToWatchlist(watchlist.id, selectedStock?.symbol);
                                    setWatchlistDialogOpen(false);
                                }}
                            >
                                <ListItemText primary={watchlist.name} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWatchlistDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Dashboard; 