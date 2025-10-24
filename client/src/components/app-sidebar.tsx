import { Link, useLocation } from "wouter";
import {
  Home,
  PlusCircle,
  List,
  Wallet,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const mainMenuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      testId: "link-dashboard",
    },
    {
      title: "Create Groups",
      url: "/create",
      icon: PlusCircle,
      testId: "link-create-groups",
    },
    {
      title: "My Orders",
      url: "/orders",
      icon: List,
      testId: "link-orders",
    },
    {
      title: "Recharge",
      url: "/recharge",
      icon: Wallet,
      testId: "link-recharge",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      testId: "link-settings",
    },
  ];

  const adminMenuItem = {
    title: "Admin Panel",
    url: "/admin",
    icon: Shield,
    testId: "link-admin",
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">TeleGroup</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.isAdmin && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location === adminMenuItem.url}>
                      <Link href={adminMenuItem.url} data-testid={adminMenuItem.testId}>
                        <adminMenuItem.icon className="h-4 w-4" />
                        <span>{adminMenuItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/api/logout" data-testid="link-logout">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
