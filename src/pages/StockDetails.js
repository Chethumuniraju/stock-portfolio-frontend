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
            // Transform data for chart
            const chartData = response.data?.values?.map(item => ({
                time: new Date(item.datetime).toLocaleString(),
                price: parseFloat(item.close),
                volume: parseInt(item.volume),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                open: parseFloat(item.open)
            })) || [];
            setStockData(chartData.reverse());
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

    const formatNumber = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
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

    const renderPriceChart = () => {
        if (!stockData || stockData.length === 0) return null;

        return (
            <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Price History
                    </Typography>
                    <ButtonGroup 
                        variant="outlined" 
                        size="small" 
                        sx={{ mb: 2 }}
                    >
                        {INTERVALS.map((interval) => (
                            <Button
                                key={interval}
                                onClick={() => setSelectedInterval(interval)}
                                variant={selectedInterval === interval ? 'contained' : 'outlined'}
                            >
                                {interval}
                            </Button>
                        ))}
                    </ButtonGroup>
                    <Box sx={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <LineChart data={stockData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="time"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                />
                                <YAxis 
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="price" 
                                    stroke="#8884d8" 
                                    dot={false}
                                    name="Price"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
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
                        Financial Performance
                    </Typography>
                    <Box sx={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis 
                                    label={{ 
                                        value: 'USD (Millions)', 
                                        angle: -90, 
                                        position: 'insideLeft' 
                                    }}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="operatingCashFlow" fill="#8884d8" name="Operating Cash Flow" />
                                <Bar dataKey="netIncome" fill="#82ca9d" name="Net Income" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>
            </Grid>
        );
    };

    if (loading) {
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
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                <Grid container spacing={3}>
                    {/* Stock Info */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                    <Typography variant="h4">
                                        {symbol}
                                    </Typography>
                                </Grid>
                                {quote && (
                                    <>
                                        <Grid item>
                                            <Typography variant="h5">
                                                ${formatNumber(quote.close)}
                                            </Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography 
                                                variant="h6"
                                                color={quote.percent_change >= 0 ? 'success.main' : 'error.main'}
                                            >
                                                {quote.percent_change >= 0 ? '+' : ''}
                                                {formatNumber(quote.percent_change)}%
                                            </Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Price Chart */}
                    {renderPriceChart()}

                    {/* Fundamentals */}
                    {renderFundamentals()}

                    {/* Financials */}
                    {renderFinancials()}

                    {/* Trading Actions */}
                    {user && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                            Trading Actions
                                        </Typography>
                                        <ButtonGroup>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => setOpenBuyDialog(true)}
                                            >
                                                Buy
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                onClick={() => setOpenSellDialog(true)}
                                                disabled={!holdings || holdings.quantity <= 0}
                                            >
                                                Sell
                                            </Button>
                                        </ButtonGroup>
                                    </Grid>
                                    {holdings && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle1">
                                                Your Position:
                                            </Typography>
                                            <Typography>
                                                Quantity: {holdings.quantity}
                                            </Typography>
                                            <Typography>
                                                Average Price: ${holdings.averagePrice?.toFixed(2)}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                {/* Buy Dialog */}
                <Dialog open={openBuyDialog} onClose={() => setOpenBuyDialog(false)}>
                    <DialogTitle>Buy {symbol}</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={handleQuantityChange}
                            inputProps={{ min: 0, step: 0.01 }}
                        />
                        {quote && quantity && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Total Cost: ${(quote.close * parseFloat(quantity || 0)).toFixed(2)}
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenBuyDialog(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBuy}
                            variant="contained"
                            disabled={
                                !quantity || 
                                parseFloat(quantity) <= 0 || 
                                !quote || 
                                !user || 
                                (quote.close * parseFloat(quantity)) > user.balance
                            }
                        >
                            Buy
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Sell Dialog */}
                <Dialog open={openSellDialog} onClose={() => setOpenSellDialog(false)}>
                    <DialogTitle>Sell {symbol}</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={handleQuantityChange}
                            inputProps={{ 
                                min: 0, 
                                max: holdings?.quantity || 0,
                                step: 0.01
                            }}
                        />
                        {quote && quantity && (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Total Value: ${(quote.close * parseFloat(quantity || 0)).toFixed(2)}
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenSellDialog(false)}>
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
            </Container>
        </Box>
    );
};

export default StockDetails; 