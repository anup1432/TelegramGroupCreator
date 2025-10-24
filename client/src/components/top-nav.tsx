import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Wallet } from "lucide-react";

export function TopNav() {
  const { user } = useAuth();

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 gap-4">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="gap-2 px-4 h-9" data-testid="badge-balance">
          <Wallet className="h-4 w-4" />
          <span className="font-mono font-medium">${parseFloat(user?.balance || "0").toFixed(2)}</span>
        </Badge>
        
        <Avatar data-testid="avatar-user">
          <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} className="object-cover" />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
