import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Container, Typography, Paper, Grid, List, ListItem,
    ListItemText, IconButton, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, Card, CardContent
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Navbar from '../components/Navbar';

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
            const response = await fetch('http://localhost:8080/api/watchlists', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setWatchlists(data);
                if (data.length > 0 && !selectedWatchlist) {
                    setSelectedWatchlist(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching watchlists:', error);
        }
    };

    const handleCreateWatchlist = async () => {
        try {
            if (!newWatchlistName.trim()) {
                return; // Don't create empty watchlist
            }

            const response = await fetch('http://localhost:8080/api/watchlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: newWatchlistName,
                    stockSymbols: [] // Add this to match backend expectation
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Created watchlist:', data);
                await fetchWatchlists();
                setOpenCreateDialog(false);
                setNewWatchlistName('');
            } else {
                console.error('Failed to create watchlist:', response.status);
            }
        } catch (error) {
            console.error('Error creating watchlist:', error);
        }
    };

    const handleSearchStocks = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/stocks/search?symbol=${searchQuery}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.data || []);
            }
        } catch (error) {
            console.error('Error searching stocks:', error);
        }
    };

    const handleAddStock = async (symbol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/watchlists/${selectedWatchlist.id}/stocks/${symbol}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                await fetchWatchlists();
                setOpenAddStockDialog(false);
                setSearchQuery('');
            }
        } catch (error) {
            console.error('Error adding stock:', error);
        }
    };

    const handleRemoveStock = async (symbol) => {
        try {
            const response = await fetch(`http://localhost:8080/api/watchlists/${selectedWatchlist.id}/stocks/${symbol}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                await fetchWatchlists();
            }
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