import {
  type UserType,
  type TelegramConnectionType,
  type InsertTelegramConnection,
  type OrderType,
  type InsertOrder,
  type GroupType,
  type TransactionType,
  type InsertTransaction,
  type PaymentSettingType,
  type InsertPaymentSetting,
  type WalletAddressType,
  type InsertWalletAddress,
  type AutoMessageType,
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<UserType | undefined>;
  getUserByUsername(username: string): Promise<UserType | undefined>;
  createUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<UserType>;
  getAllUsers(): Promise<UserType[]>;
  updateUserBalance(userId: string, amount: number): Promise<UserType>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  
  getTelegramConnections(userId: string): Promise<TelegramConnectionType[]>;
  getActiveTelegramConnection(userId: string): Promise<TelegramConnectionType | undefined>;
  createTelegramConnection(connection: InsertTelegramConnection): Promise<TelegramConnectionType>;
  deleteTelegramConnection(id: string): Promise<void>;
  
  createOrder(order: InsertOrder): Promise<OrderType>;
  getOrdersByUser(userId: string): Promise<OrderType[]>;
  getRecentOrdersByUser(userId: string, limit: number): Promise<OrderType[]>;
  updateOrderStatus(orderId: string, status: string, groupsCreated?: number, errorMessage?: string): Promise<OrderType>;
  
  createGroup(group: { orderId: string; userId: string; groupName: string; telegramGroupId?: string; inviteLink?: string }): Promise<GroupType>;
  getGroupsByOrder(orderId: string): Promise<GroupType[]>;
  
  createTransaction(transaction: InsertTransaction): Promise<TransactionType>;
  getTransactionsByUser(userId: string): Promise<TransactionType[]>;
  getAllTransactions(): Promise<TransactionType[]>;
  updateTransactionStatus(id: string, status: string, txHash?: string): Promise<TransactionType>;
  
  getPaymentSettings(): Promise<PaymentSettingType | undefined>;
  updatePaymentSettings(settings: InsertPaymentSetting): Promise<PaymentSettingType>;
  
  getWalletAddresses(): Promise<WalletAddressType[]>;
  getActiveWalletAddresses(): Promise<WalletAddressType[]>;
  createWalletAddress(wallet: InsertWalletAddress): Promise<WalletAddressType>;
  updateWalletAddress(id: string, wallet: Partial<InsertWalletAddress>): Promise<WalletAddressType>;
  deleteWalletAddress(id: string): Promise<void>;
  
  createAutoMessage(groupId: string, message: string): Promise<AutoMessageType>;
  getAutoMessagesByGroup(groupId: string): Promise<AutoMessageType[]>;
  
  adminAddBalance(userId: string, amount: number): Promise<UserType>;
  adminApprovePayment(transactionId: string): Promise<TransactionType>;
  
  getUserStats(userId: string): Promise<{
    balance: number;
    totalGroups: number;
    activeOrders: number;
    completedOrders: number;
  }>;
}

class MemStorage implements IStorage {
  private users: Map<string, UserType & { password: string }> = new Map();
  private telegramConnections: Map<string, TelegramConnectionType> = new Map();
  private orders: Map<string, OrderType> = new Map();
  private groups: Map<string, GroupType> = new Map();
  private transactions: Map<string, TransactionType> = new Map();
  private paymentSettings: PaymentSettingType | null = null;
  private walletAddresses: Map<string, WalletAddressType> = new Map();
  private autoMessages: Map<string, AutoMessageType> = new Map();
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  async getUser(id: string): Promise<UserType | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    const userArray = Array.from(this.users.values());
    for (const user of userArray) {
      if (user.username === username) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return undefined;
  }

