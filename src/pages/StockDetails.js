import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Container, Typography, Paper, Grid, Button,
    ButtonGroup, CircularProgress, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
    Divider
} from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const INTERVALS = ['1min', '5min', '15min', '30min', '1h', '1day', '1week'];

const StockDetails = () => {
    const { symbol } = useParams();
    const [stockData, setStockData] = useState(null);
    const [quote, setQuote] = useState(null);
    const [selectedInterval, setSelectedInterval] = useState('1h');
    const [loading, setLoading] = useState(true);
    const { user, login: updateAuth } = useAuth();
    const [openBuyDialog, setOpenBuyDialog] = useState(false);
    const [openSellDialog, setOpenSellDialog] = useState(false);
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [holdings, setHoldings] = useState(null);
    const [fundamentals, setFundamentals] = useState(null);
    const [financials, setFinancials] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchStockData(),
                    fetchQuote(),
                    fetchHoldings(),
                    fetchFundamentals(),
                    fetchFinancials()
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
            setLoading(false);
        };
        
        fetchData();
    }, [symbol]);

    useEffect(() => {
        if (success) {
            fetchHoldings();
        }
    }, [success]);

    const fetchStockData = async () => {
        try {
            const response = await api.get(`/stocks/${symbol}/data?interval=${selectedInterval}`);
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    };

    const fetchQuote = async () => {
        try {
            const response = await api.get(`/stocks/${symbol}/quote`);
            setQuote(response.data);
        } catch (error) {
            console.error('Error fetching quote:', error);
        }
    };

    const fetchHoldings = async () => {
        try {
            const response = await api.get(`/holdings/${symbol}`);
            setHoldings(response.data);
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching holding:', error);
            }
        }
    };

    const fetchFundamentals = async () => {
        try {
            const response = await api.get(`/stocks/${symbol}/fundamentals`);
            setFundamentals(response.data);
        } catch (error) {
            console.error('Error fetching fundamentals:', error);
        }
    };

    const fetchFinancials = async () => {
        try {
            const response = await api.get(`/stocks/${symbol}/financials`);
            setFinancials(response.data);
        } catch (error) {
            console.error('Error fetching financials:', error);
        }
    };

    const handleBuy = async () => {
        try {
            const response = await api.post('/transactions/buy', {
                symbol,
                quantity: parseFloat(quantity),
                price: quote.close
            });
            updateAuth({ ...user, balance: response.data.user.balance }, localStorage.getItem('token'));
            setSuccess('Successfully bought stocks!');
            fetchHoldings();
            setOpenBuyDialog(false);
            setQuantity('');
        } catch (error) {
            console.error('Error buying stock:', error);
            setError(error.response?.data?.message || 'Failed to buy stock');
        }
    };

    const handleSell = async () => {
        try {
            const response = await api.post('/transactions/sell', {
                symbol,
                quantity: parseFloat(quantity),
                price: quote.close
            });
            updateAuth({ ...user, balance: response.data.user.balance }, localStorage.getItem('token'));
            setSuccess('Successfully sold stocks!');
            fetchHoldings();
            setOpenSellDialog(false);
            setQuantity('');
        } catch (error) {
            console.error('Error selling stock:', error);
            setError(error.response?.data?.message || 'Failed to sell stock');
        }
    };

    const handleQuantityChange = (e) => {
        const value = e.target.value;
        setQuantity(value);
        setError(''); // Clear any previous errors
    };

    const renderFundamentals = () => {
        if (!fundamentals) return null;

        return (
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Company Fundamentals
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Market Cap
                                    </Typography>
                                    <Typography variant="h6">
                                        ${(parseFloat(fundamentals.MarketCapitalization) / 1e9).toFixed(2)}B
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        P/E Ratio
                                    </Typography>
                                    <Typography variant="h6">
                                        {fundamentals.PERatio || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Dividend Yield
                                    </Typography>
                                    <Typography variant="h6">
                                        {fundamentals.DividendYield ? `${(parseFloat(fundamentals.DividendYield) * 100).toFixed(2)}%` : 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Beta
                                    </Typography>
                                    <Typography variant="h6">
                                        {fundamentals.Beta || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Book Value
                                    </Typography>
                                    <Typography variant="h6">
                                        ${fundamentals.BookValue || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        EPS
                                    </Typography>
                                    <Typography variant="h6">
                                        ${fundamentals.EPS || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        );
    };

    const renderFinancials = () => {
        if (!financials?.annualReports) return null;

        const last5Years = financials.annualReports.slice(0, 5);
        const chartData = last5Years.map(report => ({
            year: report.fiscalDateEnding.split('-')[0],
            operatingCashFlow: parseFloat(report.operatingCashflow) / 1e6,
            netIncome: parseFloat(report.netIncome) / 1e6
        })).reverse();

        return (
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Financial Performance (in Millions USD)
                    </Typography>
                    <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => `$${value.toFixed(2)}M`}
                                    labelStyle={{ color: 'black' }}
                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="operatingCashFlow" 
                                    name="Operating Cash Flow" 
                                    fill="#8884d8"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar 
                                    dataKey="netIncome" 
                                    name="Net Income" 
                                    fill="#82ca9d"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Grid>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Stock Info Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                {symbol}
                            </Typography>
                            {quote && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Current Price
                                                </Typography>
                                                <Typography variant="h5">
                                                    ${parseFloat(quote.close).toFixed(2)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Change
                                                </Typography>
                                                <Typography 
                                                    variant="h5"
                                                    color={quote.percent_change >= 0 ? 'success.main' : 'error.main'}
                                                >
                                                    {quote.percent_change >= 0 ? '+' : ''}
                                                    {parseFloat(quote.percent_change).toFixed(2)}%
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Volume
                                                </Typography>
                                                <Typography variant="h5">
                                                    {parseInt(quote.volume).toLocaleString()}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Market Cap
                                                </Typography>
                                                <Typography variant="h5">
                                                    ${(parseFloat(quote.close) * parseInt(quote.volume)).toLocaleString()}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    {/* Chart Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <ButtonGroup sx={{ mb: 2 }}>
                                {INTERVALS.map((interval) => (
                                    <Button
                                        key={interval}
                                        variant={selectedInterval === interval ? 'contained' : 'outlined'}
                                        onClick={() => setSelectedInterval(interval)}
                                    >
                                        {interval}
                                    </Button>
                                ))}
                            </ButtonGroup>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={stockData}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="time"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                        />
                                        <YAxis domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#8884d8"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Fundamentals Section */}
                    {renderFundamentals()}

                    {/* Financials Section */}
                    {renderFinancials()}

                    {/* Trading Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Trading
                            </Typography>
                            <Box mb={2}>
                                <Typography color="textSecondary">
                                    Current Holdings: {holdings ? holdings.quantity.toFixed(2) : '0.00'} shares
                                </Typography>
                                <Typography color="textSecondary">
                                    Average Price: ${holdings ? holdings.averagePrice.toFixed(2) : '0.00'}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        size="large"
                                        onClick={() => setOpenBuyDialog(true)}
                                    >
                                        Buy
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        fullWidth
                                        size="large"
                                        onClick={() => setOpenSellDialog(true)}
                                    >
                                        Sell
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Buy Dialog */}
            <Dialog open={openBuyDialog} onClose={() => setOpenBuyDialog(false)}>
                <DialogTitle>Buy {symbol}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography gutterBottom>
                            Current Price: ${quote?.close}
                        </Typography>
                        <Typography gutterBottom>
                            Available Balance: ${user?.balance}
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            error={!!error}
                            helperText={error}
                        />
                        {quantity && quote && (
                            <Typography sx={{ mt: 2 }}>
                                Total Cost: ${(parseFloat(quantity) * quote.close).toFixed(2)}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpenBuyDialog(false);
                        setError('');
                        setQuantity('');
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBuy}
                        variant="contained"
                        color="success"
                        disabled={!quantity || parseFloat(quantity) <= 0}
                    >
                        Buy
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sell Dialog */}
            <Dialog open={openSellDialog} onClose={() => setOpenSellDialog(false)}>
                <DialogTitle>Sell {symbol}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography gutterBottom>
                            Current Price: ${quote?.close || 0}
                        </Typography>
                        <Typography gutterBottom color="textSecondary">
                            Available Shares: {holdings?.quantity || 0}
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={handleQuantityChange}
                            error={!!error || (holdings && parseFloat(quantity) > holdings.quantity)}
                            helperText={
                                error || 
                                (holdings && parseFloat(quantity) > holdings.quantity 
                                    ? 'Insufficient shares' 
                                    : '')
                            }
                            InputProps={{
                                inputProps: { 
                                    min: 0,
                                    max: holdings?.quantity || 0,
                                    step: "0.01"
                                }
                            }}
                        />
                        {quantity && quote && (
                            <Box mt={2}>
                                <Typography color="textSecondary">
                                    Total Value: ${(parseFloat(quantity || 0) * (quote.close || 0)).toFixed(2)}
                                </Typography>
                                <Typography color="textSecondary">
                                    Brokerage (3%): ${((parseFloat(quantity || 0) * (quote.close || 0)) * 0.03).toFixed(2)}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                                    Net Value: ${((parseFloat(quantity || 0) * (quote.close || 0)) * 0.97).toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOpenSellDialog(false);
                        setError('');
                        setQuantity('');
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSell}
                        variant="contained"
                        color="error"
                        disabled={
                            !quantity || 
                            parseFloat(quantity) <= 0 || 
                            !holdings || 
                            parseFloat(quantity) > holdings.quantity ||
                            !quote
                        }
                    >
                        Sell
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Alert */}
            {(success || error) && (
                <Alert 
                    severity={success ? "success" : "error"}
                    sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
                    onClose={() => {
                        setSuccess('');
                        setError('');
                    }}
                >
                    {success || error}
                </Alert>
            )}
        </Box>
    );
};

export default StockDetails; 