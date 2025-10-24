import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { z } from "zod";

// Validation schemas
const createOrderSchema = z.object({
  groupCount: z.number().int().min(1),
  cost: z.string(),
  groupNamePattern: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const createTransactionSchema = z.object({
  amount: z.string(),
  type: z.enum(['credit', 'debit']),
  description: z.string(),
  walletAddressId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
});

const telegramConnectSchema = z.object({
  apiId: z.string(),
  apiHash: z.string(),
  phoneNumber: z.string(),
  password: z.string().optional(),
});

const paymentSettingSchema = z.object({
  pricePerHundredGroups: z.string(),
  maxGroupsPerOrder: z.number().int().min(1).max(100),
});

const walletAddressSchema = z.object({
  cryptoCurrency: z.string(),
  address: z.string(),
  label: z.string().optional(),
  isActive: z.boolean().optional(),
});

const adminAddBalanceSchema = z.object({
  userId: z.string(),
  amount: z.string(),
});

const approvePaymentSchema = z.object({
  transactionId: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Orders endpoints
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get payment settings for max groups validation
      const settings = await storage.getPaymentSettings();
      const maxGroups = settings?.maxGroupsPerOrder || 10;
      
      // Validate input
      const validationResult = createOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { groupCount, cost, groupNamePattern, isPrivate } = validationResult.data;
      
      // Validate group count against max
      if (groupCount > maxGroups) {
        return res.status(400).json({ 
          message: `Maximum ${maxGroups} groups allowed per order` 
        });
      }

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const balance = parseFloat(user.balance);
      const orderCost = parseFloat(cost);

      if (balance < orderCost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Check for active telegram connection
      const connection = await storage.getActiveTelegramConnection(userId);
      if (!connection) {
        return res.status(400).json({ message: "No active Telegram connection" });
      }

      // Deduct balance
      await storage.updateUserBalance(userId, `-${orderCost}`);

      // Create debit transaction
      await storage.createTransaction({
        userId,
        type: 'debit',
        amount: cost,
        description: `Group creation order - ${groupCount} groups`,
        status: 'completed',
      });

      // Create order
      const order = await storage.createOrder({
        userId,
        groupCount,
        cost,
        groupNamePattern: groupNamePattern || 'Group {number}',
        isPrivate: isPrivate || false,
      });

      // Mark as processing
      await storage.updateOrderStatus(order.id, 'processing');

      // Simulate group creation (in production, this would be an async background job)
      setTimeout(async () => {
        try {
          // Random messages pool for auto-messaging
          const randomMessages = [
            "Welcome to the group!",
            "Great to have everyone here!",
            "Let's build something amazing together",
            "Excited to be part of this community",
            "Looking forward to great discussions",
            "Hello everyone! 👋",
            "This is going to be awesome!",
            "Can't wait to get started",
            "Happy to join this group",
            "Let's make this group active and engaging",
            "Greetings to all members!",
            "Ready for some great conversations",
            "Thanks for adding me here",
            "Let's collaborate and grow together",
            "Excited about this new community"
          ];
          
          for (let i = 1; i <= groupCount; i++) {
            const groupName = (groupNamePattern || 'Group {number}').replace('{number}', i.toString());
            const group = await storage.createGroup({
              orderId: order.id,
              userId,
              groupName,
              telegramGroupId: `sim_${Date.now()}_${i}`,
              inviteLink: `https://t.me/+simulated_${Date.now()}_${i}`,
            });
            
            // Auto-send 10-15 random messages per group
            const messageCount = 10 + Math.floor(Math.random() * 6); // 10-15 messages
            for (let j = 0; j < messageCount; j++) {
              const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
              await storage.createAutoMessage(group.id, randomMessage);
            }
            
            await storage.updateOrderStatus(order.id, 'processing', i);
          }
          await storage.updateOrderStatus(order.id, 'completed', groupCount);
        } catch (error) {
          console.error("Error creating groups:", error);
          await storage.updateOrderStatus(
            order.id,
            'failed',
            undefined,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }, 1000);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getRecentOrdersByUser(userId, 5);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  // Telegram connection endpoints
  app.get('/api/telegram-connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connections = await storage.getTelegramConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  const verifyCredentialsSchema = z.object({
    apiId: z.string(),
    apiHash: z.string(),
    phoneNumber: z.string(),
  });

  const verifyOtpSchema = z.object({
    apiId: z.string(),
    apiHash: z.string(),
    phoneNumber: z.string(),
    otp: z.string(),
  });

  app.post('/api/telegram/verify-credentials', isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = verifyCredentialsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }
      // In a real implementation, this would verify with Telegram API
      // For now, we'll just simulate success
      res.json({ success: true, requiresOtp: true });
    } catch (error) {
      console.error("Error verifying credentials:", error);
      res.status(500).json({ message: "Failed to verify credentials" });
    }
  });

  app.post('/api/telegram/verify-otp', isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = verifyOtpSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }
      // In a real implementation, this would verify OTP with Telegram API
      // For now, we'll just simulate success
      res.json({ success: true, requiresPassword: false });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post('/api/telegram/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate input
      const validationResult = telegramConnectSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { apiId, apiHash, phoneNumber } = validationResult.data;

      // In a real implementation, credentials should be encrypted before storage
      // and actual Telegram session should be established
      const connection = await storage.createTelegramConnection({
        userId,
        apiId,
        apiHash,
        phoneNumber,
        sessionString: 'simulated_session_string',
        isActive: true,
      });

      res.json(connection);
    } catch (error) {
      console.error("Error connecting Telegram:", error);
      res.status(500).json({ message: "Failed to connect Telegram account" });
    }
  });

  app.delete('/api/telegram-connections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Verify ownership
      const connections = await storage.getTelegramConnections(userId);
      if (!connections.find(c => c.id === id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteTelegramConnection(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting connection:", error);
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // Payment settings endpoints
  app.get('/api/payment-settings', async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      res.json(settings || { pricePerHundredGroups: '2.00', maxGroupsPerOrder: 10 });
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.get('/api/wallet-addresses', async (req, res) => {
    try {
      const wallets = await storage.getActiveWalletAddresses();
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  // Transaction endpoints
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate input
      const validationResult = createTransactionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { amount, type, description, walletAddressId, status } = validationResult.data;

      // Create pending transaction - actual balance update happens on confirmation
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type,
        description,
        walletAddressId,
        status: status || 'pending',
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin endpoints - ALL protected with isAdmin middleware
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/admin/payment-settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validationResult = paymentSettingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const setting = await storage.updatePaymentSettings(validationResult.data);
      res.json(setting);
    } catch (error) {
      console.error("Error updating payment settings:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  app.get('/api/admin/wallet-addresses', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const wallets = await storage.getWalletAddresses();
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  app.post('/api/admin/wallet-addresses', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validationResult = walletAddressSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const wallet = await storage.createWalletAddress(validationResult.data);
      res.json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      res.status(500).json({ message: "Failed to create wallet address" });
    }
  });

  app.patch('/api/admin/wallet-addresses/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = walletAddressSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const wallet = await storage.updateWalletAddress(id, validationResult.data);
      res.json(wallet);
    } catch (error) {
      console.error("Error updating wallet:", error);
      res.status(500).json({ message: "Failed to update wallet address" });
    }
  });

  app.delete('/api/admin/wallet-addresses/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteWalletAddress(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wallet:", error);
      res.status(500).json({ message: "Failed to delete wallet address" });
    }
  });

  app.post('/api/admin/add-balance', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validationResult = adminAddBalanceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { userId, amount } = validationResult.data;
      const user = await storage.adminAddBalance(userId, amount);
      res.json(user);
    } catch (error) {
      console.error("Error adding balance:", error);
      res.status(500).json({ message: "Failed to add balance" });
    }
  });

  app.post('/api/admin/approve-payment', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validationResult = approvePaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { transactionId } = validationResult.data;
      const transaction = await storage.adminApprovePayment(transactionId);
      res.json(transaction);
    } catch (error) {
      console.error("Error approving payment:", error);
      res.status(500).json({ message: "Failed to approve payment" });
    }
  });

  // Webhook endpoint for crypto payment confirmation (should have authentication in production)
  const webhookPaymentSchema = z.object({
    transactionId: z.string(),
    txHash: z.string(),
  });

  app.post('/api/webhook/payment-confirm', async (req, res) => {
    try {
      // In production, verify webhook signature/token here
      const validationResult = webhookPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validationResult.error.errors 
        });
      }

      const { transactionId, txHash } = validationResult.data;

      // Update transaction and credit user balance
      const transaction = await storage.updateTransactionStatus(transactionId, 'completed', txHash);
      
      if (transaction.type === 'credit') {
        await storage.updateUserBalance(transaction.userId, transaction.amount);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
