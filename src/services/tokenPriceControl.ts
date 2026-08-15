export interface TokenPriceSchedule {
  id: string;
  symbol: string; // e.g. "NAS", "AEP", "BOT", "TTZS", "ECB", etc.
  type: 'percentage' | 'fixed_target' | 'manual_override';
  direction: 'increase' | 'decrease' | 'set_price';
  changePercent: number; // e.g. 20 for 20%
  startPrice: number; // Base or starting price e.g. 92.54
  targetPrice: number; // Target price e.g. 74.032
  startTime: number; // timestamp in ms
  durationHours: number; // e.g., 24 (1 day), 96 (4 days)
  endTime: number; // timestamp in ms
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByAdmin?: string;
  note?: string;
}

export interface TokenPriceAuditLog {
  id: string;
  timestamp: string;
  symbol: string;
  action: string;
  details: string;
  adminEmail: string;
}

export const SAMPLE_TOKENS_LIST = [
  { symbol: 'NAS', name: 'Nebula Alpha Synth', category: 'Main', defaultPrice: 92.54 },
  { symbol: 'AEP', name: 'Apex Execution Pair', category: 'Main', defaultPrice: 84.97 },
  { symbol: 'ECB', name: 'Ecosystem Core Bridge', category: 'Main', defaultPrice: 89.32 },
  { symbol: 'BOT', name: 'Bot Trading Engine', category: 'Main', defaultPrice: 123.50 },
  { symbol: 'TTZS', name: 'Titan Training Zone', category: 'Main', defaultPrice: 131.75 },
  { symbol: 'OCT', name: 'Octa Core L2', category: 'Main', defaultPrice: 101.94 },
  { symbol: 'CFR', name: 'Crypto Financial Reserve', category: 'Main', defaultPrice: 127.78 },
  { symbol: 'STC', name: 'Smart Training Coin', category: 'Main', defaultPrice: 132.22 },
  { symbol: 'CFT', name: 'Core Financial Futures', category: 'Main', defaultPrice: 131.81 },
  { symbol: 'RTV', name: 'Real Time Velocity', category: 'Main', defaultPrice: 140.62 },
  { symbol: 'JOE', name: 'Joe Trader Coin', category: 'Main', defaultPrice: 140.52 },
  { symbol: 'REO', name: 'Reserve Ecosystem Oracle', category: 'Main', defaultPrice: 111.31 },
  { symbol: 'BEX', name: 'Block Exchange L2', category: 'Main', defaultPrice: 128.30 },
  { symbol: 'RYR', name: 'Rhythm Yield Reserve', category: 'Main', defaultPrice: 120.27 },
  { symbol: 'OAS', name: 'Oasis Alpha L2', category: 'Main', defaultPrice: 110.45 },
  { symbol: 'JTC', name: 'Joint Training Coin', category: 'Main', defaultPrice: 66.81 },
  { symbol: 'FTT', name: 'Futures Training Token', category: 'Main', defaultPrice: 105.93 },
  { symbol: 'AUR', name: 'Aurora Synth', category: 'Main', defaultPrice: 12.50 },
  { symbol: 'VTX', name: 'Vortex Protocol', category: 'Main', defaultPrice: 4.80 },
  { symbol: 'NEX', name: 'Nexus Chain', category: 'Main', defaultPrice: 0.95 },
  { symbol: 'GLX', name: 'Galaxya Network', category: 'Main', defaultPrice: 22.40 },
  { symbol: 'PHX', name: 'Phoenix Token', category: 'Main', defaultPrice: 1.25 },
  { symbol: 'ZEL', name: 'Zeta Labs', category: 'Main', defaultPrice: 0.45 },
  { symbol: 'CRY', name: 'Crypto Alpha', category: 'Main', defaultPrice: 8.50 },
  { symbol: 'ION', name: 'Ion Layer', category: 'Main', defaultPrice: 1.15 },
  { symbol: 'NOVA', name: 'Nova Network', category: 'Main', defaultPrice: 0.85 },
  { symbol: 'LYN', name: 'Lynx Protocol', category: 'Main', defaultPrice: 0.35 },
  
  // Custom Equity & Stocks
  { symbol: 'CPX', name: 'Crypx-PRO Inc', category: 'Stocks & Commodities', defaultPrice: 285.50 },
  { symbol: 'ARTS', name: 'Artesys Corp', category: 'Stocks & Commodities', defaultPrice: 164.20 },
  { symbol: 'AXG', name: 'AeroX Global', category: 'Stocks & Commodities', defaultPrice: 215.80 },
  { symbol: 'BGNX', name: 'BioGenix Labs', category: 'Stocks & Commodities', defaultPrice: 92.40 },
  { symbol: 'VOLT', name: 'Volt Motors', category: 'Stocks & Commodities', defaultPrice: 148.60 },
  { symbol: 'QCORE', name: 'QuantumCore Tech', category: 'Stocks & Commodities', defaultPrice: 312.00 },
  { symbol: 'CYBR', name: 'CyberShield Inc', category: 'Stocks & Commodities', defaultPrice: 185.30 },
  { symbol: 'OMNI', name: 'OmniMart Group', category: 'Stocks & Commodities', defaultPrice: 230.10 },
  { symbol: 'CINE', name: 'CineVerse Media', category: 'Stocks & Commodities', defaultPrice: 78.90 },
  { symbol: 'TFRA', name: 'Terra Infra Group', category: 'Stocks & Commodities', defaultPrice: 112.50 }
];

