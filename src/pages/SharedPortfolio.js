import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Card,
    CardContent
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
        totalProfitLoss: 0
    });
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        fetchSharedPortfolio();
        fetchUserInfo();
    }, [userId]);

    const fetchUserInfo = async () => {
        try {
            const response = await api.get(`/users/${userId}`);
            setUserInfo(response.data);
        } catch (error) {
            console.error('Error fetching user info:', error);
            setError('Failed to load portfolio information.');
        }
    };

    const fetchSharedPortfolio = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const holdingsResponse = await api.get(`/holdings/shared/${userId}`);
            const fetchedHoldings = holdingsResponse.data;
            setHoldings(fetchedHoldings);

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

                    return {
                        totalInvestment: acc.totalInvestment + investment,
                        currentValue: acc.currentValue + currentValue,
                        totalProfitLoss: acc.totalProfitLoss + profitLoss
                    };
                }
                return acc;
            }, {
                totalInvestment: 0,
                currentValue: 0,
                totalProfitLoss: 0
            });

            setPortfolioSummary(summary);
        }
    }, [holdings, stockDetails]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {userInfo?.name}'s Portfolio
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Shared portfolio • Valid until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" color="text.secondary">
                                Current Value
                            </Typography>
                            <Typography variant="h5">
                                {formatCurrency(portfolioSummary.currentValue)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" color="text.secondary">
                                Total Investment
                            </Typography>
                            <Typography variant="h5">
                                {formatCurrency(portfolioSummary.totalInvestment)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" color="text.secondary">
                                Total P&L
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const quote = stockDetails[holding.stockSymbol] || {};
                            const currentValue = holding.quantity * quote.close;

                            return (
                                <TableRow key={holding.stockSymbol}>
                                    <TableCell>{holding.stockSymbol}</TableCell>
                                    <TableCell align="right">{holding.quantity.toFixed(2)}</TableCell>
                                    <TableCell align="right">{formatCurrency(holding.averagePrice)}</TableCell>
                                    <TableCell align="right">{formatCurrency(quote.close || 0)}</TableCell>
                                    <TableCell align="right">{formatCurrency(currentValue)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default SharedPortfolio; 