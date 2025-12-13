// InsightFlow Analytics - Vanilla JS Implementation using HTM
// Robust, Babel-free implementation

const { useState, useEffect, useMemo } = React;
const html = htm.bind(React.createElement);

// Safe Recharts Destructuring
const RC = window.Recharts || {};
const {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Brush, ReferenceLine
} = RC;

// --- Icon Component (Robust) ---
const Icon = ({ name, size = 18, className = "" }) => {
    const lucide = window.lucide || {};
    if (!lucide.icons) return null;
    const iconData = lucide.icons[name];
    if (!iconData) return null;

    const [tag, attrs, children] = iconData;

    const createChildren = (childList) => childList.map(([childTag, childAttrs], i) =>
        React.createElement(childTag, { ...childAttrs, key: i })
    );

    return React.createElement(tag, {
        ...attrs,
        width: size,
        height: size,
        className: `lucide lucide-${name} ${className}`
    }, createChildren(children));
};

// --- Data Generators & Constants ---

const generateRevenueOrdersData = (days) => {
    const count = days === '90days' ? 90 : (days === '30days' ? 30 : 180);
    return Array.from({ length: count }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (count - 1 - i));
        return {
            date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            revenue: 35000 + Math.random() * 20000,
            orders: 20 + Math.floor(Math.random() * 30),
            previousRevenue: 32000 + Math.random() * 18000,
            previousOrders: 18 + Math.floor(Math.random() * 25)
        };
    });
};

const cohortData = [
    { cohort: 'Jan 2024', m1: 100, m2: 72, m3: 58, m4: 48, m5: 42, m6: 38, users: 245 },
    { cohort: 'Feb 2024', m1: 100, m2: 75, m3: 61, m4: 52, m5: 45, m6: 41, users: 289 },
    { cohort: 'Mar 2024', m1: 100, m2: 71, m3: 56, m4: 47, m5: 40, m6: null, users: 312 },
    { cohort: 'Apr 2024', m1: 100, m2: 78, m3: 65, m4: 55, m5: 49, m6: null, users: 334 },
    { cohort: 'May 2024', m1: 100, m2: 74, m3: 62, m4: 53, m5: null, m6: null, users: 298 },
    { cohort: 'Jun 2024', m1: 100, m2: 69, m3: 57, m4: 48, m5: null, m6: null, users: 356 },
    { cohort: 'Jul 2024', m1: 100, m2: 76, m3: 63, m4: null, m5: null, m6: null, users: 387 },
    { cohort: 'Aug 2024', m1: 100, m2: 73, m3: 60, m4: null, m5: null, m6: null, users: 401 },
    { cohort: 'Sep 2024', m1: 100, m2: 70, m3: 58, m4: null, m5: null, m6: null, users: 423 },
    { cohort: 'Oct 2024', m1: 100, m2: 65, m3: 45, m4: null, m5: null, m6: null, users: 456 },
    { cohort: 'Nov 2024', m1: 100, m2: 68, m3: null, m4: null, m5: null, m6: null, users: 489 },
    { cohort: 'Dec 2024', m1: 100, m2: null, m3: null, m4: null, m5: null, m6: null, users: 512 }
];

const revenueBreakdownData = [
    { month: 'Jul', new: 4000, returning: 2400, upsells: 2400 },
    { month: 'Aug', new: 3000, returning: 1398, upsells: 2210 },
    { month: 'Sep', new: 2000, returning: 9800, upsells: 2290 },
    { month: 'Oct', new: 2780, returning: 3908, upsells: 2000 },
    { month: 'Nov', new: 1890, returning: 4800, upsells: 2181 },
    { month: 'Dec', new: 2390, returning: 3800, upsells: 2500 }
];

// --- Sub-Components ---

