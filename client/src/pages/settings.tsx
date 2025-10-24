import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import type { TelegramConnection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

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

  const { data: connections, isLoading: connectionsLoading } = useQuery<TelegramConnection[]>({
    queryKey: ["/api/telegram-connections"],
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (step === 1) {
        return await apiRequest("POST", "/api/telegram/verify-credentials", {
          apiId,
          apiHash,
          phoneNumber,
        });
      } else if (step === 2) {
        return await apiRequest("POST", "/api/telegram/verify-otp", {
          apiId,
          apiHash,
          phoneNumber,
          phoneCodeHash,
          otp,
        });
      }
    },
    onSuccess: (data: any) => {
      if (step === 1) {
        // OTP sent successfully
        setPhoneCodeHash(data.phoneCodeHash);
        setStep(2);
        toast({
          title: "OTP Sent",
          description: "Please check your Telegram for the verification code",
        });
      } else if (step === 2) {
        // OTP verified and connected successfully
        queryClient.invalidateQueries({ queryKey: ["/api/telegram-connections"] });
        setIsDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Telegram account connected successfully",
        });
      }
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/telegram-connections/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram-connections"] });
      toast({
        title: "Disconnected",
        description: "Telegram account disconnected successfully",
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

  const resetForm = () => {
    setStep(1);
    setApiId("");
    setApiHash("");
    setPhoneNumber("");
    setPhoneCodeHash("");
    setOtp("");
    setPassword("");
  };

  const handleNext = () => {
    connectMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your Telegram connections</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Telegram Connections</CardTitle>
            <CardDescription>Connect your Telegram account to create groups</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} data-testid="button-add-connection">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Telegram Account</DialogTitle>
                <DialogDescription>
                  Step {step} of 2 - {step === 1 ? "API Credentials & Phone" : "OTP Verification"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api-id">API ID</Label>
                      <Input
                        id="api-id"
                        type="number"
                        placeholder="Enter your API ID"
                        value={apiId}
                        onChange={(e) => setApiId(e.target.value)}
                        data-testid="input-api-id"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API credentials from{" "}
                        <a
                          href="https://my.telegram.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          my.telegram.org
                        </a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-hash">API Hash</Label>
                      <Input
                        id="api-hash"
                        type="text"
                        placeholder="Enter your API Hash"
                        value={apiHash}
                        onChange={(e) => setApiHash(e.target.value)}
                        className="font-mono"
                        data-testid="input-api-hash"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        data-testid="input-phone"
                      />
                    </div>
                  </>
                )}
                {step === 2 && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono"
                      data-testid="input-otp"
                    />
                    <p className="text-xs text-muted-foreground">
                      Check your Telegram app for the verification code
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleNext}
                  disabled={connectMutation.isPending}
                  className="w-full"
                  data-testid="button-next-step"
                >
                  {connectMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step === 1 ? "Sending OTP..." : "Verifying..."}
                    </>
                  ) : step === 2 ? (
                    "Connect Account"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !connections || connections.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No Telegram connections</p>
              <p className="text-sm text-muted-foreground">
                Connect your Telegram account to start creating groups
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{connection.phoneNumber}</p>
                      {connection.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      API ID: {connection.apiId}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(connection.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${connection.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
