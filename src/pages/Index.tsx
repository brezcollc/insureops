import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (query: string) => {
    console.log("[Index] Search query updated:", query);
    setSearchQuery(query);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        <main className="flex-1 overflow-auto">
          <DashboardView activeTab={activeTab} searchQuery={searchQuery} />
        </main>
      </div>
    </div>
  );
};

export default Index;
