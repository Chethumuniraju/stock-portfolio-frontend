import React, { useState, useEffect, useRef } from 'react';
import { 
    Card, CardContent, Typography, Box, Grid,
    Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Paper, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import api from '../services/api';

const HoldingsList = () => {
    const navigate = useNavigate();
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stockDetails, setStockDetails] = useState({});
    const [portfolioSummary, setPortfolioSummary] = useState({
        totalInvestment: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        todayProfitLoss: 0
    });
    
    // Use refs to track the latest request
    const currentRequestId = useRef(0);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchHoldings = async () => {
        const requestId = ++currentRequestId.current;
        
        try {
            setLoading(true);
            
            // Fetch holdings first
            const holdingsResponse = await api.get('/holdings');
            
            // Check if this is still the latest request
            if (!isMounted.current || requestId !== currentRequestId.current) {
                return;
            }
            
            const holdingsData = holdingsResponse.data;
            setHoldings(holdingsData);
            
            // Fetch all quotes in parallel
            const quotePromises = holdingsData.map(holding => 
                api.get(`/stocks/${holding.stockSymbol}/quote`)
                    .then(response => ({ 
                        symbol: holding.stockSymbol, 
                        data: response.data 
                    }))
                    .catch(error => {
                        console.error(`Error fetching quote for ${holding.stockSymbol}:`, error);
                        return { 
                            symbol: holding.stockSymbol, 
                            data: null 
                        };
                    })
            );
            
            const quoteResults = await Promise.all(quotePromises);
            
            // Check again if this is still the latest request
            if (!isMounted.current || requestId !== currentRequestId.current) {
                return;
            }
            
            // Convert array of results to object
            const quotes = quoteResults.reduce((acc, { symbol, data }) => {
                if (data) {
                    acc[symbol] = data;
                }
                return acc;
            }, {});
            
            setStockDetails(quotes);
        } catch (error) {
            console.error('Error fetching holdings:', error);
            if (isMounted.current && requestId === currentRequestId.current) {
                setHoldings([]);
                setStockDetails({});
            }
        } finally {
            if (isMounted.current && requestId === currentRequestId.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchHoldings();
        const interval = setInterval(fetchHoldings, 30000); // Refresh every 30 seconds
        
        return () => {
            clearInterval(interval);
            currentRequestId.current++; // Cancel any ongoing requests
        };
    }, []);

    useEffect(() => {
        if (holdings.length > 0 && Object.keys(stockDetails).length > 0) {
            const summary = holdings.reduce((acc, holding) => {
                const currentPrice = parseFloat(stockDetails[holding.stockSymbol]?.close) || 0;
                const quantity = parseFloat(holding.quantity) || 0;
                const averagePrice = parseFloat(holding.averagePrice) || 0;
                const investmentValue = quantity * averagePrice;
                const currentValue = quantity * currentPrice;
                const profitLoss = currentValue - investmentValue;
                const todayChange = (parseFloat(stockDetails[holding.stockSymbol]?.percent_change) || 0) * currentValue / 100;

                return {
                    totalInvestment: acc.totalInvestment + investmentValue,
                    currentValue: acc.currentValue + currentValue,
                    totalProfitLoss: acc.totalProfitLoss + profitLoss,
                    todayProfitLoss: acc.todayProfitLoss + todayChange
                };
            }, {
                totalInvestment: 0,
                currentValue: 0,
                totalProfitLoss: 0,
                todayProfitLoss: 0
            });

            setPortfolioSummary(summary);
        }
    }, [holdings, stockDetails]);

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    const formatPercentage = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00%' : `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    };

    if (loading && !holdings.length) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">
                    No holdings found. Start trading to see your portfolio here.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Portfolio Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Current Value
                            </Typography>
                            <Typography variant="h6">
                                {formatCurrency(portfolioSummary.currentValue)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Investment
                            </Typography>
                            <Typography variant="h6">
                                {formatCurrency(portfolioSummary.totalInvestment)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total P&L
                            </Typography>
                            <Box display="flex" alignItems="center">
                                {portfolioSummary.totalProfitLoss >= 0 ? 
                                    <TrendingUpIcon color="success" sx={{ mr: 1 }} /> :
                                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                                }
                                <Typography variant="h6" color={portfolioSummary.totalProfitLoss >= 0 ? "success.main" : "error.main"}>
                                    {formatCurrency(Math.abs(portfolioSummary.totalProfitLoss))}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Today's P&L
                            </Typography>
                            <Box display="flex" alignItems="center">
                                {portfolioSummary.todayProfitLoss >= 0 ? 
                                    <TrendingUpIcon color="success" sx={{ mr: 1 }} /> :
                                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                                }
                                <Typography variant="h6" color={portfolioSummary.todayProfitLoss >= 0 ? "success.main" : "error.main"}>
                                    {formatCurrency(Math.abs(portfolioSummary.todayProfitLoss))}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Holdings Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Stock</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Avg. Price</TableCell>
                            <TableCell align="right">Current Price</TableCell>
                            <TableCell align="right">Current Value</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Change</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const currentPrice = parseFloat(stockDetails[holding.stockSymbol]?.close) || 0;
                            const quantity = parseFloat(holding.quantity) || 0;
                            const averagePrice = parseFloat(holding.averagePrice) || 0;
                            const currentValue = quantity * currentPrice;
                            const investmentValue = quantity * averagePrice;
                            const profitLoss = currentValue - investmentValue;
                            const profitLossPercent = (profitLoss / investmentValue) * 100;
                            const percentChange = parseFloat(stockDetails[holding.stockSymbol]?.percent_change) || 0;

                            return (
                                <TableRow 
                                    key={holding.stockSymbol}
                                    hover
                                    onClick={() => navigate(`/stock/${holding.stockSymbol}`)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body1" fontWeight="medium">
                                            {holding.stockSymbol}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {quantity.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(averagePrice)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(currentPrice)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCurrency(currentValue)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography color={profitLoss >= 0 ? "success.main" : "error.main"}>
                                            {formatCurrency(profitLoss)}
                                            <br />
                                            {formatPercentage(profitLossPercent)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography color={percentChange >= 0 ? "success.main" : "error.main"}>
                                            {formatPercentage(percentChange)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default HoldingsList; 