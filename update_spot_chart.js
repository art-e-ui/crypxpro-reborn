const fs = require('fs');
let content = fs.readFileSync('src/pages/app/Spot.tsx', 'utf8');

// Add showChart state
if (!content.includes('const [showChart, setShowChart] = useState(true);')) {
  content = content.replace('const [spotOrders, setSpotOrders] = useState<SpotOrder[]>([]);', 
    'const [spotOrders, setSpotOrders] = useState<SpotOrder[]>([]);\n  const [showChart, setShowChart] = useState(true);');
}

// Find Chart Card and replace col-span and height logic
content = content.replace(
  /<div className="lg:col-span-6 bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col justify-between space-y-3">/g,
  `<div className={\`\${showChart ? 'lg:col-span-6' : 'lg:col-span-12'} bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col \${showChart ? 'justify-between space-y-3' : ''}\`}>`
);

// Add the button to timeframe controls
content = content.replace(
  /\{ \/\* Timeframe Controls \*\/ \}\s*<div className="flex gap-1 bg-muted\/60 p-1 rounded-xl border border-border">/g,
  `{ /* Timeframe Controls */ }
              <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border">`
);

// Close the wrapper around the button
content = content.replace(
  /<\/div>\s*<\/div>\s*\{ \/\* Chart Area \*\/ \}/g,
  `</div>
                <button 
                  onClick={() => setShowChart(!showChart)}
                  className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground px-2 py-1 rounded-lg text-[10px] font-bold border border-border transition-colors flex items-center gap-1"
                >
                  {showChart ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span className="hidden sm:inline">{showChart ? 'Hide Chart' : 'Show Chart'}</span>
                </button>
              </div>
            </div>
            { /* Chart Area */ }`
);

// Wrap the chart area inside {showChart && ( ... )}
content = content.replace(
  /<div className="h-\[380px\] sm:h-\[420px\] w-full rounded-xl overflow-hidden border border-border">\s*<TradingChart symbol=\{selectedPair\} interval=\{chartInterval\} className="h-full" \/>\s*<\/div>/g,
  `{showChart && (
              <div className="h-[380px] sm:h-[420px] w-full rounded-xl overflow-hidden border border-border mt-3">
                <TradingChart symbol={selectedPair} interval={chartInterval} className="h-full" />
              </div>
            )}`
);

// Order Book Column Span
content = content.replace(
  /<div className="lg:col-span-3 h-\[420px\] sm:h-\[480px\]">\s*<EnhancedOrderBook/g,
  `<div className={\`\${showChart ? 'lg:col-span-3' : 'lg:col-span-6'} h-[420px] sm:h-[480px]\`}>
            <EnhancedOrderBook`
);

// Spot Order Form Column Span
content = content.replace(
  /<div className="lg:col-span-3 h-\[420px\] sm:h-\[480px\]">\s*<SpotOrderForm/g,
  `<div className={\`\${showChart ? 'lg:col-span-3' : 'lg:col-span-6'} h-[420px] sm:h-[480px]\`}>
            <SpotOrderForm`
);


fs.writeFileSync('src/pages/app/Spot.tsx', content);
