import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import api from '../services/api';

const SharedPortfolio = () => {
    const { userId } = useParams();
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockDetails, setStockDetails] = useState({});
    const [portfolioSummary, setPortfolioSummary] = useState({
        totalInvestment: 0,
        currentValue: 0,
        totalProfitLoss: 0,
        todayProfitLoss: 0
    });

    useEffect(() => {
        fetchSharedPortfolio();
    }, [userId]);

    const fetchSharedPortfolio = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch holdings for the shared portfolio
            const holdingsResponse = await api.get(`/holdings/shared/${userId}`);
            const fetchedHoldings = holdingsResponse.data;
            setHoldings(fetchedHoldings);

            // Fetch current stock quotes for each holding
            const quotes = {};
            await Promise.all(
                fetchedHoldings.map(async (holding) => {
                    try {
                        const quoteResponse = await api.get(`/stocks/${holding.stockSymbol}/quote`);
                        quotes[holding.stockSymbol] = quoteResponse.data;
                    } catch (error) {
                        console.error(`Error fetching quote for ${holding.stockSymbol}:`, error);
                    }
                })
            );
            setStockDetails(quotes);
        } catch (error) {
            console.error('Error fetching shared portfolio:', error);
            setError('Failed to load portfolio. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (holdings.length > 0 && Object.keys(stockDetails).length > 0) {
            const summary = holdings.reduce((acc, holding) => {
                const quote = stockDetails[holding.stockSymbol];
                if (quote) {
                    const currentValue = holding.quantity * quote.close;
                    const investment = holding.quantity * holding.averagePrice;
                    const profitLoss = currentValue - investment;
                    const todayChange = holding.quantity * (quote.close - quote.previousClose);

                    return {
                        totalInvestment: acc.totalInvestment + investment,
                        currentValue: acc.currentValue + currentValue,
                        totalProfitLoss: acc.totalProfitLoss + profitLoss,
                        todayProfitLoss: acc.todayProfitLoss + todayChange
                    };
                }
                return acc;
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    const formatPercentage = (value) => {
        return `${(value * 100).toFixed(2)}%`;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Portfolio Overview
            </Typography>

            {/* Portfolio Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Investment
                            </Typography>
                            <Typography variant="h5">
                                {formatCurrency(portfolioSummary.totalInvestment)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Current Value
                            </Typography>
                            <Typography variant="h5">
                                {formatCurrency(portfolioSummary.currentValue)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Profit/Loss
                            </Typography>
                            <Box display="flex" alignItems="center">
                                <Typography variant="h5" color={portfolioSummary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                                    {formatCurrency(portfolioSummary.totalProfitLoss)}
                                </Typography>
                                {portfolioSummary.totalProfitLoss >= 0 ? 
                                    <TrendingUpIcon color="success" /> : 
                                    <TrendingDownIcon color="error" />
                                }
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Today's Profit/Loss
                            </Typography>
                            <Box display="flex" alignItems="center">
                                <Typography variant="h5" color={portfolioSummary.todayProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                                    {formatCurrency(portfolioSummary.todayProfitLoss)}
                                </Typography>
                                {portfolioSummary.todayProfitLoss >= 0 ? 
                                    <TrendingUpIcon color="success" /> : 
                                    <TrendingDownIcon color="error" />
                                }
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
                            <TableCell>Symbol</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Average Price</TableCell>
                            <TableCell>Current Price</TableCell>
                            <TableCell>Total Value</TableCell>
                            <TableCell>Profit/Loss</TableCell>
                            <TableCell>Change (%)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const quote = stockDetails[holding.stockSymbol] || {};
                            const currentValue = holding.quantity * quote.close;
                            const investment = holding.quantity * holding.averagePrice;
                            const profitLoss = currentValue - investment;
                            const profitLossPercent = investment !== 0 ? profitLoss / investment : 0;

                            return (
                                <TableRow key={holding.id}>
                                    <TableCell>{holding.stockSymbol}</TableCell>
                                    <TableCell>{holding.quantity}</TableCell>
                                    <TableCell>{formatCurrency(holding.averagePrice)}</TableCell>
                                    <TableCell>{formatCurrency(quote.close || 0)}</TableCell>
                                    <TableCell>{formatCurrency(currentValue)}</TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <Typography color={profitLoss >= 0 ? 'success.main' : 'error.main'}>
                                                {formatCurrency(profitLoss)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography color={profitLossPercent >= 0 ? 'success.main' : 'error.main'}>
                                            {formatPercentage(profitLossPercent)}
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

export default SharedPortfolio; 