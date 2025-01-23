import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    Paper, 
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { getSharedPortfolio } from '../services/api';
import Navbar from '../components/Navbar';

const SharedPortfolio = () => {
    const { shareId } = useParams();
    const [portfolioData, setPortfolioData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stockDetails, setStockDetails] = useState({});

    useEffect(() => {
        fetchPortfolioData();
    }, [shareId]);

    const fetchPortfolioData = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSharedPortfolio(shareId);
            setPortfolioData(data);
            
            // Fetch current stock prices for each holding
            const quotes = {};
            for (const holding of data.holdings) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/stocks/${holding.stockSymbol}/quote`);
                    const quoteData = await response.json();
                    quotes[holding.stockSymbol] = quoteData;
                } catch (err) {
                    console.error(`Error fetching quote for ${holding.stockSymbol}:`, err);
                }
            }
            setStockDetails(quotes);
        } catch (err) {
            setError(err.response?.data || 'Failed to load portfolio data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    };

    const formatPercentage = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00%' : `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
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

    if (error) {
        return (
            <Box>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </Box>
        );
    }

    if (!portfolioData) {
        return (
            <Box>
                <Navbar />
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Alert severity="info">Portfolio not found or link has expired.</Alert>
                </Container>
            </Box>
        );
    }

    // Calculate portfolio summary
    const summary = portfolioData.holdings.reduce((acc, holding) => {
        const currentPrice = parseFloat(stockDetails[holding.stockSymbol]?.close) || 0;
        const quantity = parseFloat(holding.quantity);
        const averagePrice = parseFloat(holding.averagePrice);
        const investmentValue = quantity * averagePrice;
        const currentValue = quantity * currentPrice;
        const profitLoss = currentValue - investmentValue;

        return {
            totalInvestment: acc.totalInvestment + investmentValue,
            currentValue: acc.currentValue + currentValue,
            totalProfitLoss: acc.totalProfitLoss + profitLoss
        };
    }, { totalInvestment: 0, currentValue: 0, totalProfitLoss: 0 });

    return (
        <Box>
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        {portfolioData.userName}'s Portfolio
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Shared portfolio • Valid until {new Date(portfolioData.expiresAt).toLocaleDateString()}
                    </Typography>
                </Paper>

                {/* Portfolio Summary */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Typography color="textSecondary" gutterBottom>
                                Current Value
                            </Typography>
                            <Typography variant="h6">
                                {formatCurrency(summary.currentValue)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Typography color="textSecondary" gutterBottom>
                                Total Investment
                            </Typography>
                            <Typography variant="h6">
                                {formatCurrency(summary.totalInvestment)}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Typography color="textSecondary" gutterBottom>
                                Total P&L
                            </Typography>
                            <Box display="flex" alignItems="center">
                                {summary.totalProfitLoss >= 0 ? 
                                    <TrendingUp color="success" sx={{ mr: 1 }} /> :
                                    <TrendingDown color="error" sx={{ mr: 1 }} />
                                }
                                <Typography 
                                    variant="h6" 
                                    color={summary.totalProfitLoss >= 0 ? "success.main" : "error.main"}
                                >
                                    {formatCurrency(Math.abs(summary.totalProfitLoss))}
                                </Typography>
                            </Box>
                        </Paper>
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
                            {portfolioData.holdings.map((holding) => {
                                const currentPrice = parseFloat(stockDetails[holding.stockSymbol]?.close) || 0;
                                const quantity = parseFloat(holding.quantity);
                                const averagePrice = parseFloat(holding.averagePrice);
                                const currentValue = quantity * currentPrice;
                                const investmentValue = quantity * averagePrice;
                                const profitLoss = currentValue - investmentValue;
                                const profitLossPercent = (profitLoss / investmentValue) * 100;
                                const percentChange = parseFloat(stockDetails[holding.stockSymbol]?.percent_change) || 0;

                                return (
                                    <TableRow key={holding.stockSymbol}>
                                        <TableCell component="th" scope="row">
                                            <Typography variant="body1" fontWeight="medium">
                                                {holding.stockSymbol}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{quantity.toFixed(2)}</TableCell>
                                        <TableCell align="right">{formatCurrency(averagePrice)}</TableCell>
                                        <TableCell align="right">{formatCurrency(currentPrice)}</TableCell>
                                        <TableCell align="right">{formatCurrency(currentValue)}</TableCell>
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
            </Container>
        </Box>
    );
};

export default SharedPortfolio; 