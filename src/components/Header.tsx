import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-8 border-b border-border bg-card">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search requests, documents, or insureds..." 
          className="pl-10 bg-background"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
        <div className="h-8 w-px bg-border" />
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">Acme Insurance Group</p>
          <p className="text-xs text-muted-foreground">Enterprise Plan</p>
        </div>
      </div>
    </header>
  );
}
