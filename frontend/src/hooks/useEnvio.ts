import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  getUserStats,
  getUserPortfolioHistory,
  getUserAlerts,
  getTokenTransfers,
  getMultiChainActivity,
} from '../services/envioClient';
import { logger } from '../utils/logger';

export const useEnvio = () => {
  const { address } = useAccount();
  const [userStats, setUserStats] = useState<any>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [multiChainActivity, setMultiChainActivity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUserStats(null);
      setPortfolioHistory([]);
      setAlerts([]);
      setTransfers([]);
      setMultiChainActivity(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [stats, history, userAlerts, userTransfers, activity] = await Promise.all([
          getUserStats(address),
          getUserPortfolioHistory(address, 50),
          getUserAlerts(address, 20),
          getTokenTransfers(address, 50),
          getMultiChainActivity(address),
        ]);

        setUserStats(stats);
        setPortfolioHistory(history);
        setAlerts(userAlerts);
        setTransfers(userTransfers);
        setMultiChainActivity(activity);
      } catch (err) {
        logger.error('Error fetching Envio data:', err);
        setError('Failed to fetch blockchain data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const refreshData = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const [stats, history, userAlerts, userTransfers, activity] = await Promise.all([
        getUserStats(address),
        getUserPortfolioHistory(address, 50),
        getUserAlerts(address, 20),
        getTokenTransfers(address, 50),
        getMultiChainActivity(address),
      ]);

      setUserStats(stats);
      setPortfolioHistory(history);
      setAlerts(userAlerts);
      setTransfers(userTransfers);
      setMultiChainActivity(activity);
    } catch (err) {
      logger.error('Error refreshing Envio data:', err);
      setError('Failed to refresh blockchain data');
    } finally {
      setLoading(false);
    }
  };

  return {
    userStats,
    portfolioHistory,
    alerts,
    transfers,
    multiChainActivity,
    loading,
    error,
    refreshData,
  };
};
