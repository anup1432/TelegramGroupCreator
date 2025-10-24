import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, List, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import type { Order } from "@shared/schema";
import { format } from "date-fns";

export default function Orders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      processing: "secondary",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize" data-testid={`badge-status-${status}`}>
        {status}
      </Badge>
    );
  };

  const getProgress = (order: Order) => {
    return (order.groupsCreated / order.groupCount) * 100;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold leading-tight">My Orders</h1>
          <p className="text-muted-foreground mt-2">View your group creation orders and their status</p>
        </div>
        <Button asChild data-testid="button-create-new">
          <Link href="/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Complete history of your group creation requests</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start creating Telegram groups to see your orders here
              </p>
              <Button asChild variant="outline" data-testid="button-get-started">
                <Link href="/create">Get Started</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Order #{order.id.substring(0, 8)}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy h:mm a") : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-lg font-bold font-mono">${parseFloat(order.cost).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium" data-testid={`text-progress-${order.id}`}>
                          {order.groupsCreated} / {order.groupCount} groups
                        </span>
                      </div>
                      <Progress value={getProgress(order)} className="h-2" />
                    </div>

                    {order.errorMessage && (
                      <div className="mt-4 p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                        <p className="text-sm font-medium text-destructive">Error</p>
                        <p className="text-sm text-muted-foreground mt-1">{order.errorMessage}</p>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Group Pattern</p>
                        <p className="font-medium">{order.groupNamePattern || "Default"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Privacy</p>
                        <p className="font-medium">{order.isPrivate ? "Private" : "Public"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
