import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Envio GraphQL endpoint (update after deployment)
const ENVIO_GRAPHQL_ENDPOINT = process.env.REACT_APP_ENVIO_ENDPOINT || 'https://indexer.bigdevenergy.link/YOUR_INDEXER_ID/v1/graphql';

export const envioClient = new ApolloClient({
  uri: ENVIO_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

// GraphQL Queries
export const GET_USER_STATS = gql`
  query GetUserStats($userAddress: String!) {
    UserStats(where: { user: { _eq: $userAddress } }) {
      id
      user
      registeredAt
      lastActive
      totalPortfolioValue
      alertCount
    }
  }
`;

export const GET_USER_PORTFOLIO_HISTORY = gql`
  query GetUserPortfolioHistory($userAddress: String!, $limit: Int = 100) {
    PortfolioUpdated(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      user
      totalValue
      timestamp
      chainId
      blockNumber
      transactionHash
    }
  }
`;

export const GET_USER_ALERTS = gql`
  query GetUserAlerts($userAddress: String!, $limit: Int = 50) {
    AlertCreated(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      user
      alertType
      timestamp
      chainId
      blockNumber
      transactionHash
    }
  }
`;

export const GET_TOKEN_TRANSFERS = gql`
  query GetTokenTransfers($userAddress: String!, $limit: Int = 100) {
    Transfer(
      where: {
        _or: [
          { from: { _eq: $userAddress } }
          { to: { _eq: $userAddress } }
        ]
      }
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      from
      to
      value
      timestamp
      chainId
      blockNumber
      transactionHash
    }
  }
`;

export const GET_TOKEN_BALANCE = gql`
  query GetTokenBalance($userAddress: String!) {
    TokenBalance(where: { address: { _eq: $userAddress } }) {
      id
      address
      balance
      lastUpdated
    }
  }
`;

export const GET_RECENT_REGISTRATIONS = gql`
  query GetRecentRegistrations($limit: Int = 20) {
    UserRegistered(
      order_by: { timestamp: desc }
      limit: $limit
    ) {
      id
      user
      timestamp
      chainId
      blockNumber
      transactionHash
    }
  }
`;

export const GET_MULTI_CHAIN_ACTIVITY = gql`
  query GetMultiChainActivity($userAddress: String!) {
    ethereum: PortfolioUpdated(
      where: { user: { _eq: $userAddress }, chainId: { _eq: 1 } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      totalValue
      timestamp
      chainId
    }
    polygon: PortfolioUpdated(
      where: { user: { _eq: $userAddress }, chainId: { _eq: 137 } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      totalValue
      timestamp
      chainId
    }
    arbitrum: PortfolioUpdated(
      where: { user: { _eq: $userAddress }, chainId: { _eq: 42161 } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      totalValue
      timestamp
      chainId
    }
    optimism: PortfolioUpdated(
      where: { user: { _eq: $userAddress }, chainId: { _eq: 10 } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      totalValue
      timestamp
      chainId
    }
    base: PortfolioUpdated(
      where: { user: { _eq: $userAddress }, chainId: { _eq: 8453 } }
      order_by: { timestamp: desc }
      limit: 1
    ) {
      totalValue
      timestamp
      chainId
    }
  }
`;

// Helper functions
export async function getUserStats(userAddress: string) {
  const { data } = await envioClient.query({
    query: GET_USER_STATS,
    variables: { userAddress },
  });
  return data.UserStats[0] || null;
}

export async function getUserPortfolioHistory(userAddress: string, limit = 100) {
  const { data } = await envioClient.query({
    query: GET_USER_PORTFOLIO_HISTORY,
    variables: { userAddress, limit },
  });
  return data.PortfolioUpdated || [];
}

export async function getUserAlerts(userAddress: string, limit = 50) {
  const { data } = await envioClient.query({
    query: GET_USER_ALERTS,
    variables: { userAddress, limit },
  });
  return data.AlertCreated || [];
}

export async function getTokenTransfers(userAddress: string, limit = 100) {
  const { data } = await envioClient.query({
    query: GET_TOKEN_TRANSFERS,
    variables: { userAddress, limit },
  });
  return data.Transfer || [];
}

export async function getMultiChainActivity(userAddress: string) {
  const { data } = await envioClient.query({
    query: GET_MULTI_CHAIN_ACTIVITY,
    variables: { userAddress },
  });
  return {
    ethereum: data.ethereum[0] || null,
    polygon: data.polygon[0] || null,
    arbitrum: data.arbitrum[0] || null,
    optimism: data.optimism[0] || null,
    base: data.base[0] || null,
  };
}
