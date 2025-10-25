import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Users, DollarSign, Settings as SettingsIcon, Plus, Check, X } from "lucide-react";
import type { UserType, PaymentSettingType, TransactionType, WalletAddressType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [cryptoCurrency, setCryptoCurrency] = useState("USDT");
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [balanceToAdd, setBalanceToAdd] = useState("");
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    if (!authLoading && !user?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: paymentSettings, isLoading: settingsLoading } = useQuery<PaymentSettingType>({
    queryKey: ["/api/payment-settings"],
  });

  const { data: walletAddresses, isLoading: walletsLoading } = useQuery<WalletAddressType[]>({
    queryKey: ["/api/admin/wallet-addresses"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<TransactionType[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const addWalletMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/wallet-addresses", {
        cryptoCurrency,
        address: walletAddress,
        label: `${cryptoCurrency} Wallet`,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-addresses"] });
      setIsPaymentDialogOpen(false);
      setCryptoCurrency("USDT");
      setWalletAddress("");
      toast({
        title: "Success",
        description: "Wallet address added successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/add-balance", {
        userId: selectedUserId,
        amount: balanceToAdd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsBalanceDialogOpen(false);
      setSelectedUserId("");
      setBalanceToAdd("");
      toast({
        title: "Success",
        description: "Balance added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return await apiRequest("POST", "/api/admin/approve-payment", {
        transactionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Payment approved and balance credited",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Manage users, payments, and system settings</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <DollarSign className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage registered users and their accounts</CardDescription>
              </div>
              <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-balance">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Balance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Balance to User</DialogTitle>
                    <DialogDescription>Credit a user's account balance</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select">Select User</Label>
                      <select
                        id="user-select"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        data-testid="select-user"
                      >
                        <option value="">Choose a user...</option>
                        {users?.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.email || "No email"}) - ${u.balance.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={balanceToAdd}
                        onChange={(e) => setBalanceToAdd(e.target.value)}
                        placeholder="Enter amount to add"
                        data-testid="input-balance-amount"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addBalanceMutation.mutate()}
                      disabled={addBalanceMutation.isPending || !selectedUserId || !balanceToAdd}
                      data-testid="button-save-balance"
                    >
                      {addBalanceMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Balance"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.email || "N/A"}</TableCell>
                        <TableCell className="font-mono">${u.balance.toFixed(2)}</TableCell>
                        <TableCell>
                          {u.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage cryptocurrency payment options</CardDescription>
              </div>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-wallet">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wallet Address
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Wallet Address</DialogTitle>
                    <DialogDescription>Add a new cryptocurrency wallet for payments</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="crypto">Cryptocurrency</Label>
                      <Input
                        id="crypto"
                        value={cryptoCurrency}
                        onChange={(e) => setCryptoCurrency(e.target.value)}
                        placeholder="USDT, BTC, ETH, etc."
                        data-testid="input-crypto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wallet">Wallet Address</Label>
                      <Input
                        id="wallet"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter wallet address"
                        className="font-mono"
                        data-testid="input-wallet"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => addWalletMutation.mutate()}
                      disabled={addWalletMutation.isPending || !walletAddress}
                      data-testid="button-save-wallet"
                    >
                      {addWalletMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Wallet"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {walletsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !walletAddresses || walletAddresses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No wallet addresses configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletAddresses.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`wallet-${wallet.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{wallet.cryptoCurrency}</p>
                          {wallet.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {wallet.address}
                        </p>
                        {wallet.label && (
                          <p className="text-sm text-muted-foreground">
                            {wallet.label}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Monitor all payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} data-testid={`transaction-row-${tx.id}`}>
                        <TableCell>
                          {tx.createdAt ? format(new Date(tx.createdAt), "MMM d, yyyy h:mm a") : "N/A"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{tx.userId.substring(0, 8)}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell className="font-mono">${tx.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.status === "completed"
                                ? "default"
                                : tx.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.status === "pending" && tx.type === "credit" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approvePaymentMutation.mutate(tx.id)}
                                disabled={approvePaymentMutation.isPending}
                                data-testid={`button-approve-${tx.id}`}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Global settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Pricing Configuration</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price per 100 Groups</span>
                    <span className="font-mono font-medium">
                      ${paymentSettings ? paymentSettings.pricePerHundredGroups.toFixed(2) : '2.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Max Groups per Order</span>
                    <span className="font-mono font-medium">
                      {paymentSettings?.maxGroupsPerOrder || 10}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform Status</Label>
                <Badge variant="default" className="gap-1">
                  Operational
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
