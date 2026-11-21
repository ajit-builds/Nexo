'use client';

import React, { useState, useCallback } from 'react';
import { Wallet, CheckCircle2, AlertTriangle, ExternalLink, Loader2, ChevronDown, Zap } from 'lucide-react';

interface ConnectedWallet {
  address: string;
  chainId: number;
  chainName: string;
  balance?: string;
}

interface Web3WalletConnectProps {
  onConnected?: (wallet: ConnectedWallet) => void;
  onDisconnected?: () => void;
}

const POLYGON_AMOY_CHAIN = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: [
    process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC ||
      'https://polygon-amoy-bor-rpc.publicnode.com',
  ],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
};

export function Web3WalletConnect({ onConnected, onDisconnected }: Web3WalletConnectProps) {
  const [connected, setConnected] = useState<ConnectedWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getEthereum = (): any => (typeof window !== 'undefined' ? (window as any).ethereum : null);

  const switchToAmoy = async (eth: any) => {
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CHAIN.chainId }],
      });
    } catch (switchErr: any) {
      // Chain not added yet — add it
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [POLYGON_AMOY_CHAIN],
        });
      } else {
        throw switchErr;
      }
    }
  };

  const connect = useCallback(async () => {
    const eth = getEthereum();

    if (!eth) {
      setError('MetaMask is not installed. Install it at metamask.io');
      return;
    }

    try {
      setConnecting(true);
      setError(null);

      // 1. Request accounts
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts.length) throw new Error('No accounts returned from MetaMask');

      // 2. Switch / add Polygon Amoy
      await switchToAmoy(eth);

      // 3. Get chain info
      const chainIdHex: string = await eth.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      // 4. Get balance
      const balanceHex: string = await eth.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });
      const balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);

      const wallet: ConnectedWallet = {
        address: accounts[0],
        chainId,
        chainName: chainId === 80002 ? 'Polygon Amoy Testnet' : `Chain ${chainId}`,
        balance,
      };

      setConnected(wallet);
      onConnected?.(wallet);

      // Listen for account/chain changes
      eth.on('accountsChanged', (newAccounts: string[]) => {
        if (!newAccounts.length) {
          disconnect();
        } else {
          setConnected((prev) => prev ? { ...prev, address: newAccounts[0] } : null);
        }
      });
      eth.on('chainChanged', () => window.location.reload());
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  }, [onConnected]);

  const disconnect = useCallback(() => {
    setConnected(null);
    onDisconnected?.();
  }, [onDisconnected]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (connected) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                MetaMask Connected
              </div>
              <div className="font-mono text-sm font-bold text-slate-900">
                {truncate(connected.address)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              {connected.chainName}
            </span>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Full Address</span>
              <span className="font-mono text-slate-800 select-all">{connected.address}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Balance</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-500" />
                {connected.balance} MATIC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Chain ID</span>
              <span className="font-mono text-slate-800">{connected.chainId}</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <a
                href={`https://amoy.polygonscan.com/address/${connected.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium underline"
              >
                View on Polygonscan <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-300">|</span>
              <button
                onClick={disconnect}
                className="text-red-500 hover:text-red-700 font-medium transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-xs font-medium p-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <span>{error}</span>
            {error.includes('MetaMask') && (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline text-red-700"
              >
                Install MetaMask →
              </a>
            )}
          </div>
        </div>
      )}

      <button
        onClick={connect}
        disabled={connecting}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-orange-500/20 text-sm"
      >
        {connecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {connecting ? 'Connecting to MetaMask...' : 'Connect MetaMask Wallet'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Auto-switches to{' '}
        <span className="font-semibold text-purple-600">Polygon Amoy Testnet</span> (chainId: 80002)
      </p>
    </div>
  );
}
