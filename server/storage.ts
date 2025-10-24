import {
  User,
  TelegramConnection,
  Order,
  Group,
  Transaction,
  PaymentSetting,
  WalletAddress,
  AutoMessage,
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
import mongoose from "mongoose";

function convertToId<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Omit<T, '_id'> & { id: string };
}

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

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<UserType | undefined> {
    const user = await User.findById(id).select('-password').lean();
    return user ? convertToId(user) as UserType : undefined;
  }

  async getUserByUsername(username: string): Promise<UserType | undefined> {
    const user = await User.findOne({ username }).select('-password').lean();
    return user ? convertToId(user) as UserType : undefined;
  }

  async createUser(username: string, password: string, email?: string, firstName?: string, lastName?: string): Promise<UserType> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
    });
    const { password: _, ...userWithoutPassword } = user.toObject();
    return convertToId(userWithoutPassword) as UserType;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  async getAllUsers(): Promise<UserType[]> {
    const users = await User.find().select('-password').lean();
    return users.map(u => convertToId(u)) as UserType[];
  }

  async updateUserBalance(userId: string, amount: number): Promise<UserType> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount }, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    if (!user) throw new Error('User not found');
    return convertToId(user.toObject()) as UserType;
  }

  async getTelegramConnections(userId: string): Promise<TelegramConnectionType[]> {
    const connections = await TelegramConnection.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return connections.map(c => convertToId(c)) as TelegramConnectionType[];
  }

  async getActiveTelegramConnection(userId: string): Promise<TelegramConnectionType | undefined> {
    const connection = await TelegramConnection.findOne({ userId, isActive: true }).lean();
    return connection ? convertToId(connection) as TelegramConnectionType : undefined;
  }

  async createTelegramConnection(connectionData: InsertTelegramConnection): Promise<TelegramConnectionType> {
    const connection = await TelegramConnection.create(connectionData);
    return convertToId(connection.toObject()) as TelegramConnectionType;
  }

  async deleteTelegramConnection(id: string): Promise<void> {
    await TelegramConnection.findByIdAndDelete(id);
  }

  async createOrder(orderData: InsertOrder): Promise<OrderType> {
    const order = await Order.create(orderData);
    return convertToId(order.toObject()) as OrderType;
  }

  async getOrdersByUser(userId: string): Promise<OrderType[]> {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return orders.map(o => convertToId(o)) as OrderType[];
  }

  async getRecentOrdersByUser(userId: string, limit: number = 5): Promise<OrderType[]> {
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return orders.map(o => convertToId(o)) as OrderType[];
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
    groupsCreated?: number,
    errorMessage?: string
  ): Promise<OrderType> {
    const updateData: any = { status };
    
    if (groupsCreated !== undefined) {
      updateData.groupsCreated = groupsCreated;
    }
    
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    if (!order) throw new Error('Order not found');
    return convertToId(order.toObject()) as OrderType;
  }

  async createGroup(groupData: {
    orderId: string;
    userId: string;
    groupName: string;
    telegramGroupId?: string;
    inviteLink?: string;
  }): Promise<GroupType> {
    const group = await Group.create(groupData);
    return convertToId(group.toObject()) as GroupType;
  }

  async getGroupsByOrder(orderId: string): Promise<GroupType[]> {
    const groups = await Group.find({ orderId }).lean();
    return groups.map(g => convertToId(g)) as GroupType[];
  }

  async createTransaction(transactionData: InsertTransaction): Promise<TransactionType> {
    const transaction = await Transaction.create(transactionData);
    return convertToId(transaction.toObject()) as TransactionType;
  }

  async getTransactionsByUser(userId: string): Promise<TransactionType[]> {
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return transactions.map(t => convertToId(t)) as TransactionType[];
  }

  async getAllTransactions(): Promise<TransactionType[]> {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return transactions.map(t => convertToId(t)) as TransactionType[];
  }

  async updateTransactionStatus(id: string, status: string, txHash?: string): Promise<TransactionType> {
    const updateData: any = { status };
    if (txHash) {
      updateData.txHash = txHash;
    }
    
    const transaction = await Transaction.findByIdAndUpdate(id, updateData, { new: true });
    if (!transaction) throw new Error('Transaction not found');
    return convertToId(transaction.toObject()) as TransactionType;
  }

  async getPaymentSettings(): Promise<PaymentSettingType | undefined> {
    const setting = await PaymentSetting.findOne().lean();
    return setting ? convertToId(setting) as PaymentSettingType : undefined;
  }

  async updatePaymentSettings(settingsData: InsertPaymentSetting): Promise<PaymentSettingType> {
    const existing = await this.getPaymentSettings();
    
    if (existing) {
      const updated = await PaymentSetting.findByIdAndUpdate(
        existing.id,
        { ...settingsData, updatedAt: new Date() },
        { new: true }
      );
      if (!updated) throw new Error('Failed to update payment settings');
      return convertToId(updated.toObject()) as PaymentSettingType;
    } else {
      const created = await PaymentSetting.create(settingsData);
      return convertToId(created.toObject()) as PaymentSettingType;
    }
  }

  async getWalletAddresses(): Promise<WalletAddressType[]> {
    const wallets = await WalletAddress.find()
      .sort({ createdAt: -1 })
      .lean();
    return wallets.map(w => convertToId(w)) as WalletAddressType[];
  }

  async getActiveWalletAddresses(): Promise<WalletAddressType[]> {
    const wallets = await WalletAddress.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return wallets.map(w => convertToId(w)) as WalletAddressType[];
  }

  async createWalletAddress(walletData: InsertWalletAddress): Promise<WalletAddressType> {
    const wallet = await WalletAddress.create(walletData);
    return convertToId(wallet.toObject()) as WalletAddressType;
  }

  async updateWalletAddress(id: string, walletData: Partial<InsertWalletAddress>): Promise<WalletAddressType> {
    const wallet = await WalletAddress.findByIdAndUpdate(
      id,
      { ...walletData, updatedAt: new Date() },
      { new: true }
    );
    if (!wallet) throw new Error('Wallet address not found');
    return convertToId(wallet.toObject()) as WalletAddressType;
  }

  async deleteWalletAddress(id: string): Promise<void> {
    await WalletAddress.findByIdAndDelete(id);
  }

  async createAutoMessage(groupId: string, message: string): Promise<AutoMessageType> {
    const autoMessage = await AutoMessage.create({ groupId, message });
    return convertToId(autoMessage.toObject()) as AutoMessageType;
  }

  async getAutoMessagesByGroup(groupId: string): Promise<AutoMessageType[]> {
    const messages = await AutoMessage.find({ groupId })
      .sort({ sentAt: -1 })
      .lean();
    return messages.map(m => convertToId(m)) as AutoMessageType[];
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
    const transaction = await Transaction.findById(transactionId);
    
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
    const user = await User.findById(userId);
    
    const userOrders = await Order.find({ userId });
    
    const totalGroups = await Group.countDocuments({ userId });

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
}

export const storage = new DatabaseStorage();
