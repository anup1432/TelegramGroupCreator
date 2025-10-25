import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export interface IUser {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  balance: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITelegramConnection {
  userId: string;
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  sessionString?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder {
  userId: string;
  groupCount: number;
  cost: number;
  status: string;
  groupsCreated: number;
  groupNamePattern?: string;
  isPrivate: boolean;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IGroup {
  orderId: string;
  userId: string;
  telegramGroupId?: string;
  groupName: string;
  inviteLink?: string;
  createdAt: Date;
}

export interface ITransaction {
  userId: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  txHash?: string;
  walletAddressId?: string;
  createdAt: Date;
}

export interface IWalletAddress {
  cryptoCurrency: string;
  address: string;
  label?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentSetting {
  pricePerHundredGroups: number;
  maxGroupsPerOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAutoMessage {
  groupId: string;
  message: string;
  sentAt: Date;
}

export const insertTelegramConnectionSchema = z.object({
  userId: z.string(),
  apiId: z.string(),
  apiHash: z.string(),
  phoneNumber: z.string(),
  sessionString: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertOrderSchema = z.object({
  userId: z.string(),
  groupCount: z.number(),
  cost: z.number(),
  groupNamePattern: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

export const insertTransactionSchema = z.object({
  userId: z.string(),
  type: z.string(),
  amount: z.number(),
  description: z.string(),
  status: z.string().optional(),
  txHash: z.string().optional(),
  walletAddressId: z.string().optional(),
});

export const insertWalletAddressSchema = z.object({
  cryptoCurrency: z.string(),
  address: z.string(),
  label: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertPaymentSettingSchema = z.object({
  pricePerHundredGroups: z.number(),
  maxGroupsPerOrder: z.number(),
});

export type UserType = Omit<IUser, 'password'> & { id: string };
export type InsertTelegramConnection = z.infer<typeof insertTelegramConnectionSchema>;
export type TelegramConnectionType = ITelegramConnection & { id: string };
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderType = IOrder & { id: string };
export type GroupType = IGroup & { id: string };
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionType = ITransaction & { id: string };
export type InsertWalletAddress = z.infer<typeof insertWalletAddressSchema>;
export type WalletAddressType = IWalletAddress & { id: string };
export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingSchema>;
export type PaymentSettingType = IPaymentSetting & { id: string };
export type AutoMessageType = IAutoMessage & { id: string };
