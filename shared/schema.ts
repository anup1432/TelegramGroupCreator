import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

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

export interface IUser extends Document {
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

export interface ITelegramConnection extends Document {
  userId: mongoose.Types.ObjectId;
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  sessionString?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
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

export interface IGroup extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  telegramGroupId?: string;
  groupName: string;
  inviteLink?: string;
  createdAt: Date;
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  description: string;
  status: string;
  txHash?: string;
  walletAddressId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IWalletAddress extends Document {
  cryptoCurrency: string;
  address: string;
  label?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentSetting extends Document {
  pricePerHundredGroups: number;
  maxGroupsPerOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAutoMessage extends Document {
  groupId: mongoose.Types.ObjectId;
  message: string;
  sentAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, maxlength: 50 },
  password: { type: String, required: true, maxlength: 255 },
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  balance: { type: Number, default: 0, required: true },
  isAdmin: { type: Boolean, default: false, required: true },
}, { timestamps: true });

const TelegramConnectionSchema = new Schema<ITelegramConnection>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  apiId: { type: String, required: true },
  apiHash: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  sessionString: String,
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupCount: { type: Number, required: true },
  cost: { type: Number, required: true },
  status: { type: String, default: 'pending', required: true },
  groupsCreated: { type: Number, default: 0, required: true },
  groupNamePattern: String,
  isPrivate: { type: Boolean, default: false, required: true },
  errorMessage: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: false });

const GroupSchema = new Schema<IGroup>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  telegramGroupId: String,
  groupName: { type: String, required: true },
  inviteLink: String,
}, { timestamps: true });

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'pending', required: true },
  txHash: String,
  walletAddressId: { type: Schema.Types.ObjectId, ref: 'WalletAddress' },
}, { timestamps: true });

const WalletAddressSchema = new Schema<IWalletAddress>({
  cryptoCurrency: { type: String, required: true, maxlength: 50 },
  address: { type: String, required: true },
  label: String,
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

const PaymentSettingSchema = new Schema<IPaymentSetting>({
  pricePerHundredGroups: { type: Number, default: 2.0, required: true },
  maxGroupsPerOrder: { type: Number, default: 10, required: true },
}, { timestamps: true });

const AutoMessageSchema = new Schema<IAutoMessage>({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const TelegramConnection = mongoose.models.TelegramConnection || mongoose.model<ITelegramConnection>('TelegramConnection', TelegramConnectionSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const Group = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const WalletAddress = mongoose.models.WalletAddress || mongoose.model<IWalletAddress>('WalletAddress', WalletAddressSchema);
export const PaymentSetting = mongoose.models.PaymentSetting || mongoose.model<IPaymentSetting>('PaymentSetting', PaymentSettingSchema);
export const AutoMessage = mongoose.models.AutoMessage || mongoose.model<IAutoMessage>('AutoMessage', AutoMessageSchema);

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
