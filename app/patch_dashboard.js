const fs = require('fs');
const file = 'src/app/admin/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update filterValues and queries
content = content.replace(
  /const buildParams = \(\) => \{[\s\S]*?return `\?from=\$\{from\}&to=\$\{to\}`;[\s\S]*?\};/,
  `const buildParams = () => {
    const from = subDays(new Date(), activeDays).toISOString();
    const to = new Date().toISOString();
    const params = new URLSearchParams({ from, to });
    if (activeFilters.includes("location") && filterValues.location) {
      params.append("location", filterValues.location);
    }
    if (activeFilters.includes("source") && filterValues.source) {
      params.append("source", filterValues.source);
    }
    if (activeFilters.includes("device") && filterValues.device) {
      params.append("device", filterValues.device);
    }
    return \`?\${params.toString()}\`;
  };
  
  const queryDeps = [activeDays, activeFilters, filterValues];`
);

content = content.replace(/queryKey: \["analytics-summary", activeDays\]/g, 'queryKey: ["analytics-summary", ...queryDeps]');
content = content.replace(/queryKey: \["analytics-timeseries", activeDays\]/g, 'queryKey: ["analytics-timeseries", ...queryDeps]');
content = content.replace(/queryKey: \["analytics-countries", activeDays\]/g, 'queryKey: ["analytics-countries", ...queryDeps]');
content = content.replace(/queryKey: \["analytics-links", activeDays\]/g, 'queryKey: ["analytics-links", ...queryDeps]');
content = content.replace(/queryKey: \["analytics-devices", activeDays\]/g, 'queryKey: ["analytics-devices", ...queryDeps]');
content = content.replace(/queryKey: \["analytics-sources", activeDays\]/g, 'queryKey: ["analytics-sources", ...queryDeps]');

// 2. Update active filters display logic
content = content.replace(
  /\{opt\?\.label\}: \{filterValues\[f\] \|\| "Todos"\}/g,
  `{opt?.label}: {
                    f === "location" && countries?.find((c: any) => c.country === filterValues[f])?.countryName 
                      ? countries.find((c: any) => c.country === filterValues[f]).countryName 
                      : filterValues[f] || "Todos"
                  }`
);

// 3. Update active filter set logic for location
content = content.replace(
  /setFilterValues\(\(prev\) => \(\{ \.\.\.prev, location: c\.countryName \}\)\);/g,
  `setFilterValues((prev) => ({ ...prev, location: c.country }));`
);

fs.writeFileSync(file, content);
