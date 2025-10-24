import {
  users,
  telegramConnections,
  orders,
  groups,
  transactions,
  paymentSettings,
  walletAddresses,
  autoMessages,
  type User,
  type UpsertUser,
  type TelegramConnection,
  type InsertTelegramConnection,
  type Order,
  type InsertOrder,
  type Group,
  type Transaction,
  type InsertTransaction,
  type PaymentSetting,
  type InsertPaymentSetting,
  type WalletAddress,
  type InsertWalletAddress,
  type AutoMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserBalance(userId: string, amount: string): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  
  // Telegram connection operations
  getTelegramConnections(userId: string): Promise<TelegramConnection[]>;
  getActiveTelegramConnection(userId: string): Promise<TelegramConnection | undefined>;
  createTelegramConnection(connection: InsertTelegramConnection): Promise<TelegramConnection>;
  deleteTelegramConnection(id: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getRecentOrdersByUser(userId: string, limit: number): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: string, groupsCreated?: number, errorMessage?: string): Promise<Order>;
  
  // Group operations
  createGroup(group: { orderId: string; userId: string; groupName: string; telegramGroupId?: string; inviteLink?: string }): Promise<Group>;
  getGroupsByOrder(orderId: string): Promise<Group[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction>;
  
  // Payment settings operations
  getPaymentSettings(): Promise<PaymentSetting | undefined>;
  updatePaymentSettings(settings: InsertPaymentSetting): Promise<PaymentSetting>;
  
  // Wallet address operations
  getWalletAddresses(): Promise<WalletAddress[]>;
  getActiveWalletAddresses(): Promise<WalletAddress[]>;
  createWalletAddress(wallet: InsertWalletAddress): Promise<WalletAddress>;
  updateWalletAddress(id: string, wallet: Partial<InsertWalletAddress>): Promise<WalletAddress>;
  deleteWalletAddress(id: string): Promise<void>;
  
  // Auto message operations
  createAutoMessage(groupId: string, message: string): Promise<AutoMessage>;
  getAutoMessagesByGroup(groupId: string): Promise<AutoMessage[]>;
  
  // Admin balance operations
  adminAddBalance(userId: string, amount: string): Promise<User>;
  adminApprovePayment(transactionId: string): Promise<Transaction>;
  
  // Stats operations
  getUserStats(userId: string): Promise<{
    balance: string;
    totalGroups: number;
    activeOrders: number;
    completedOrders: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  async createUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
      })
      .returning();
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserBalance(userId: string, amount: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Telegram connection operations
  async getTelegramConnections(userId: string): Promise<TelegramConnection[]> {
    return await db
      .select()
      .from(telegramConnections)
      .where(eq(telegramConnections.userId, userId))
      .orderBy(desc(telegramConnections.createdAt));
  }

  async getActiveTelegramConnection(userId: string): Promise<TelegramConnection | undefined> {
    const [connection] = await db
      .select()
      .from(telegramConnections)
      .where(
        and(
          eq(telegramConnections.userId, userId),
          eq(telegramConnections.isActive, true)
        )
      );
    return connection;
  }

  async createTelegramConnection(connectionData: InsertTelegramConnection): Promise<TelegramConnection> {
    const [connection] = await db
      .insert(telegramConnections)
      .values(connectionData)
      .returning();
    return connection;
  }

  async deleteTelegramConnection(id: string): Promise<void> {
    await db.delete(telegramConnections).where(eq(telegramConnections.id, id));
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(orderData)
      .returning();
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getRecentOrdersByUser(userId: string, limit: number = 5): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    groupsCreated?: number,
    errorMessage?: string
  ): Promise<Order> {
    const updateData: any = {
      status,
      ...(groupsCreated !== undefined && { groupsCreated }),
      ...(errorMessage && { errorMessage }),
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  // Group operations
  async createGroup(groupData: {
    orderId: string;
    userId: string;
    groupName: string;
    telegramGroupId?: string;
    inviteLink?: string;
  }): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values(groupData)
      .returning();
    return group;
  }

  async getGroupsByOrder(orderId: string): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(eq(groups.orderId, orderId));
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(100);
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({
        status,
        ...(txHash && { txHash }),
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSetting | undefined> {
    const [setting] = await db
      .select()
      .from(paymentSettings)
      .limit(1);
    return setting;
  }

  async updatePaymentSettings(settingsData: InsertPaymentSetting): Promise<PaymentSetting> {
    const existing = await this.getPaymentSettings();
    
    if (existing) {
      const [updated] = await db
        .update(paymentSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(paymentSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(paymentSettings)
        .values(settingsData)
        .returning();
      return created;
    }
  }

  // Wallet address operations
  async getWalletAddresses(): Promise<WalletAddress[]> {
    return await db
      .select()
      .from(walletAddresses)
      .orderBy(desc(walletAddresses.createdAt));
  }

  async getActiveWalletAddresses(): Promise<WalletAddress[]> {
    return await db
      .select()
      .from(walletAddresses)
      .where(eq(walletAddresses.isActive, true))
      .orderBy(desc(walletAddresses.createdAt));
  }

  async createWalletAddress(walletData: InsertWalletAddress): Promise<WalletAddress> {
    const [wallet] = await db
      .insert(walletAddresses)
      .values(walletData)
      .returning();
    return wallet;
  }

  async updateWalletAddress(id: string, walletData: Partial<InsertWalletAddress>): Promise<WalletAddress> {
    const [wallet] = await db
      .update(walletAddresses)
      .set({ ...walletData, updatedAt: new Date() })
      .where(eq(walletAddresses.id, id))
      .returning();
    return wallet;
  }

  async deleteWalletAddress(id: string): Promise<void> {
    await db.delete(walletAddresses).where(eq(walletAddresses.id, id));
  }

  // Auto message operations
  async createAutoMessage(groupId: string, message: string): Promise<AutoMessage> {
    const [autoMessage] = await db
      .insert(autoMessages)
      .values({ groupId, message })
      .returning();
    return autoMessage;
  }

  async getAutoMessagesByGroup(groupId: string): Promise<AutoMessage[]> {
    return await db
      .select()
      .from(autoMessages)
      .where(eq(autoMessages.groupId, groupId))
      .orderBy(desc(autoMessages.sentAt));
  }

  // Admin balance operations
  async adminAddBalance(userId: string, amount: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Create transaction record
    await this.createTransaction({
      userId,
      type: 'credit',
      amount,
      description: 'Admin balance addition',
      status: 'completed',
    });
    
    return user;
  }

  async adminApprovePayment(transactionId: string): Promise<Transaction> {
    const transaction = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1)
      .then(rows => rows[0]);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.type === 'credit' && transaction.status === 'pending') {
      await this.updateUserBalance(transaction.userId, transaction.amount);
    }

    return await this.updateTransactionStatus(transactionId, 'completed');
  }

  // Stats operations
  async getUserStats(userId: string): Promise<{
    balance: string;
    totalGroups: number;
    activeOrders: number;
    completedOrders: number;
  }> {
    const user = await this.getUser(userId);
    
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    const totalGroupsCreated = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups)
      .where(eq(groups.userId, userId));

    const activeOrdersCount = userOrders.filter(
      o => o.status === 'pending' || o.status === 'processing'
    ).length;

    const completedOrdersCount = userOrders.filter(
      o => o.status === 'completed'
    ).length;

    return {
      balance: user?.balance || '0.00',
      totalGroups: totalGroupsCreated[0]?.count || 0,
      activeOrders: activeOrdersCount,
      completedOrders: completedOrdersCount,
    };
  }
}

export const storage = new DatabaseStorage();
