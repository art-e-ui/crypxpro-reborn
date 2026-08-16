import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingDown, TrendingUp, Sliders, RefreshCw, AlertCircle, 
  CheckCircle2, Clock, Search, Filter, Play, StopCircle, RotateCcw, 
  Zap, Info, Layers, Sparkles, History, ChevronRight
} from 'lucide-react';
import { tokenPriceControl, TokenPriceSchedule, TokenPriceAuditLog, SAMPLE_TOKENS_LIST } from '@/services/tokenPriceControl';
import { marketService } from '@/services/market';
import { CryptoIcon } from '@/components/shared/CryptoIcon';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

export const AdminSampleTokens = () => {
  const { user } = useAuth();
  const adminEmail = user?.email || 'admin@crypx.io';

  const [schedules, setSchedules] = useState<Record<string, TokenPriceSchedule>>({});
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [auditLogs, setAuditLogs] = useState<TokenPriceAuditLog[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Main' | 'Stocks & Commodities' | 'Controlled'>('All');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  // Modal / Drawer state for configuring price trend
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string>('NAS');
  
  // Form parameters
  const [adjustType, setAdjustType] = useState<'percentage' | 'fixed_target' | 'manual_override'>('percentage');
  const [direction, setDirection] = useState<'decrease' | 'increase'>('decrease');
  const [changePercent, setChangePercent] = useState<number>(20);
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [durationValue, setDurationValue] = useState<number>(24); // in hours
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days'>('days');
  const [noteInput, setNoteInput] = useState<string>('');

  // Refresh interval for live tick updates
  const refreshData = useCallback(() => {
    setSchedules(tokenPriceControl.getSchedules());
    setAuditLogs(tokenPriceControl.getAuditLogs());

    // Fetch current prices
    const prices: Record<string, number> = {};
    SAMPLE_TOKENS_LIST.forEach(t => {
      prices[t.symbol] = marketService.getCurrentPrice(t.symbol) || t.defaultPrice;
    });
    setLivePrices(prices);
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 1000);

    const handleStorageEvent = () => refreshData();
    window.addEventListener('token-price-control-updated', handleStorageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('token-price-control-updated', handleStorageEvent);
    };
  }, [refreshData]);

  // Handle open modal for single token
  const handleOpenModal = (symbol: string) => {
    setActiveSymbol(symbol);
    const meta = SAMPLE_TOKENS_LIST.find(t => t.symbol === symbol);
    const currentPrice = livePrices[symbol] || meta?.defaultPrice || 100;
    const existingSchedule = schedules[symbol];

    if (existingSchedule && existingSchedule.isActive) {
      setAdjustType(existingSchedule.type);
      setDirection(existingSchedule.direction === 'decrease' ? 'decrease' : 'increase');
      setChangePercent(existingSchedule.changePercent || 20);
      setTargetPriceInput(existingSchedule.targetPrice.toString());
      setDurationValue(existingSchedule.durationHours >= 24 ? existingSchedule.durationHours / 24 : existingSchedule.durationHours);
      setDurationUnit(existingSchedule.durationHours >= 24 ? 'days' : 'hours');
      setNoteInput(existingSchedule.note || '');
    } else {
      setAdjustType('percentage');
      setDirection('decrease');
      setChangePercent(20);
      setTargetPriceInput((currentPrice * 0.8).toFixed(2));
      setDurationValue(1);
      setDurationUnit('days');
      setNoteInput('');
    }

    setIsModalOpen(true);
  };

  // Submit trend adjustment
  const handleApplyAdjustment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const durationHoursTotal = durationUnit === 'days' ? durationValue * 24 : durationValue;
    if (adjustType !== 'manual_override' && durationHoursTotal < 1) {
      toast.error('Minimum duration for manual setup is 1 hour (60 minutes)');
      return;
    }

    const targetSyms = selectedTokens.length > 0 && selectedTokens.includes(activeSymbol)
      ? selectedTokens
      : [activeSymbol];
    try {
      if (adjustType === 'manual_override') {
        const numPrice = parseFloat(targetPriceInput);
        if (isNaN(numPrice) || numPrice <= 0) {
          toast.error('Please specify a valid price greater than 0');
          return;
        }
        targetSyms.forEach(sym => {
          tokenPriceControl.setManualOverride(sym, numPrice, adminEmail);
        });
        toast.success(`Set manual override price to $${numPrice.toFixed(2)} for ${targetSyms.join(', ')}`);
      } else {
        targetSyms.forEach(sym => {
          const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === sym);
          const startP = livePrices[sym] || tokenMeta?.defaultPrice || 100;

          tokenPriceControl.setSchedule({
            symbol: sym,
            direction: direction,
            type: adjustType,
            changePercent: adjustType === 'percentage' ? changePercent : undefined,
            targetPrice: adjustType === 'fixed_target' ? parseFloat(targetPriceInput) : undefined,
            durationHours: durationHoursTotal,
            startPrice: startP,
            adminEmail,
            note: noteInput || `Admin adjustment (${direction} by ${changePercent}% in ${durationValue} ${durationUnit})`
          });
        });

        const dirStr = direction === 'decrease' ? 'decrease' : 'increase';
        toast.success(`Scheduled ${dirStr} of ${changePercent}% over ${durationValue} ${durationUnit} for ${targetSyms.join(', ')}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Operation failed due to an ongoing lock by another admin.');
      return;
    }

    setIsModalOpen(false);
    refreshData();
  };

  // Cancel schedule
  const handleCancelSchedule = (symbol: string) => {
    tokenPriceControl.cancelSchedule(symbol, adminEmail);
    toast.info(`Cancelled trend schedule for ${symbol}`);
    refreshData();
  };

  // Reset single token
  const handleResetToken = (symbol: string) => {
    try {
      tokenPriceControl.resetToken(symbol, adminEmail);
      toast.success(`Reset ${symbol} back to default baseline`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  // Reset all tokens
  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset ALL sample tokens to their standard default baselines? All active schedules will be permanently cleared.')) {
      try {
        tokenPriceControl.resetAllTokens(adminEmail);
        toast.success('Reset all sample tokens to default baseline prices');
        refreshData();
      } catch (err: any) {
        toast.error(err.message || 'Operation failed.');
      }
    }
  };

  // Quick Preset Handlers
  const handleQuickPresetNAS20Pct1Day = () => {
    try {
    const sym = 'NAS';
    const startP = livePrices[sym] || 92.54;
    tokenPriceControl.setSchedule({
      symbol: sym,
      direction: 'decrease',
      type: 'percentage',
      changePercent: 20,
      durationHours: 24, // 1 day
      startPrice: startP,
      adminEmail,
      note: 'Quick preset: NAS -20% in 1 day'
    });
      toast.success('Preset Applied: NAS price will decrease 20% within 1 day');
      refreshData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuickPresetNAS20Pct4Days = () => {
    try {
    const sym = 'NAS';
    const startP = livePrices[sym] || 92.54;
    tokenPriceControl.setSchedule({
      symbol: sym,
      direction: 'decrease',
      type: 'percentage',
      changePercent: 20,
      durationHours: 96, // 4 days
      startPrice: startP,
      adminEmail,
      note: 'Quick preset: NAS -20% in 4 days'
    });
      toast.success('Preset Applied: NAS price will decrease 20% within 4 days');
      refreshData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filter tokens list
  const filteredTokens = SAMPLE_TOKENS_LIST.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedCategory === 'Main') return t.category === 'Main';
    if (selectedCategory === 'Stocks & Commodities') return t.category === 'Stocks & Commodities';
    if (selectedCategory === 'Controlled') {
      const sch = schedules[t.symbol];
      const hasOverride = tokenPriceControl.getManualOverrides()[t.symbol] !== undefined;
      return (sch && sch.isActive) || hasOverride;
    }

    return true;
  });

  const activeSchedulesCount = Object.values(schedules).filter(s => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Price Control Engine
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Tick Interval: 1.0s
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-emerald-400" />
            Spot Control
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Adjust prices and schedule trend factors (percentage change & duration in hours/days) for spot tokens (e.g., set NAS price to decrease by 20% over 1 or 4 days).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAll}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-sm flex items-center gap-2 border border-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Reset All
          </button>
          <button
            onClick={refreshData}
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            title="Refresh engine state"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Total Spot Tokens</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {SAMPLE_TOKENS_LIST.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Main Spot Section Tokens
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Active Price Schedules</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <span>{activeSchedulesCount}</span>
            {activeSchedulesCount > 0 && (
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Running
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Trends currently executing
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>NAS Token Status</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            ${(livePrices['NAS'] || 92.54).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            {schedules['NAS']?.isActive ? (
              <span className="text-rose-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Target: ${schedules['NAS'].targetPrice.toFixed(2)} (-{schedules['NAS'].changePercent}%)
              </span>
            ) : (
              <span className="text-gray-500">Uncontrolled Baseline</span>
            )}
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>Global Market Simulation</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Active</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Real-time WS Broadcast Enabled
          </div>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Quick Scenario Presets</h3>
          </div>
          <span className="text-xs text-gray-400">One-click preset tests</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleQuickPresetNAS20Pct1Day}
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-rose-400 font-semibold text-sm">
              <span>📉 NAS -20% in 1 Day</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              $92.54 → $74.03 over 24 Hours
            </p>
          </button>

          <button
            onClick={handleQuickPresetNAS20Pct4Days}
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-rose-400 font-semibold text-sm">
              <span>📉 NAS -20% in 4 Days</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              $92.54 → $74.03 over 96 Hours
            </p>
          </button>

          <button
            onClick={() => {
              tokenPriceControl.bulkSetSchedule({
                symbols: ['NAS', 'AEP', 'ECB', 'BOT', 'OCT'],
                direction: 'increase',
                changePercent: 25,
                durationHours: 48,
                adminEmail
              });
              toast.success('Applied +25% rally over 2 days across Main tokens!');
              refreshData();
            }}
            className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-emerald-400 font-semibold text-sm">
              <span>🚀 Main Rally (+25% in 2d)</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Boost NAS, AEP, ECB, BOT, OCT over 48h
            </p>
          </button>

          <button
            onClick={() => {
              tokenPriceControl.bulkSetSchedule({
                symbols: ['TTZS', 'CFR', 'STC', 'CFT', 'JOE', 'REO'],
                direction: 'decrease',
                changePercent: 30,
                durationHours: 72,
                adminEmail
              });
              toast.success('Applied -30% market dip over 3 days across Main tokens!');
              refreshData();
            }}
            className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-purple-400 font-semibold text-sm">
              <span>🔻 Main Tokens Dip (-30% in 3d)</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Gradual correction across Main tokens list
            </p>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g. NAS, AEP, BOT)..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Main', 'Stocks & Commodities', 'Controlled'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat === 'Controlled' ? (
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  Active Controlled ({activeSchedulesCount})
                </span>
              ) : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Token Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/80 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Token / Pair</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Base Price</th>
                <th className="py-3.5 px-4 font-semibold">Live Current Price</th>
                <th className="py-3.5 px-4 font-semibold">Trend & Progress</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No sample tokens match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const currentPrice = livePrices[token.symbol] || token.defaultPrice;
                  const sch = schedules[token.symbol];
                  const hasOverride = tokenPriceControl.getManualOverrides()[token.symbol] !== undefined;

                  const isDecreasing = sch?.direction === 'decrease';
                  const isIncreasing = sch?.direction === 'increase';

                  return (
                    <tr 
                      key={token.symbol}
                      className="hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* Token Pair */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <CryptoIcon symbol={token.symbol} className="w-9 h-9" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white tracking-wide">{token.symbol}</span>
                              <span className="text-xs text-gray-400 font-mono">/USDT</span>
                            </div>
                            <div className="text-xs text-gray-400 font-normal">{token.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          token.category === 'Layer-2' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {token.category}
                        </span>
                      </td>

                      {/* Base Default Price */}
                      <td className="py-4 px-4 font-mono text-gray-400">
                        ${token.defaultPrice.toFixed(2)}
                      </td>

                      {/* Live Current Price */}
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className={sch?.isActive ? (isDecreasing ? 'text-rose-400' : 'text-emerald-400') : 'text-white'}>
                            ${currentPrice.toFixed(2)}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                      </td>

                      {/* Trend & Progress */}
                      <td className="py-4 px-4">
                        {sch && sch.isActive ? (
                          <div className="space-y-1.5 max-w-xs">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-semibold flex items-center gap-1 ${
                                isDecreasing ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {isDecreasing ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                {isDecreasing ? '-' : '+'}{sch.changePercent}% ({sch.durationHours >= 24 ? `${(sch.durationHours/24).toFixed(1)}d` : `${sch.durationHours}h`})
                              </span>
                              <span className="text-gray-400 font-mono">
                                Target: ${sch.targetPrice.toFixed(2)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            {(() => {
                              const controlledData = tokenPriceControl.getControlledPrice(token.symbol, currentPrice);
                              const progressPct = controlledData.progress ?? 0;
                              return (
                                <div className="space-y-1">
                                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${isDecreasing ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-gray-400 flex justify-between">
                                    <span>{progressPct}% completed</span>
                                    <span>{sch.note || 'Active'}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : hasOverride ? (
                          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">
                            Instant Price Override Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5 w-fit">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            Auto Drift (±10 USDT / hr)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(token.symbol)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Adjust Trend
                          </button>

                          {sch && sch.isActive && (
                            <button
                              onClick={() => handleCancelSchedule(token.symbol)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                              title="Stop active schedule"
                            >
                              <StopCircle className="w-4 h-4" />
                            </button>
                          )}

                          {(sch || hasOverride) && (
                            <button
                              onClick={() => handleResetToken(token.symbol)}
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition-colors"
                              title="Reset to default baseline"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Price Control Action History</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">Last 200 Audit Events</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-6 text-sm">
              No recent price adjustment logs recorded yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                    {log.symbol}
                  </span>
                  <span className="text-gray-300 font-medium">{log.details}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                  <span>By: <strong className="text-gray-300">{log.adminEmail}</strong></span>
                  <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal / Drawer for Configuring Trend Factors & Percentage */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111827] border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <CryptoIcon symbol={activeSymbol} className="w-10 h-10" />
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Adjust {activeSymbol} Price Trend
                    </h3>
                    <p className="text-xs text-gray-400">
                      Configure percentage factor and duration for sample market simulation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleApplyAdjustment} className="space-y-4">
                {/* Mode Selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">
                    Adjustment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('percentage')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        adjustType === 'percentage'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('fixed_target')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        adjustType === 'fixed_target'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Target Price ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('manual_override')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        adjustType === 'manual_override'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      Instant Override
                    </button>
                  </div>
                </div>

                {adjustType !== 'manual_override' && (
                  <>
                    {/* Direction */}
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-2">
                        Trend Direction
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDirection('decrease')}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                            direction === 'decrease'
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          <TrendingDown className="w-4 h-4" />
                          Price Decrease (-)
                        </button>

                        <button
                          type="button"
                          onClick={() => setDirection('increase')}
                          className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                            direction === 'increase'
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          Price Increase (+)
                        </button>
                      </div>
                    </div>

                    {/* Percentage or Fixed Target */}
                    {adjustType === 'percentage' ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-gray-300">
                            Percentage Change (%)
                          </label>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            {direction === 'decrease' ? '-' : '+'}{changePercent}%
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0.1"
                          max="90"
                          step="0.5"
                          value={changePercent}
                          onChange={(e) => setChangePercent(parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex gap-2 mt-2">
                          {[5, 10, 15, 20, 25, 30, 50].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setChangePercent(pct)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                changePercent === pct
                                  ? 'bg-emerald-500 text-black font-bold border-emerald-500'
                                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                          Target Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={targetPriceInput}
                          onChange={(e) => setTargetPriceInput(e.target.value)}
                          placeholder="e.g. 74.03"
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}

                    {/* Duration Factor (Hours/Days) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                        Duration Factor
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={durationValue}
                          onChange={(e) => setDurationValue(parseFloat(e.target.value) || 1)}
                          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <select
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value as 'hours' | 'days')}
                          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="days">Day(s)</option>
                          <option value="hours">Hour(s)</option>
                        </select>
                      </div>

                      {/* Quick Duration Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '1 Hour (60m)', val: 1, unit: 'hours' },
                          { label: '2 Hours', val: 2, unit: 'hours' },
                          { label: '6 Hours', val: 6, unit: 'hours' },
                          { label: '12 Hours', val: 12, unit: 'hours' },
                          { label: '1 Day (24h)', val: 1, unit: 'days' },
                          { label: '2 Days', val: 2, unit: 'days' },
                          { label: '3 Days', val: 3, unit: 'days' },
                          { label: '4 Days', val: 4, unit: 'days' },
                          { label: '7 Days', val: 7, unit: 'days' }
                        ].map((d) => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => {
                              setDurationValue(d.val);
                              setDurationUnit(d.unit as 'hours' | 'days');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              durationValue === d.val && durationUnit === d.unit
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {adjustType === 'manual_override' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                      Instant Price Override ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      placeholder="e.g. 88.50"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Sets the token price immediately without waiting over time.
                    </p>
                  </div>
                )}

                {/* Live Preview Box */}
                <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-gray-300 flex items-center justify-between border-b border-gray-800 pb-2">
                    <span>Live Simulation Calculation Preview</span>
                    <span className="text-emerald-400 font-mono">Real-Time</span>
                  </div>
                  {(() => {
                    const startP = livePrices[activeSymbol] || SAMPLE_TOKENS_LIST.find(t => t.symbol === activeSymbol)?.defaultPrice || 100;
                    let calculatedTarget = startP;

                    if (adjustType === 'percentage') {
                      const pct = changePercent / 100;
                      calculatedTarget = direction === 'decrease' ? startP * (1 - pct) : startP * (1 + pct);
                    } else if (adjustType === 'fixed_target' || adjustType === 'manual_override') {
                      calculatedTarget = parseFloat(targetPriceInput) || startP;
                    }

                    const durHours = durationUnit === 'days' ? durationValue * 24 : durationValue;
                    const priceDiff = calculatedTarget - startP;

                    return (
                      <div className="grid grid-cols-2 gap-2 text-gray-400 font-mono">
                        <div>
                          Current Price: <strong className="text-white">${startP.toFixed(2)}</strong>
                        </div>
                        <div>
                          Target Price: <strong className={priceDiff < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            ${calculatedTarget.toFixed(2)} ({priceDiff >= 0 ? '+' : ''}{(((calculatedTarget - startP) / startP) * 100).toFixed(1)}%)
                          </strong>
                        </div>
                        <div>
                          Duration: <strong className="text-white">{durationValue} {durationUnit} ({durHours}h)</strong>
                        </div>
                        <div>
                          Rate: <strong className="text-gray-300">{(priceDiff / Math.max(1, durHours)).toFixed(3)} $/hr</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Optional Note */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Scenario Description / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. Advisors training scenario - NAS bearish dump"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Apply Price Trend
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSampleTokens;