const KeyMetrics = () => {
    const metrics = [
        { label: 'Avg Retention Rate', value: '68.5%', change: '+2.3%', iconName: 'users', color: 'blue' },
        { label: 'Customer LTV', value: '₹18,450', change: '+₹1,200', iconName: 'dollar-sign', color: 'green' },
        { label: 'Monthly Churn', value: '12.5%', change: '-1.8%', iconName: 'alert-circle', color: 'orange' },
        { label: 'Repeat Purchase', value: '34.2%', change: '+3.5%', iconName: 'shopping-bag', color: 'purple' }
    ];

    return html`
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            ${metrics.map((m, i) => html`
                <div key=${i} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-${m.color}-100">
                             <${Icon} name=${m.iconName} size=${24} className="text-${m.color}-600" />
                        </div>
                        <${Icon} name="trending-up" size=${20} className="text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">${m.label}</p>
                    <p className="text-3xl font-bold text-gray-900">${m.value}</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                        <${Icon} name="trending-up" size=${16} /> ${m.change}
                    </p>
                </div>
            `)}
        </div>
    `;
};

const RevenueChart = ({ data }) => {
    const [chartView, setChartView] = useState('combined');

    return html`
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <h3 className="text-xl font-semibold">Revenue vs Orders Trend</h3>
                <div className="flex gap-2">
                    ${['combined', 'revenue-only', 'orders-only'].map(view => html`
                        <button
                            key=${view}
                            onClick=${() => setChartView(view)}
                            className=${`px-3 py-1.5 text-sm rounded-lg capitalize ${chartView === view ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            ${view.replace('-', ' ')}
                        </button>
                    `)}
                </div>
            </div>
            
            <${ResponsiveContainer} width="100%" height=${400}>
                <${ComposedChart} data=${data}>
                    <${RC.defs}>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity=${0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity=${0.1}/>
                        </linearGradient>
                    </${RC.defs}>
                    <${CartesianGrid} strokeDasharray="3 3" stroke="#E5E7EB" />
                    <${XAxis} dataKey="date" stroke="#6B7280" fontSize=${12} interval="preserveStartEnd" />
                    <${YAxis} yAxisId="left" stroke="#3B82F6" fontSize=${12} label=${{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }} />
                    <${YAxis} yAxisId="right" orientation="right" stroke="#10B981" fontSize=${12} label=${{ value: 'Orders', angle: 90, position: 'insideRight' }} />
                    <${Tooltip} contentStyle=${{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }} />
                    <${Legend} />
                    
                    ${(chartView === 'combined' || chartView === 'revenue-only') && html`
                        <${Area} yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth=${2} fill="url(#revenueGradient)" name="Revenue" />
                    `}
                    
                    ${(chartView === 'combined' || chartView === 'orders-only') && html`
                        <${Line} yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth=${2} dot=${false} name="Orders" />
                    `}
                </${ComposedChart}>
            </${ResponsiveContainer}>
        </div>
    `;
};

const CohortHeatmap = () => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [viewMode, setViewMode] = useState('percentage');

    const getHeatmapColor = (value) => {
        if (value === null) return 'bg-gray-100';
        if (value >= 80) return 'bg-green-600 text-white';
        if (value >= 70) return 'bg-green-500 text-white';
        if (value >= 60) return 'bg-green-400 text-white';
        if (value >= 50) return 'bg-yellow-400 text-gray-900';
        if (value >= 40) return 'bg-orange-400 text-white';
        if (value >= 30) return 'bg-orange-500 text-white';
        return 'bg-red-500 text-white';
    };

    return html`
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-semibold">Cohort Retention Analysis</h3>
                    <p className="text-sm text-gray-500 mt-1">Customer retention by signup cohort</p>
                </div>
                <div className="flex gap-2">
                    <button onClick=${() => setViewMode('percentage')} className=${`px-3 py-1.5 text-sm rounded-lg ${viewMode === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Percentage</button>
                    <button onClick=${() => setViewMode('absolute')} className=${`px-3 py-1.5 text-sm rounded-lg ${viewMode === 'absolute' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Absolute</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border">Cohort</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border">Users</th>
                            ${[1, 2, 3, 4, 5, 6].map(m => html`<th key=${m} className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase border">M${m}</th>`)}
                        </tr>
                    </thead>
                    <tbody>
                        ${cohortData.map((c, idx) => html`
                            <tr key=${idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-sm border">${c.cohort}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 border">${c.users.toLocaleString()}</td>
                                ${[1, 2, 3, 4, 5, 6].map(m => {
        const val = c[`m${m}`];
        const absVal = val !== null ? Math.floor((val / 100) * c.users) : null;
        return html`
                                        <td
                                            key=${m}
                                            onClick=${() => val !== null && setSelectedCell({ cohort: c.cohort, month: m, value: val, users: c.users })}
                                            className=${`px-4 py-3 text-center text-sm font-medium border cursor-pointer transition-all hover:scale-105 ${getHeatmapColor(val)}`}
                                        >
                                            ${val !== null ? (viewMode === 'percentage' ? `${val}%` : absVal) : '-'}
                                        </td>
                                    `;
    })}
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>

            <!-- Modal -->
            ${selectedCell && html`
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Cohort Details</h4>
                            <button onClick=${() => setSelectedCell(null)}><${Icon} name="x" size=${20} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-gray-500">Cohort</span> <span className="font-semibold">${selectedCell.cohort}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Month</span> <span className="font-semibold">${selectedCell.month}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Initial Users</span> <span className="font-semibold">${selectedCell.users}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Retained</span> <span className="font-semibold">${Math.floor((selectedCell.value / 100) * selectedCell.users)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Retention Rate</span> <span className="font-bold text-blue-600 text-lg">${selectedCell.value}%</span></div>
                        </div>
                        <button onClick=${() => setSelectedCell(null)} className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Close</button>
                    </div>
                </div>
            `}
        </div>
    `;
};

const InsightsSection = () => {
    return html`
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg"><${Icon} name="lightbulb" size=${24} className="text-white" /></div>
                    <h3 className="text-lg font-semibold">Key Insights</h3>
                </div>
                <div className="space-y-4">
                     <div className="flex gap-3">
                        <div className="p-1.5 bg-green-100 rounded-full h-fit"><${Icon} name="trending-up" size=${16} className="text-green-600" /></div>
                        <div><p className="text-sm font-medium">Retention improved by 3%</p><p className="text-xs text-gray-600">Nov cohort showing strong engagement.</p></div>
                     </div>
                     <div className="flex gap-3">
                        <div className="p-1.5 bg-orange-100 rounded-full h-fit"><${Icon} name="alert-circle" size=${16} className="text-orange-600" /></div>
                        <div><p className="text-sm font-medium">Oct cohort at risk</p><p className="text-xs text-gray-600">Drop in Month 3 below benchamrk.</p></div>
                     </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-600 rounded-lg"><${Icon} name="sparkles" size=${24} className="text-white" /></div>
                    <h3 className="text-lg font-semibold">Recommendations</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-white rounded-lg p-3 border-l-4 border-red-500 text-sm">
                        <div className="flex justify-between mb-1"><span className="text-red-700 font-bold text-xs">HIGH PRIORITY</span></div>
                        <p className="font-medium">Launch re-engagement for Oct cohort</p>
                    </div>
                     <div className="bg-white rounded-lg p-3 border-l-4 border-yellow-500 text-sm">
                        <div className="flex justify-between mb-1"><span className="text-yellow-700 font-bold text-xs">MEDIUM</span></div>
                        <p className="font-medium">Test discount offers for Month 3-4 users</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const ExtraAnalytics = () => {
    return html`
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- CLV -->
            <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-6">LTV by Cohort</h3>
                <${ResponsiveContainer} width="100%" height=${300}>
                    <${BarChart} data=${cohortData}>
                        <${CartesianGrid} strokeDasharray="3 3" />
                         <${XAxis} dataKey="cohort" fontSize=${10} interval=${1} angle=${-30} textAnchor="end" height=${60} />
                        <${YAxis} />
                        <${Tooltip} />
                        <${Bar} dataKey="users" fill="#8B5CF6" name="LTV Score" radius=${[4, 4, 0, 0]}>
                           ${cohortData.map((e, i) => html`<${Cell} key=${i} fill=${`hsl(${240 + i * 10}, 70%, 50%)`} />`)}
                        </${Bar}>
                    </${BarChart}>
                </${ResponsiveContainer}>
            </div>

            <!-- Churn Donut -->
            <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-6">Churn Reasons</h3>
                <${ResponsiveContainer} width="100%" height=${300}>
                    <${PieChart}>
                        <${Pie}
                            data=${[
            { name: 'Price', value: 35, color: '#EF4444' },
            { name: 'Alternative', value: 28, color: '#F59E0B' },
            { name: 'Feat Gap', value: 22, color: '#3B82F6' },
            { name: 'Support', value: 10, color: '#8B5CF6' },
            { name: 'Other', value: 5, color: '#6B7280' }
        ]}
                            cx="50%" cy="50%" innerRadius=${60} outerRadius=${90} paddingAngle=${2}
                            dataKey="value"
                        >
                            ${[0, 1, 2, 3, 4].map((i) => html`<${Cell} key=${i} fill=${['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#6B7280'][i]} />`)}
                        </${Pie}>
                        <${Tooltip} />
                        <${Legend} />
                    </${PieChart}>
                </${ResponsiveContainer}>
            </div>
            
            <!-- Revenue Stacked -->
            <div className="bg-white rounded-xl p-6 shadow-md md:col-span-2">
                 <h3 className="text-xl font-semibold mb-6">Revenue Breakdown</h3>
                 <${ResponsiveContainer} width="100%" height=${300}>
                    <${AreaChart} data=${revenueBreakdownData}>
                        <${RC.defs}>
                            <linearGradient id="newC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity=${0.8}/><stop offset="95%" stopColor="#10B981" stopOpacity=${0.1}/></linearGradient>
                            <linearGradient id="retC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity=${0.8}/><stop offset="95%" stopColor="#3B82F6" stopOpacity=${0.1}/></linearGradient>
                            <linearGradient id="upC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity=${0.8}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity=${0.1}/></linearGradient>
                        </${RC.defs}>
                        <${CartesianGrid} strokeDasharray="3 3" />
                        <${XAxis} dataKey="month" />
                        <${YAxis} />
                        <${Tooltip} />
                        <${Legend} />
                        <${Area} type="monotone" dataKey="new" stackId="1" stroke="#10B981" fill="url(#newC)" name="New Customers" />
                        <${Area} type="monotone" dataKey="returning" stackId="1" stroke="#3B82F6" fill="url(#retC)" name="Returning" />
                        <${Area} type="monotone" dataKey="upsells" stackId="1" stroke="#8B5CF6" fill="url(#upC)" name="Upsells" />
                    </${AreaChart}>
                 </${ResponsiveContainer}>
            </div>
        </div>
    `;
};


// --- Main Analytics Application ---

const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState('90days');
    const [revOrderData, setRevOrderData] = useState([]);

    useEffect(() => {
        setRevOrderData(generateRevenueOrdersData(timeRange));
    }, [timeRange]);

    return html`
        <div className="flex flex-col h-full bg-slate-50/50">
            <!-- Filter Bar -->
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            ${['30days', '90days', '6months'].map(range => html`
                                <button
                                    key=${range}
                                    onClick=${() => setTimeRange(range)}
                                    className=${`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${timeRange === range ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    ${range.replace('d', ' D').replace('m', ' M')}
                                </button>
                            `)}
                        </div>
                        <div className="flex gap-2">
                             <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white text-sm font-medium">
                                <${Icon} name="download" size=${16} /> Export
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-lg shadow-blue-500/30">
                                <${Icon} name="bar-chart-3" size=${16} /> Compare
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Scrollable Content -->
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <${KeyMetrics} />
                    <${RevenueChart} data=${revOrderData} />
                    <${CohortHeatmap} />
                    <${InsightsSection} />
                    <${ExtraAnalytics} />
                </div>
            </div>
        </div>
    `;
};

// Mount
console.log("Mounting Analytics Dashboard...");
try {
    const root = ReactDOM.createRoot(document.getElementById('react-root'));
    root.render(html`<${AnalyticsDashboard} />`);
    console.log("Analytics Dashboard Mounted.");
} catch (e) {
    console.error("Mount Error:", e);
    document.getElementById('react-root').innerHTML = `<div class="p-10 text-red-600">Failed: ${e.message}</div>`;
}