const SCHEDULES_STORAGE_KEY = 'crypx_sample_token_schedules_v1';
const MANUAL_OVERRIDES_KEY = 'crypx_sample_token_overrides_v1';
const AUDIT_LOGS_KEY = 'crypx_sample_token_audit_logs_v1';

// Internal state caches
let schedulesMap: Record<string, TokenPriceSchedule> = {};
let manualOverridesMap: Record<string, number> = {};
let auditLogsList: TokenPriceAuditLog[] = [];

// Initialize memory state from localStorage
const loadFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const storedSchedules = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (storedSchedules) {
      schedulesMap = JSON.parse(storedSchedules);
    }
    const storedOverrides = localStorage.getItem(MANUAL_OVERRIDES_KEY);
    if (storedOverrides) {
      manualOverridesMap = JSON.parse(storedOverrides);
    }
    const storedLogs = localStorage.getItem(AUDIT_LOGS_KEY);
    if (storedLogs) {
      auditLogsList = JSON.parse(storedLogs);
    }
  } catch (e) {
    console.error("Failed to load token price controls from storage:", e);
  }
};

loadFromStorage();

const saveSchedules = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedulesMap));
  window.dispatchEvent(new Event('token-price-control-updated'));
};

const saveOverrides = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANUAL_OVERRIDES_KEY, JSON.stringify(manualOverridesMap));
  window.dispatchEvent(new Event('token-price-control-updated'));
};

const saveAuditLogs = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditLogsList));
};

const logAction = (symbol: string, action: string, details: string, adminEmail: string = 'admin') => {
  const newLog: TokenPriceAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    symbol,
    action,
    details,
    adminEmail
  };
  auditLogsList = [newLog, ...auditLogsList].slice(0, 200); // Keep last 200
  saveAuditLogs();
};

/**
 * Calculates smooth pseudo-random hourly drift between -10 and +10 USDT for uncontrolled sample tokens.
 */
const getUncontrolledHourlyPrice = (cleanSym: string, basePrice: number): number => {
  const now = Date.now();
  const HOUR_MS = 3600 * 1000;

  // Simple string hash for symbol seed
  let hash = 0;
  for (let i = 0; i < cleanSym.length; i++) {
    hash = (hash << 5) - hash + cleanSym.charCodeAt(i);
    hash |= 0;
  }

  const currentHour = Math.floor(now / HOUR_MS);
  const hourProgress = (now % HOUR_MS) / HOUR_MS; // 0 to 1 over current hour

  // Deterministic random offset (-10 to +10 USDT) for a given hour index
  const getHourOffset = (h: number) => {
    const seed = Math.sin(hash * 9999 + h * 1234.5678) * 10000;
    const raw = seed - Math.floor(seed); // 0 to 1
    return (raw * 20) - 10; // scale to [-10, +10] USDT
  };

  const startOffset = getHourOffset(currentHour);
  const endOffset = getHourOffset(currentHour + 1);

  // Smooth cosine interpolation ratio over the 60 minutes
  const smoothRatio = (1 - Math.cos(hourProgress * Math.PI)) / 2;
  const currentOffset = startOffset + (endOffset - startOffset) * smoothRatio;

  // Add micro tick noise (±0.04 USDT) so ticks update smoothly in real time
  const microNoise = (Math.random() * 0.08) - 0.04;

  const finalPrice = Math.max(0.0001, basePrice + currentOffset + microNoise);
  return parseFloat(finalPrice.toFixed(4));
};

