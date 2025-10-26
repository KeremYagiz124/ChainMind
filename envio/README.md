# ChainMind Envio Indexer

Multi-chain blockchain indexer for ChainMind DeFi platform using Envio.

## Overview

This indexer tracks ChainMind smart contract events across multiple chains:
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)

## Indexed Events

### ChainMindRegistry Contract
- `UserRegistered`: Track new user registrations
- `PortfolioUpdated`: Monitor portfolio value changes
- `AlertCreated`: Index user alerts and notifications

### ChainMindToken Contract
- `Transfer`: Track token transfers
- `Approval`: Monitor token approvals

## Entities

- **UserStats**: Aggregated user statistics (registration, portfolio value, alerts)
- **PortfolioUpdated**: Historical portfolio snapshots
- **AlertCreated**: User alert history
- **Transfer**: Token transfer events
- **Approval**: Token approval events
- **TokenBalance**: Current token balances per address

## Setup

1. Install Envio CLI:
```bash
npm install -g envio
```

2. Initialize the indexer:
```bash
cd envio
envio init
```

3. Update contract addresses in `config.yaml` after deployment

4. Generate types:
```bash
envio codegen
```

5. Start the indexer:
```bash
envio dev
```

## GraphQL Endpoint

After deployment, your GraphQL endpoint will be available at:
```
https://indexer.bigdevenergy.link/YOUR_INDEXER_ID/v1/graphql
```

Update `REACT_APP_ENVIO_ENDPOINT` in frontend `.env` file.

## Example Queries

### Get User Stats
```graphql
query {
  UserStats(where: { user: { _eq: "0x..." } }) {
    user
    registeredAt
    totalPortfolioValue
    alertCount
  }
}
```

### Get Portfolio History
```graphql
query {
  PortfolioUpdated(
    where: { user: { _eq: "0x..." } }
    order_by: { timestamp: desc }
    limit: 50
  ) {
    totalValue
    timestamp
    chainId
  }
}
```

### Multi-chain Activity
```graphql
query {
  ethereum: PortfolioUpdated(where: { chainId: { _eq: 1 } }) { totalValue }
  polygon: PortfolioUpdated(where: { chainId: { _eq: 137 } }) { totalValue }
  arbitrum: PortfolioUpdated(where: { chainId: { _eq: 42161 } }) { totalValue }
}
```

## Integration

The frontend uses Apollo Client to query the Envio GraphQL API:

```typescript
import { useEnvio } from '@/hooks/useEnvio';

function MyComponent() {
  const { userStats, portfolioHistory, loading } = useEnvio();
  
  // Use the data...
}
```

## Deployment

1. Deploy contracts to all chains
2. Update contract addresses in `config.yaml`
3. Deploy indexer:
```bash
envio deploy
```

4. Update frontend environment variable with GraphQL endpoint

## Documentation

- [Envio Documentation](https://docs.envio.dev/)
- [GraphQL API Reference](https://docs.envio.dev/docs/graphql-api)
