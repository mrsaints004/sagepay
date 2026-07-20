"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { DelegationStatus } from "@/hooks/useUniversalAccount";
import { signAuthorization } from "@/lib/eip7702";
import { getChainNames } from "@/lib/chains";

const CHAIN_NAMES = getChainNames();

interface AccountStatusProps {
  delegationStatus: DelegationStatus;
  onDelegationComplete: () => void;
}

export function AccountStatus({ delegationStatus, onDelegationComplete }: AccountStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const allDelegated = Object.values(delegationStatus.chains).length > 0 &&
    Object.values(delegationStatus.chains).every(Boolean);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const undelegatedChains = Object.entries(delegationStatus.chains)
        .filter(([, delegated]) => !delegated)
        .map(([chainId]) => Number(chainId));

      for (const chainId of undelegatedChains) {
        await signAuthorization({
          chainId,
          contractAddress: "0x0000000000000000000000000000000000000000",
        });
      }

      setUpgraded(true);
      onDelegationComplete();
    } catch (error) {
      console.error("Delegation failed:", error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl bg-white border border-slate-100 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            allDelegated || upgraded
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}>
            {allDelegated || upgraded ? (
              <ShieldCheck className="w-[18px] h-[18px]" />
            ) : (
              <Shield className="w-[18px] h-[18px]" />
            )}
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold text-slate-900">
              Universal Account
              <span className="ml-1.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                EIP-7702
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {allDelegated || upgraded ? "Fully delegated" : "Upgrade available"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                {Object.entries(CHAIN_NAMES).map(([chainId, name]) => {
                  const isDelegated = delegationStatus.chains[Number(chainId)] || upgraded;
                  return (
                    <div key={chainId} className="flex items-center justify-between py-1.5">
                      <span className="text-[12px] text-slate-600">{name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isDelegated ? "bg-emerald-500" : "bg-slate-300"
                        }`} />
                        <span className={`text-[11px] ${
                          isDelegated ? "text-emerald-600" : "text-slate-400"
                        }`}>
                          {isDelegated ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allDelegated && !upgraded && (
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full h-9 rounded-xl bg-indigo-600 text-white text-[12px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isUpgrading ? "Upgrading..." : "Upgrade Account"}
                </button>
              )}

              {(allDelegated || upgraded) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-slate-400 text-center py-1"
                >
                  Your EOA operates as a smart account in-place via EIP-7702
                </motion.div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                EIP-7702 upgrades your wallet to a smart account without deploying a new contract,
                enabling gas sponsorship and batched transactions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