  async createUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = this.generateId();
    const user: UserType & { password: string } = {
      id,
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      balance: 0,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  async getAllUsers(): Promise<UserType[]> {
    const users: UserType[] = [];
    const userArray = Array.from(this.users.values());
    for (const user of userArray) {
      const { password, ...userWithoutPassword } = user;
      users.push(userWithoutPassword);
    }
    return users;
  }

  async updateUserBalance(userId: string, amount: number): Promise<UserType> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    user.balance += amount;
    user.updatedAt = new Date();
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getTelegramConnections(userId: string): Promise<TelegramConnectionType[]> {
    return Array.from(this.telegramConnections.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveTelegramConnection(userId: string): Promise<TelegramConnectionType | undefined> {
    return Array.from(this.telegramConnections.values())
      .find(c => c.userId === userId && c.isActive);
  }

  async createTelegramConnection(connectionData: InsertTelegramConnection): Promise<TelegramConnectionType> {
    const id = this.generateId();
    const connection: TelegramConnectionType = {
      id,
      ...connectionData,
      isActive: connectionData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.telegramConnections.set(id, connection);
    return connection;
  }

  async deleteTelegramConnection(id: string): Promise<void> {
    this.telegramConnections.delete(id);
  }

  async createOrder(orderData: InsertOrder): Promise<OrderType> {
    const id = this.generateId();
    const order: OrderType = {
      id,
      ...orderData,
      isPrivate: orderData.isPrivate ?? false,
      status: 'pending',
      groupsCreated: 0,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByUser(userId: string): Promise<OrderType[]> {
    return Array.from(this.orders.values())
      .filter(o => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentOrdersByUser(userId: string, limit: number = 5): Promise<OrderType[]> {
    return this.getOrdersByUser(userId).then(orders => orders.slice(0, limit));
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    groupsCreated?: number,
    errorMessage?: string
  ): Promise<OrderType> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');
    
    order.status = status;
    if (groupsCreated !== undefined) {
      order.groupsCreated = groupsCreated;
    }
    if (errorMessage) {
      order.errorMessage = errorMessage;
    }
    if (status === 'completed') {
      order.completedAt = new Date();
    }
    
    return order;
  }

  async createGroup(groupData: {
    orderId: string;
    userId: string;
    groupName: string;
    telegramGroupId?: string;
    inviteLink?: string;
  }): Promise<GroupType> {
    const id = this.generateId();
    const group: GroupType = {
      id,
      ...groupData,
      createdAt: new Date(),
    };
    this.groups.set(id, group);
    return group;
  }

  async getGroupsByOrder(orderId: string): Promise<GroupType[]> {
    return Array.from(this.groups.values()).filter(g => g.orderId === orderId);
  }

  async createTransaction(transactionData: InsertTransaction): Promise<TransactionType> {
    const id = this.generateId();
    const transaction: TransactionType = {
      id,
      ...transactionData,
      status: transactionData.status ?? 'pending',
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUser(userId: string): Promise<TransactionType[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllTransactions(): Promise<TransactionType[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<TransactionType> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error('Transaction not found');
    transaction.status = status;
    if (txHash) {
      transaction.txHash = txHash;
    }
    return transaction;
  }

  async getPaymentSettings(): Promise<PaymentSettingType | undefined> {
    return this.paymentSettings || undefined;
  }

  async updatePaymentSettings(settingsData: InsertPaymentSetting): Promise<PaymentSettingType> {
    if (this.paymentSettings) {
      this.paymentSettings = {
        ...this.paymentSettings,
        ...settingsData,
        updatedAt: new Date(),
      };
    } else {
      const id = this.generateId();
      this.paymentSettings = {
        id,
        ...settingsData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return this.paymentSettings;
  }

  async getWalletAddresses(): Promise<WalletAddressType[]> {
    return Array.from(this.walletAddresses.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveWalletAddresses(): Promise<WalletAddressType[]> {
    return Array.from(this.walletAddresses.values())
      .filter(w => w.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createWalletAddress(walletData: InsertWalletAddress): Promise<WalletAddressType> {
    const id = this.generateId();
    const wallet: WalletAddressType = {
      id,
      ...walletData,
      isActive: walletData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.walletAddresses.set(id, wallet);
    return wallet;
  }

  async updateWalletAddress(id: string, walletData: Partial<InsertWalletAddress>): Promise<WalletAddressType> {
    const wallet = this.walletAddresses.get(id);
    if (!wallet) throw new Error('Wallet address not found');
    Object.assign(wallet, walletData, { updatedAt: new Date() });
    return wallet;
  }

  async deleteWalletAddress(id: string): Promise<void> {
    this.walletAddresses.delete(id);
  }

  async createAutoMessage(groupId: string, message: string): Promise<AutoMessageType> {
    const id = this.generateId();
    const autoMessage: AutoMessageType = {
      id,
      groupId,
      message,
      sentAt: new Date(),
    };
    this.autoMessages.set(id, autoMessage);
    return autoMessage;
  }

  async getAutoMessagesByGroup(groupId: string): Promise<AutoMessageType[]> {
    return Array.from(this.autoMessages.values())
      .filter(m => m.groupId === groupId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  async adminAddBalance(userId: string, amount: number): Promise<UserType> {
    const user = await this.updateUserBalance(userId, amount);
    
    await this.createTransaction({
      userId,
      type: 'credit',
      amount,
      description: 'Admin balance addition',
      status: 'completed',
    });
    
    return user;
  }

  async adminApprovePayment(transactionId: string): Promise<TransactionType> {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.type === 'credit' && transaction.status === 'pending') {
      await this.updateUserBalance(transaction.userId.toString(), transaction.amount);
    }

    return await this.updateTransactionStatus(transactionId, 'completed');
  }

  async getUserStats(userId: string): Promise<{
    balance: number;
    totalGroups: number;
    activeOrders: number;
    completedOrders: number;
  }> {
    const user = this.users.get(userId);
    
    const userOrders = Array.from(this.orders.values()).filter(o => o.userId === userId);
    
    const totalGroups = Array.from(this.groups.values()).filter(g => g.userId === userId).length;

    const activeOrdersCount = userOrders.filter(
      o => o.status === 'pending' || o.status === 'processing'
    ).length;

    const completedOrdersCount = userOrders.filter(
      o => o.status === 'completed'
    ).length;

    return {
      balance: user?.balance || 0,
      totalGroups,
      activeOrders: activeOrdersCount,
      completedOrders: completedOrdersCount,
    };
  }

  async setUserAsAdmin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isAdmin = true;
    }
  }
}

export const storage = new MemStorage();
