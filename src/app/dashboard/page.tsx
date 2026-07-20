"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useUniversalAccount } from "@/hooks/useUniversalAccount";
import { Navbar } from "@/components/shared/Navbar";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { AccountStatus } from "@/components/dashboard/AccountStatus";
import { AssetList } from "@/components/dashboard/AssetList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SendForm } from "@/components/dashboard/SendForm";
import { SwapForm } from "@/components/dashboard/SwapForm";
import { RequestForm } from "@/components/dashboard/RequestForm";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { LinkList } from "@/components/dashboard/LinkList";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LayoutDashboard, MessageSquare, Link2 } from "lucide-react";

type Tab = "home" | "chat" | "links";

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance, isLoading, fetchBalance, delegationStatus, checkDelegation, sendTransaction, swapTokens } =
    useUniversalAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [chatPrefill, setChatPrefill] = useState("");
  const [showSendForm, setShowSendForm] = useState(false);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (!user.isLoading && !user.isLoggedIn) {
      router.push("/");
    }
  }, [user.isLoading, user.isLoggedIn, router]);

  if (user.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user.isLoggedIn) return null;

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "__send_dialog__":
        setShowSendForm(true);
        break;
      case "__swap_dialog__":
        setShowSwapForm(true);
        break;
      case "__request_dialog__":
        setShowRequestForm(true);
        break;
      case "__refresh_balance__":
        fetchBalance();
        break;
      default:
        setChatPrefill(action);
        setActiveTab("chat");
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto w-full bg-white shadow-sm">
      <Navbar isDelegated={delegationStatus.isDelegated} />

      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-slate-50"
            >
              <BalanceCard
                totalUSD={balance.totalUSD}
                isLoading={isLoading}
                onRefresh={fetchBalance}
                isDelegated={delegationStatus.isDelegated}
              />
              <AccountStatus
                delegationStatus={delegationStatus}
                onDelegationComplete={checkDelegation}
              />
              <QuickActions onAction={handleQuickAction} />
              <AssetList assets={balance.assets} isLoading={isLoading} />
              <TransactionList onTryFirstPayment={() => {
                setShowSendForm(true);
              }} />
              <div className="h-2" />
            </motion.div>
          ) : activeTab === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 flex flex-col min-h-0 bg-white"
            >
              <ChatContainer
                prefillPrompt={chatPrefill}
                onPrefillUsed={() => setChatPrefill("")}
              />
            </motion.div>
          ) : (
            <motion.div
              key="links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Links</h2>
              <LinkList />
              <div className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-t border-slate-100">
        <TabButton
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
          icon={LayoutDashboard}
          label="Home"
        />
        <TabButton
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          icon={MessageSquare}
          label="Chat"
        />
        <TabButton
          active={activeTab === "links"}
          onClick={() => setActiveTab("links")}
          icon={Link2}
          label="Links"
        />
      </div>

      <SendForm
        open={showSendForm}
        onClose={() => setShowSendForm(false)}
        onSend={async (to, amount, token) => {
          await sendTransaction(to, amount, token);
          fetchBalance();
        }}
        assets={balance.assets}
      />

      <SwapForm
        open={showSwapForm}
        onClose={() => setShowSwapForm(false)}
        onSwap={async (amount, fromToken, toToken) => {
          await swapTokens(amount, fromToken, toToken);
          fetchBalance();
        }}
        assets={balance.assets}
      />

      <RequestForm
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors relative ${
        active ? "text-slate-900" : "text-slate-400"
      }`}
    >
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-slate-900 rounded-full"
        />
      )}
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
