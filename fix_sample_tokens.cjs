const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/SampleTokens.tsx', 'utf8');

// Replace handleApplyAdjustment body
content = content.replace(
  /if \(adjustType === 'manual_override'\) \{([\s\S]*?)\} else \{([\s\S]*?)\}/,
  `try {
      if (adjustType === 'manual_override') {$1} else {$2}
    } catch (err: any) {
      toast.error(err.message || 'Operation failed due to an ongoing lock by another admin.');
      return;
    }`
);

// handleCancelSchedule
content = content.replace(
  /const handleCancelSchedule = \(symbol: string\) => \{\s*tokenPriceControl\.cancelSchedule\(symbol, adminEmail\);\s*toast\.success\([\s\S]*?\);\s*refreshData\(\);\s*\};/,
  `const handleCancelSchedule = (symbol: string) => {
    try {
      tokenPriceControl.cancelSchedule(symbol, adminEmail);
      toast.success(\`Cancelled active trend schedule for \${symbol}\`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };`
);

// handleResetToken
content = content.replace(
  /const handleResetToken = \(symbol: string\) => \{\s*tokenPriceControl\.resetToken\(symbol, adminEmail\);\s*toast\.success\([\s\S]*?\);\s*refreshData\(\);\s*\};/,
  `const handleResetToken = (symbol: string) => {
    try {
      tokenPriceControl.resetToken(symbol, adminEmail);
      toast.success(\`Reset \${symbol} back to default baseline\`);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };`
);

// handleResetAll
content = content.replace(
  /const handleResetAll = \(\) => \{\s*if \(window\.confirm\([\s\S]*?\)\) \{\s*tokenPriceControl\.resetAllTokens\(adminEmail\);\s*toast\.success\([\s\S]*?\);\s*refreshData\(\);\s*\}\s*\};/,
  `const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset ALL sample tokens to their standard default baselines? All active schedules will be permanently cleared.')) {
      try {
        tokenPriceControl.resetAllTokens(adminEmail);
        toast.success('Reset all sample tokens to default baseline prices');
        refreshData();
      } catch (err: any) {
        toast.error(err.message || 'Operation failed.');
      }
    }
  };`
);

// Quick presets
content = content.replace(
  /const handleQuickPresetNAS20Pct1Day = \(\) => \{([\s\S]*?)\s*toast\.success\([\s\S]*?\);\s*refreshData\(\);\s*\};/,
  `const handleQuickPresetNAS20Pct1Day = () => {
    try {$1
      toast.success('Preset Applied: NAS price will decrease 20% within 1 day');
      refreshData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };`
);

content = content.replace(
  /const handleQuickPresetNAS20Pct4Days = \(\) => \{([\s\S]*?)\s*toast\.success\([\s\S]*?\);\s*refreshData\(\);\s*\};/,
  `const handleQuickPresetNAS20Pct4Days = () => {
    try {$1
      toast.success('Preset Applied: NAS price will decrease 20% within 4 days');
      refreshData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };`
);


fs.writeFileSync('src/pages/admin/SampleTokens.tsx', content);
console.log('Success UI');
