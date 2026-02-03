import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientDetailView } from "@/components/clients/ClientDetailView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleSearchChange = (query: string) => {
    console.log("[Index] Search query updated:", query);
    setSearchQuery(query);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedClientId(null); // Clear client selection when changing tabs
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
  };

  const renderContent = () => {
    // If we're on clients tab and have a selected client, show detail view
    if (activeTab === "clients" && selectedClientId) {
      return (
        <div className="p-8">
          <ClientDetailView 
            clientId={selectedClientId} 
            onBack={handleBackToClients} 
          />
        </div>
      );
    }

    // Clients list
    if (activeTab === "clients") {
      return (
        <div className="p-8">
          <ClientsList onClientSelect={handleClientSelect} />
        </div>
      );
    }

    // Dashboard and other views
    return <DashboardView activeTab={activeTab} searchQuery={searchQuery} />;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
