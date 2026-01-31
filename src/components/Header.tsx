import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ searchQuery = "", onSearchChange }: HeaderProps) {
  const { toast } = useToast();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("[Header] Search input changed:", value);
    onSearchChange?.(value);
  };

  const handleNotificationClick = () => {
    console.log("[Header] Notification bell clicked");
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  const handleNotificationItemClick = (item: string) => {
    console.log("[Header] Notification item clicked:", item);
    toast({
      title: "Notification",
      description: item,
    });
  };

  return (
    <header className="flex items-center justify-between h-16 px-8 border-b border-border bg-card">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search requests, documents, or insureds..." 
          className="pl-10 bg-background"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNotificationItemClick("Loss run LR-2024-002 updated to In Progress")}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Request Updated</p>
                <p className="text-xs text-muted-foreground">Loss run LR-2024-002 updated to In Progress</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNotificationItemClick("New document uploaded: AcmeCorp_LossRun.pdf")}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Document Uploaded</p>
                <p className="text-xs text-muted-foreground">New document uploaded: AcmeCorp_LossRun.pdf</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNotificationItemClick("Loss run LR-2024-001 is due tomorrow")}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Due Date Reminder</p>
                <p className="text-xs text-muted-foreground">Loss run LR-2024-001 is due tomorrow</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleNotificationItemClick("Viewing all notifications")}
              className="cursor-pointer text-center justify-center"
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-8 w-px bg-border" />
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">Acme Insurance Group</p>
          <p className="text-xs text-muted-foreground">Enterprise Plan</p>
        </div>
      </div>
    </header>
  );
}
