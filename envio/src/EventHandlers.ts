import {
  ChainMindRegistry,
  ChainMindToken,
  UserRegistered,
  PortfolioUpdated,
  AlertCreated,
  Transfer,
  Approval,
} from "generated";

// User Registration Handler
ChainMindRegistry.UserRegistered.handler(async ({ event, context }) => {
  const entity: UserRegistered = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    timestamp: event.params.timestamp,
    chainId: event.chainId,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  };

  context.UserRegistered.set(entity);

  // Update user stats
  const userStats = await context.UserStats.get(event.params.user);
  if (userStats) {
    context.UserStats.set({
      ...userStats,
      lastActive: event.params.timestamp,
    });
  } else {
    context.UserStats.set({
      id: event.params.user,
      user: event.params.user,
      registeredAt: event.params.timestamp,
      lastActive: event.params.timestamp,
      totalPortfolioValue: BigInt(0),
      alertCount: 0,
    });
  }
});

// Portfolio Update Handler
ChainMindRegistry.PortfolioUpdated.handler(async ({ event, context }) => {
  const entity: PortfolioUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    totalValue: event.params.totalValue,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  };

  context.PortfolioUpdated.set(entity);

  // Update user stats
  const userStats = await context.UserStats.get(event.params.user);
  if (userStats) {
    context.UserStats.set({
      ...userStats,
      totalPortfolioValue: event.params.totalValue,
      lastActive: BigInt(event.block.timestamp),
    });
  }
});

// Alert Created Handler
ChainMindRegistry.AlertCreated.handler(async ({ event, context }) => {
  const entity: AlertCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    alertType: event.params.alertType,
    timestamp: event.params.timestamp,
    chainId: event.chainId,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  };

  context.AlertCreated.set(entity);

  // Update user stats
  const userStats = await context.UserStats.get(event.params.user);
  if (userStats) {
    context.UserStats.set({
      ...userStats,
      alertCount: userStats.alertCount + 1,
      lastActive: event.params.timestamp,
    });
  }
});

// Token Transfer Handler
ChainMindToken.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  };

  context.Transfer.set(entity);

  // Update token holder balances
  if (event.params.from !== "0x0000000000000000000000000000000000000000") {
    const fromBalance = await context.TokenBalance.get(event.params.from);
    if (fromBalance) {
      context.TokenBalance.set({
        ...fromBalance,
        balance: fromBalance.balance - event.params.value,
        lastUpdated: BigInt(event.block.timestamp),
      });
    }
  }

  if (event.params.to !== "0x0000000000000000000000000000000000000000") {
    const toBalance = await context.TokenBalance.get(event.params.to);
    if (toBalance) {
      context.TokenBalance.set({
        ...toBalance,
        balance: toBalance.balance + event.params.value,
        lastUpdated: BigInt(event.block.timestamp),
      });
    } else {
      context.TokenBalance.set({
        id: event.params.to,
        address: event.params.to,
        balance: event.params.value,
        lastUpdated: BigInt(event.block.timestamp),
      });
    }
  }
});

// Token Approval Handler
ChainMindToken.Approval.handler(async ({ event, context }) => {
  const entity: Approval = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
    timestamp: BigInt(event.block.timestamp),
    chainId: event.chainId,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  };

  context.Approval.set(entity);
});
