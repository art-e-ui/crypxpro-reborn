import React, { useState, useEffect } from 'react';
import { ArrowDownUp, DollarSign, Wallet, ShieldCheck, Zap } from 'lucide-react';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import type { MarketTicker } from '@/services/market';

interface SpotOrderFormProps {
  symbol: string; // e.g. "BTC"
  pair: string;   // e.g. "BTCUSDT"
  ticker: MarketTicker;
  availableUsdt: number;
  availableBaseAsset: number;
  onExecuteTrade: (trade: {
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    price: number;
    amount: number;
    total: number;
  }) => Promise<void>;
  selectedPriceOverride?: number | null;
}

export const SpotOrderForm: React.FC<SpotOrderFormProps> = ({
  symbol,
  pair,
  ticker,
  availableUsdt,
  availableBaseAsset,
  onExecuteTrade,
  selectedPriceOverride
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [priceInput, setPriceInput] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial price or override from order book click
  useEffect(() => {
    if (selectedPriceOverride && selectedPriceOverride > 0) {
      setPriceInput(selectedPriceOverride.toString());
    } else if (ticker.lastPrice > 0 && orderType === 'MARKET') {
      setPriceInput(ticker.lastPrice.toString());
    }
  }, [ticker.lastPrice, selectedPriceOverride, orderType]);

  const currentPrice = orderType === 'MARKET' ? ticker.lastPrice : (parseFloat(priceInput) || ticker.lastPrice || 1);

  // Recalculate amount based on percentage of available balance
  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    if (side === 'BUY') {
      // Amount in base asset = (Usdt * pct%) / currentPrice
      const totalUsdtToUse = availableUsdt * (pct / 100);
      if (currentPrice > 0) {
        const calculatedAmount = totalUsdtToUse / currentPrice;
        setAmountInput(calculatedAmount.toFixed(6));
      }
    } else {
      // Sell base asset directly
      const calculatedAmount = availableBaseAsset * (pct / 100);
      setAmountInput(calculatedAmount.toFixed(6));
    }
  };

  const amount = parseFloat(amountInput) || 0;
  const totalUsdt = amount * currentPrice;

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || currentPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await onExecuteTrade({
        side,
        type: orderType,
        price: currentPrice,
        amount,
        total: totalUsdt
      });

      // Reset inputs after trade
      setAmountInput('');
      setPercentage(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBuy = side === 'BUY';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      {/* Side Tabs: BUY / SELL */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 border border-border rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSide('BUY');
              setPercentage(0);
              setAmountInput('');
            }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isBuy 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Buy {symbol}
          </button>
          <button
            type="button"
            onClick={() => {
              setSide('SELL');
              setPercentage(0);
              setAmountInput('');
            }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              !isBuy 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sell {symbol}
          </button>
        </div>

        {/* Order Type Toggle: LIMIT / MARKET */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`text-xs font-bold transition-colors ${
                orderType === 'LIMIT' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-muted-foreground hover:text-foreground pb-1'
              }`}
            >
              Limit Order
            </button>
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`text-xs font-bold transition-colors ${
                orderType === 'MARKET' 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-muted-foreground hover:text-foreground pb-1'
              }`}
            >
              Market Order
            </button>
          </div>

          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Wallet size={12} className="text-primary" />
            <span>Avail:</span>
            <span className="font-mono text-foreground">
              {isBuy 
                ? `$${availableUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${availableBaseAsset.toFixed(4)} ${symbol}`}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Price Input (Disabled if Market Order) */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex justify-between">
              <span>Price</span>
              <span className="text-foreground font-mono">USDT</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                disabled={orderType === 'MARKET'}
                value={orderType === 'MARKET' ? ticker.lastPrice || '' : priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 ${
                  orderType === 'MARKET' ? 'opacity-70 cursor-not-allowed bg-muted/40' : ''
                }`}
              />
              {orderType === 'MARKET' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Best Market Price
                </span>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider flex justify-between">
              <span>Amount</span>
              <span className="text-foreground font-mono">{symbol}</span>
            </label>
            <input
              type="number"
              step="any"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setPercentage(0);
              }}
              placeholder="0.00"
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Percentage Quick Selector Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageChange(pct)}
                className={`py-1 rounded-lg text-[10px] font-black transition-all border ${
                  percentage === pct
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Total Order Value */}
          <div className="bg-muted/40 border border-border/80 rounded-xl p-2.5 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground font-semibold">Total Order Value</span>
              <span className="font-mono font-bold text-foreground">
                ${totalUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          {/* Execution Button */}
          <button
            type="submit"
            disabled={isSubmitting || amount <= 0 || (isBuy && totalUsdt > availableUsdt) || (!isBuy && amount > availableBaseAsset)}
            className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${
              isBuy 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
            }`}
          >
            {isSubmitting ? (
              <span>Processing Order...</span>
            ) : (
              <>
                <Zap size={14} />
                <span>
                  {isBuy ? `Buy ${symbol}` : `Sell ${symbol}`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Tag */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Spot Matching Engine Active</span>
        </div>
        <span className="font-mono font-bold text-foreground uppercase">0% Maker Fee</span>
      </div>
    </div>
  );
};
