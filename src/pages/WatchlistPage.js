import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Container, Typography, Paper, Grid, List, ListItem,
    ListItemText, IconButton, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, Card, CardContent
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import api from '../services/api';

const WatchlistPage = () => {
    const navigate = useNavigate();
    const [watchlists, setWatchlists] = useState([]);
    const [selectedWatchlist, setSelectedWatchlist] = useState(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openAddStockDialog, setOpenAddStockDialog] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        fetchWatchlists();
    }, []);

    const fetchWatchlists = async () => {
        try {
            const response = await api.get('/watchlists');
            setWatchlists(response.data);
            if (response.data.length > 0 && !selectedWatchlist) {
                setSelectedWatchlist(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching watchlists:', error);
        }
    };

    const createWatchlist = async (name) => {
        try {
            const response = await api.post('/watchlists', { name });
            setWatchlists([...watchlists, response.data]);
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

    const addStockToWatchlist = async (symbol) => {
        try {
            await api.post(`/watchlists/${selectedWatchlist.id}/stocks/${symbol}`);
            // Refresh watchlists after adding stock
            fetchWatchlists();
        } catch (error) {
            console.error('Error adding stock to watchlist:', error);
        }
    };

    const removeStockFromWatchlist = async (symbol) => {
        try {
            await api.delete(`/watchlists/${selectedWatchlist.id}/stocks/${symbol}`);
            // Refresh watchlists after removing stock
            fetchWatchlists();
        } catch (error) {
            console.error('Error removing stock from watchlist:', error);
        }
    };

    const handleCreateWatchlist = async () => {
        try {
            if (!newWatchlistName.trim()) {
                return; // Don't create empty watchlist
            }

            await createWatchlist(newWatchlistName);
            setOpenCreateDialog(false);
            setNewWatchlistName('');
        } catch (error) {
            console.error('Error creating watchlist:', error);
        }
    };

    const handleSearchStocks = async () => {
        try {
            const results = await searchStocks(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching stocks:', error);
        }
    };

    const handleAddStock = async (symbol) => {
        try {
            await addStockToWatchlist(symbol);
            setOpenAddStockDialog(false);
            setSearchQuery('');
        } catch (error) {
            console.error('Error adding stock:', error);
        }
    };

    const handleRemoveStock = async (symbol) => {
        try {
            await removeStockFromWatchlist(symbol);
        } catch (error) {
            console.error('Error removing stock:', error);
        }
    };

    const handleWatchlistClick = (watchlist) => {
        setSelectedWatchlist(watchlist);
        navigate(`/watchlist/${watchlist.id}`);
    };

    const handleStockClick = (symbol) => {
        navigate(`/stock/${symbol}`);
    };

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Watchlists List */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">My Watchlists</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenCreateDialog(true)}
                                >
                                    Create New Watchlist
                                </Button>
                            </Box>
                            <Grid container spacing={2}>
                                {watchlists.map((watchlist) => (
                                    <Grid item xs={12} sm={6} md={4} key={watchlist.id}>
                                        <Card 
                                            sx={{ 
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                                '&:hover': { 
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 3
                                                }
                                            }}
                                            onClick={() => handleWatchlistClick(watchlist)}
                                        >
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    {watchlist.name}
                                                </Typography>
                                                <Typography color="textSecondary">
                                                    {watchlist.stockSymbols?.length || 0} stocks
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Create Watchlist Dialog */}
                <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
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
                        <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                        <Button 
                            onClick={handleCreateWatchlist} 
                            variant="contained"
                            disabled={!newWatchlistName.trim()}
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Add Stock Dialog */}
                <Dialog open={openAddStockDialog} onClose={() => setOpenAddStockDialog(false)}>
                    <DialogTitle>Add Stock to Watchlist</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Search Stocks"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchStocks()}
                        />
                        <List>
                            {searchResults.map((stock) => (
                                <ListItem
                                    key={stock.symbol}
                                    button
                                    onClick={() => handleAddStock(stock.symbol)}
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
                        <Button onClick={() => setOpenAddStockDialog(false)}>Cancel</Button>
                        <Button onClick={handleSearchStocks} variant="contained">
                            Search
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default WatchlistPage; 