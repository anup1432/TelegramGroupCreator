import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Minus, AlertCircle } from "lucide-react";
import type { TelegramConnection, PaymentSetting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CreateGroups() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [groupCount, setGroupCount] = useState(10);
  const [groupNamePattern, setGroupNamePattern] = useState("Group {number}");
  const [isPrivate, setIsPrivate] = useState(false);

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

  const { data: connections } = useQuery<TelegramConnection[]>({
    queryKey: ["/api/telegram-connections"],
  });

  const { data: paymentSettings } = useQuery<PaymentSetting>({
    queryKey: ["/api/payment-settings"],
  });

  const pricePerHundred = parseFloat(paymentSettings?.pricePerHundredGroups || "2.00");
  const maxGroupsAllowed = paymentSettings?.maxGroupsPerOrder || 10;
  const activeConnection = connections?.find(c => c.isActive);

  const calculateCost = () => {
    return (groupCount / 100) * pricePerHundred;
  };

  const cost = calculateCost();
  const balance = parseFloat(user?.balance || "0");
  const remainingBalance = balance - cost;
  const hasInsufficientBalance = remainingBalance < 0;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/orders", {
        groupCount,
        cost: cost.toString(),
        groupNamePattern,
        isPrivate,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] });
      toast({
        title: "Order Created",
        description: "Your groups are being created...",
      });
      setLocation("/orders");
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

  const handleCreateGroups = () => {
    if (!activeConnection) {
      toast({
        title: "No Telegram Connection",
        description: "Please connect your Telegram account first",
        variant: "destructive",
      });
      setLocation("/settings");
      return;
    }
    if (hasInsufficientBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Please recharge your account",
        variant: "destructive",
      });
      setLocation("/recharge");
      return;
    }
    createOrderMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Create Groups</h1>
        <p className="text-muted-foreground mt-2">Automate the creation of multiple Telegram groups</p>
      </div>

      {!activeConnection && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">No Telegram Connection</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need to connect your Telegram account before creating groups.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocation("/settings")}
                  data-testid="button-go-to-settings"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Group Configuration</CardTitle>
          <CardDescription>Specify how many groups you want to create</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <Label htmlFor="group-count" className="text-base">Number of Groups</Label>
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setGroupCount(Math.max(1, groupCount - 1))}
                disabled={groupCount <= 1}
                data-testid="button-decrease-count"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="group-count"
                type="number"
                value={groupCount}
                onChange={(e) => setGroupCount(Math.min(maxGroupsAllowed, Math.max(1, parseInt(e.target.value) || 1)))}
                className="text-center text-2xl font-bold h-16 flex-1"
                data-testid="input-group-count"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setGroupCount(Math.min(maxGroupsAllowed, groupCount + 1))}
                disabled={groupCount >= maxGroupsAllowed}
                data-testid="button-increase-count"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Use +/- buttons or type a custom number (max {maxGroupsAllowed})
            </p>
          </div>

          <div className="p-6 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cost per group</span>
              <span className="font-medium font-mono">
                ${(pricePerHundred / 100).toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total cost</span>
              <span className="text-lg font-bold font-mono" data-testid="text-total-cost">
                ${cost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current balance</span>
              <span className="font-medium font-mono">${balance.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="font-medium">Remaining balance</span>
              <span
                className={`text-lg font-bold font-mono ${hasInsufficientBalance ? "text-destructive" : ""}`}
                data-testid="text-remaining-balance"
              >
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {hasInsufficientBalance && (
            <div className="p-4 bg-destructive/10 rounded-lg border-l-4 border-destructive">
              <p className="font-medium text-destructive">Insufficient Balance</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need ${Math.abs(remainingBalance).toFixed(2)} more to complete this order.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation("/recharge")}
                data-testid="button-go-to-recharge"
              >
                Recharge Now
              </Button>
            </div>
          )}

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full" data-testid="button-toggle-advanced">
                Advanced Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name-pattern">Group Name Pattern</Label>
                <Input
                  id="name-pattern"
                  value={groupNamePattern}
                  onChange={(e) => setGroupNamePattern(e.target.value)}
                  placeholder="Group {number}"
                  data-testid="input-name-pattern"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{number}"} as a placeholder for sequential numbers
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is-private">Private Groups</Label>
                  <p className="text-sm text-muted-foreground">
                    Create groups as private instead of public
                  </p>
                </div>
                <Switch
                  id="is-private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  data-testid="switch-is-private"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <Button
        onClick={handleCreateGroups}
        disabled={!activeConnection || hasInsufficientBalance || createOrderMutation.isPending || groupCount < 1}
        className="w-full h-12 text-lg"
        data-testid="button-create-groups"
      >
        {createOrderMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Groups...
          </>
        ) : (
          `Create ${groupCount} Group${groupCount !== 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
}