export const tokenPriceControl = {
  getSchedules: (): Record<string, TokenPriceSchedule> => {
    return { ...schedulesMap };
  },

  getSchedule: (symbol: string): TokenPriceSchedule | null => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    return schedulesMap[cleanSym] || null;
  },

  getManualOverrides: (): Record<string, number> => {
    return { ...manualOverridesMap };
  },

  getAuditLogs: (): TokenPriceAuditLog[] => {
    return [...auditLogsList];
  },

  /**
   * Main calculated price retriever for market service & live tickers
   */
  getControlledPrice: (symbol: string, currentFallbackPrice: number): { price: number; isControlled: boolean; progress?: number; targetPrice?: number } => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();

    // 1. Check if there is an active schedule
    const schedule = schedulesMap[cleanSym];
    if (schedule && schedule.isActive) {
      const now = Date.now();
      
      if (now <= schedule.startTime) {
        return {
          price: schedule.startPrice,
          isControlled: true,
          progress: 0,
          targetPrice: schedule.targetPrice
        };
      }

      const totalDuration = schedule.endTime - schedule.startTime;
      if (totalDuration <= 0 || now >= schedule.endTime) {
        // Target time reached! Small ±0.04% natural fluctuation around target
        const noise = (Math.random() * 0.0008) - 0.0004;
        const finalPrice = Math.max(0.0001, schedule.targetPrice * (1 + noise));
        return {
          price: parseFloat(finalPrice.toFixed(4)),
          isControlled: true,
          progress: 100,
          targetPrice: schedule.targetPrice
        };
      }

      // Elapsed ratio [0 .. 1]
      const elapsedTime = now - schedule.startTime;
      const progressRatio = Math.min(1, Math.max(0, elapsedTime / totalDuration));
      
      // Interpolate price linearly from startPrice to targetPrice
      const rawPrice = schedule.startPrice + (schedule.targetPrice - schedule.startPrice) * progressRatio;
      
      // Add subtle micro tick noise (± 0.03%) so chart candles and tickers move smoothly
      const noise = (Math.random() * 0.0006) - 0.0003;
      const tickPrice = Math.max(0.0001, rawPrice * (1 + noise));

      return {
        price: parseFloat(tickPrice.toFixed(4)),
        isControlled: true,
        progress: Math.round(progressRatio * 100),
        targetPrice: schedule.targetPrice
      };
    }

    // 2. Check if manual instant override exists
    if (manualOverridesMap[cleanSym] !== undefined) {
      const overrideVal = manualOverridesMap[cleanSym];
      const noise = (Math.random() * 0.0004) - 0.0002;
      const tickPrice = Math.max(0.0001, overrideVal * (1 + noise));
      return {
        price: parseFloat(tickPrice.toFixed(4)),
        isControlled: true
      };
    }

    // 3. Uncontrolled state for Spot Control tokens: simulate ±10 USDT price changes within an hour
    const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
    if (tokenMeta) {
      const simPrice = getUncontrolledHourlyPrice(cleanSym, tokenMeta.defaultPrice);
      return {
        price: simPrice,
        isControlled: true // Flag as controlled so marketService broadcasts simulated ticker updates
      };
    }

    // Uncontrolled standard market tokens
    return {
      price: currentFallbackPrice,
      isControlled: false
    };
  },

  /**
   * Admin configures a percentage trend adjustment or target price schedule
   */
  setSchedule: (params: {
    symbol: string;
    direction: 'increase' | 'decrease' | 'set_price';
    type: 'percentage' | 'fixed_target';
    changePercent?: number; // e.g. 20 for 20%
    targetPrice?: number;
    durationHours: number; // e.g. 24 for 1 day, 96 for 4 days
    startPrice?: number;
    adminEmail?: string;
    note?: string;
  }): TokenPriceSchedule => {
    const cleanSym = params.symbol.replace('USDT', '').replace('/', '').toUpperCase();
    const tokenMeta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
    
    // Get starting price baseline
    const baseStartPrice = params.startPrice || tokenMeta?.defaultPrice || 100;
    let target = baseStartPrice;

    if (params.type === 'percentage') {
      const pct = (params.changePercent || 0) / 100;
      if (params.direction === 'decrease') {
        target = baseStartPrice * (1 - pct);
      } else {
        target = baseStartPrice * (1 + pct);
      }
    } else if (params.targetPrice !== undefined) {
      target = params.targetPrice;
    }

    target = Math.max(0.0001, parseFloat(target.toFixed(4)));

    const startTime = Date.now();
    // Enforce minimum duration of 1 hour (60 minutes) for manual setup
    const effectiveHours = Math.max(1, params.durationHours);
    const durationMs = effectiveHours * 3600 * 1000;
    const endTime = startTime + durationMs;

    const newSchedule: TokenPriceSchedule = {
      id: `sch_${cleanSym}_${Date.now()}`,
      symbol: cleanSym,
      type: params.type,
      direction: params.direction,
      changePercent: params.changePercent || 0,
      startPrice: baseStartPrice,
      targetPrice: target,
      startTime,
      durationHours: effectiveHours,
      endTime,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByAdmin: params.adminEmail || 'admin',
      note: params.note || ''
    };

    schedulesMap[cleanSym] = newSchedule;
    delete manualOverridesMap[cleanSym];

    saveSchedules();
    saveOverrides();

    const dirText = params.direction === 'decrease' ? 'Decrease' : 'Increase';
    const pctText = params.type === 'percentage' ? `${params.changePercent}%` : `$${target}`;
    const durText = params.durationHours >= 24 ? `${(params.durationHours / 24).toFixed(1)} day(s)` : `${params.durationHours} hour(s)`;
    
    logAction(
      cleanSym,
      'SET_PRICE_TREND',
      `Scheduled ${dirText} of ${pctText} from $${baseStartPrice.toFixed(2)} to target $${target.toFixed(2)} over ${durText}`,
      params.adminEmail || 'admin'
    );

    return newSchedule;
  },

  /**
   * Instant direct price override
   */
  setManualOverride: (symbol: string, targetPrice: number, adminEmail?: string) => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    manualOverridesMap[cleanSym] = targetPrice;
    
    // Clear schedule for this symbol
    delete schedulesMap[cleanSym];
    saveSchedules();
    saveOverrides();

    logAction(
      cleanSym,
      'MANUAL_OVERRIDE',
      `Set instant override price to $${targetPrice.toFixed(2)}`,
      adminEmail || 'admin'
    );
  },

  /**
   * Cancel active schedule for a symbol
   */
  cancelSchedule: (symbol: string, adminEmail?: string) => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    if (schedulesMap[cleanSym]) {
      schedulesMap[cleanSym].isActive = false;
      delete schedulesMap[cleanSym];
      saveSchedules();
      logAction(cleanSym, 'CANCEL_SCHEDULE', `Cancelled active trend schedule for ${cleanSym}`, adminEmail || 'admin');
    }
  },

  /**
   * Reset a token back to standard uncontrolled default
   */
  resetToken: (symbol: string, adminEmail?: string) => {
    const cleanSym = symbol.replace('USDT', '').replace('/', '').toUpperCase();
    delete schedulesMap[cleanSym];
    delete manualOverridesMap[cleanSym];
    saveSchedules();
    saveOverrides();
    logAction(cleanSym, 'RESET_DEFAULT', `Reset ${cleanSym} to default market calculation`, adminEmail || 'admin');
  },

  /**
   * Reset all sample tokens to uncontrolled standard defaults
   */
  resetAllTokens: (adminEmail?: string) => {
    schedulesMap = {};
    manualOverridesMap = {};
    saveSchedules();
    saveOverrides();
    logAction('ALL', 'RESET_ALL', 'Reset all sample tokens to standard uncontrolled defaults', adminEmail || 'admin');
  },

  /**
   * Bulk apply trend schedule across multiple symbols
   */
  bulkSetSchedule: (params: {
    symbols: string[];
    direction: 'increase' | 'decrease';
    changePercent: number;
    durationHours: number;
    adminEmail?: string;
  }) => {
    params.symbols.forEach(sym => {
      const cleanSym = sym.replace('USDT', '').replace('/', '').toUpperCase();
      const meta = SAMPLE_TOKENS_LIST.find(t => t.symbol === cleanSym);
      const startP = meta?.defaultPrice || 100;

      tokenPriceControl.setSchedule({
        symbol: cleanSym,
        direction: params.direction,
        type: 'percentage',
        changePercent: params.changePercent,
        durationHours: params.durationHours,
        startPrice: startP,
        adminEmail: params.adminEmail,
        note: `Bulk schedule (${params.symbols.length} tokens)`
      });
    });
  }
};
