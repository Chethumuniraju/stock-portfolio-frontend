import { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Grid, Button,
    TextField, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Dialog, DialogTitle,
    DialogContent, DialogActions, Alert, Card, CardContent,
    IconButton, Tooltip
} from '@mui/material';
import { AccountBalance, History, Add, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Profile = () => {
    const { user, login: updateAuth } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [openTopup, setOpenTopup] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleTopup = async () => {
        setError('');
        setSuccess('');
        
        if (!topupAmount || parseFloat(topupAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await api.post('/users/topup', { amount: parseFloat(topupAmount) });
            updateAuth({ ...user, balance: response.data.balance }, token);
            setSuccess(`Successfully added $${topupAmount}`);
            setOpenTopup(false);
            setTopupAmount('');
        } catch (error) {
            console.error('Top-up error:', error);
            setError(error.response?.data?.message || 'Failed to top up');
        }
    };

    // Calculate total profit/loss
    const totalProfitLoss = transactions.reduce((total, t) => {
        if (t.type === 'SELL') {
            return total + t.total;
        } else if (t.type === 'BUY') {
            return total - t.total;
        }
        return total;
    }, 0);

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                
                <Grid container spacing={3}>
                    {/* User Info Cards */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <AccountBalance sx={{ mr: 1 }} />
                                    <Typography variant="h6">Balance</Typography>
                                </Box>
                                <Typography variant="h4" color="primary">
                                    ${user.balance.toFixed(2)}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    sx={{ mt: 2 }}
                                    onClick={() => setOpenTopup(true)}
                                >
                                    Top Up
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <History sx={{ mr: 1 }} />
                                    <Typography variant="h6">Total Transactions</Typography>
                                </Box>
                                <Typography variant="h4">
                                    {transactions.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    {totalProfitLoss >= 0 ? <TrendingUp sx={{ mr: 1 }} /> : <TrendingDown sx={{ mr: 1 }} />}
                                    <Typography variant="h6">Total P/L</Typography>
                                </Box>
                                <Typography 
                                    variant="h4" 
                                    color={totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                                >
                                    ${totalProfitLoss.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* User Details */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom>Profile Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Typography color="textSecondary">Name</Typography>
                                    <Typography variant="h6">{user.name}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography color="textSecondary">Email</Typography>
                                    <Typography variant="h6">{user.email}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography color="textSecondary">Mobile</Typography>
                                    <Typography variant="h6">{user.mobileNo}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Transaction History */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>Transaction History</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Symbol</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    {new Date(transaction.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography
                                                        color={transaction.type === 'BUY' ? 'success.main' : 'error.main'}
                                                    >
                                                        {transaction.type}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{transaction.stockSymbol}</TableCell>
                                                <TableCell align="right">{transaction.quantity}</TableCell>
                                                <TableCell align="right">${transaction.price.toFixed(2)}</TableCell>
                                                <TableCell align="right">${transaction.total.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Top Up Dialog */}
                <Dialog open={openTopup} onClose={() => setOpenTopup(false)}>
                    <DialogTitle>Top Up Balance</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Amount"
                            type="number"
                            fullWidth
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            error={!!error}
                            helperText={error}
                            InputProps={{
                                startAdornment: <Typography>$</Typography>
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setOpenTopup(false);
                            setError('');
                            setTopupAmount('');
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleTopup} 
                            variant="contained"
                            disabled={!topupAmount || parseFloat(topupAmount) <= 0}
                        >
                            Top Up
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default Profile; 