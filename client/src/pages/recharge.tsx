import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle, Wallet } from "lucide-react";
import type { PaymentSetting, WalletAddress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Recharge() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
  }, [isAuthenticated, authLoading, toast]);

  const { data: paymentSettings, isLoading: settingsLoading } = useQuery<PaymentSetting>({
    queryKey: ["/api/payment-settings"],
  });

  const { data: walletAddresses, isLoading: walletsLoading } = useQuery<WalletAddress[]>({
    queryKey: ["/api/wallet-addresses"],
  });

  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);

  const pricePerHundred = parseFloat(paymentSettings?.pricePerHundredGroups || "2.00");

  const calculateGroups = (amount: number) => {
    return Math.floor((amount / pricePerHundred) * 100);
  };

  const quickAmounts = [10, 25, 50, 100];

  const handleCopyAddress = () => {
    if (selectedWallet?.address) {
      navigator.clipboard.writeText(selectedWallet.address);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (walletAddresses && walletAddresses.length > 0 && !selectedWallet) {
      setSelectedWallet(walletAddresses[0]);
    }
  }, [walletAddresses, selectedWallet]);

  const createTransactionMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest("POST", "/api/transactions", {
        amount: amount.toString(),
        type: "credit",
        description: `Recharge balance - ${selectedWallet?.cryptoCurrency}`,
        walletAddressId: selectedWallet?.id,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Transaction Created",
        description: "Please send the payment to the wallet address below",
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

  const handleRecharge = () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum recharge amount is $1",
        variant: "destructive",
      });
      return;
    }
    createTransactionMutation.mutate(amount);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Recharge Balance</h1>
        <p className="text-muted-foreground mt-2">Add funds to your account using cryptocurrency</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Amount</CardTitle>
              <CardDescription>Choose a quick amount or enter a custom value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className="h-16 text-lg"
                    data-testid={`button-amount-${amount}`}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-amount">Custom Amount</Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  className="h-12"
                  data-testid="input-custom-amount"
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You will receive</span>
                  <span className="text-lg font-semibold" data-testid="text-groups-estimate">
                    {calculateGroups(displayAmount)} groups
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rate: ${pricePerHundred} per 100 groups
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Send payment to the address below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {walletsLoading || settingsLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-12 bg-muted animate-pulse rounded" />
                </div>
              ) : !walletAddresses || walletAddresses.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Payment methods not configured</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {walletAddresses.map((wallet) => (
                        <Button
                          key={wallet.id}
                          variant={selectedWallet?.id === wallet.id ? "default" : "outline"}
                          onClick={() => setSelectedWallet(wallet)}
                          data-testid={`button-select-wallet-${wallet.cryptoCurrency}`}
                        >
                          {wallet.cryptoCurrency}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedWallet && (
                    <>
                      <div className="space-y-2">
                        <Label>Wallet Address</Label>
                        <div className="flex gap-2">
                          <Input
                            value={selectedWallet.address}
                            readOnly
                            className="font-mono text-sm"
                            data-testid="input-wallet-address"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleCopyAddress}
                            data-testid="button-copy-address"
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-medium">Important</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      After sending payment, it may take a few minutes for your balance to update.
                      Please save your transaction hash for reference.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount to Send</Label>
                    <div className="text-3xl font-bold font-mono" data-testid="text-payment-amount">
                      ${displayAmount.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current Balance: ${parseFloat(user?.balance || "0").toFixed(2)}
                    </p>
                  </div>

                  <Button
                    onClick={handleRecharge}
                    disabled={displayAmount < 1 || createTransactionMutation.isPending}
                    className="w-full h-12"
                    data-testid="button-confirm-recharge"
                  >
                    {createTransactionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "I've Sent the Payment"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
