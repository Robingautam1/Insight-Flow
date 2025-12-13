// InsightFlow Dashboard - Vanilla JS Implementation using HTM
// This avoids in-browser Babel compilation issues

const { useState, useEffect, useRef, useMemo } = React;
const html = htm.bind(React.createElement);

// Safe Recharts Destructuring
const RC = window.Recharts || {};
const {
    AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine
} = RC;

// --- Icon Component ---
const Icon = ({ name, size = 18, className = "" }) => {
    const lucide = window.lucide || {};
    if (!lucide.icons) return null;
    const iconData = lucide.icons[name];
    if (!iconData) return null;

    const [tag, attrs, children] = iconData;

    // Helper to recursively create children
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

// --- Data Generation ---
// --- Data Generation ---
const generateData = (days = 30) => {
    const data = [];
    const count = days === 'All' ? 90 : (parseInt(days) || 30);
    const start = new Date();
    start.setDate(start.getDate() - count);

    for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        data.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: Math.floor(Math.random() * (60000 - 35000) + 35000),
            previousRevenue: Math.floor(Math.random() * (55000 - 30000) + 30000),
            orders: Math.floor(Math.random() * (120 - 50) + 50)
        });
    }
    return data;
};

// ... initialTransactions ... (keep as is)

const Dashboard = () => {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [dates, setDates] = useState('30days');
    const [chartData, setChartData] = useState(generateData(30));
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Update data when date range changes
    useEffect(() => {
        setChartData(generateData(dates));
    }, [dates]);

    const refreshData = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setChartData(generateData(dates));
            setIsRefreshing(false);
        }, 1000);
    };

    const channels = [
        { name: 'Website', value: 1240, color: '#3B82F6' },
        { name: 'Mobile App', value: 856, color: '#10B981' },
        { name: 'Marketplace', value: 432, color: '#F59E0B' },
        { name: 'Offline', value: 128, color: '#EF4444' }
    ];

    if (!RC.AreaChart) {
        return html`<div class="p-10 text-red-500 font-bold">Recharts library failed to load. Please check internet connection.</div>`;
    }

    return html`
        <div className="flex flex-col h-full">
            <!-- Header -->
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-30 sticky top-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 hidden md:block">Console</h1>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        ${['7d', '30days', '90days', 'All'].map(d => html`
                            <button onClick=${() => setDates(d)} className="px-3 py-1 text-xs font-semibold rounded-md transition-all ${dates === d ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                                ${d}
                            </button>
                        `)}
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                     <button onClick=${refreshData} className="p-2 text-slate-500 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100 ${isRefreshing ? 'animate-spin' : ''}">
                        <${Icon} name="refresh-cw" size=${18} />
                     </button>
                    <div className="h-8 w-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">JD</div>
                </div>
            </div>

            <!-- Content -->
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                <!-- Metrics -->
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <${MetricCard} title="Total Revenue" value=${1245000} change="+14%" iconName="dollar-sign" color="blue" delay=${0} />
                    <${MetricCard} title="Active Customers" value=${1240} change="+5%" iconName="users" color="green" delay=${100} />
                    <${MetricCard} title="New Orders" value=${356} change="+2%" iconName="shopping-bag" color="purple" delay=${200} />
                    <${MetricCard} title="Refund Rate" value="2.4%" change="Stable" iconName="alert-circle" color="orange" delay=${300} />
                </div>

                <!-- Charts Area -->
                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 space-y-6 min-w-0">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Performance</h3>
                            <div className="h-[320px] w-full">
                                <${ResponsiveContainer} width="100%" height="100%">
                                    <${ComposedChart} data=${chartData}>
                                        <${CartesianGrid} strokeDasharray="3 3" vertical=${false} stroke="#f1f5f9" />
                                        <${XAxis} dataKey="date" axisLine=${false} tickLine=${false} tick=${{ fill: '#94a3b8', fontSize: 11 }} minTickGap=${30} />
                                        <${YAxis} axisLine=${false} tickLine=${false} tick=${{ fill: '#94a3b8', fontSize: 11 }} tickFormatter=${v => '₹' + (v / 1000) + 'k'} />
                                        <${Tooltip} contentStyle=${{ borderRadius: '12px', border: 'none' }} />
                                        <${Area} type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth=${3} fill="#3B82F6" fillOpacity=${0.1} />
                                        <${Line} type="monotone" dataKey="previousRevenue" stroke="#94a3b8" strokeDasharray="5 5" name="Previous" />
                                    </${ComposedChart}>
                                </${ResponsiveContainer}>
                            </div>
                        </div>

                         <!-- Transactions -->
                         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                                        <tr>
                                            <th className="px-6 py-4">ID</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        ${transactions.map(tx => html`
                                            <tr key=${tx.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-slate-500">${tx.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-700">${tx.customer}</td>
                                                <td className="px-6 py-4">₹${tx.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                                                        ${tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        `)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar Widgets -->
                    <div className="xl:w-80 w-full space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <h3 className="font-bold text-slate-800 mb-4">Channel Mix</h3>
                            <div className="h-[200px]">
                                <${ResponsiveContainer} width="100%" height="100%">
                                    <${PieChart}>
                                        <${Pie} data=${channels} innerRadius=${50} outerRadius=${70} paddingAngle=${5} dataKey="value">
                                            ${channels.map((entry, index) => html`<${Cell} key="cell-${index}" fill=${entry.color} />`)}
                                        </${Pie}>
                                        <${Tooltip} />
                                    </${PieChart}>
                                </${ResponsiveContainer}>
                            </div>
                            <div className="space-y-3 mt-2">
                                ${channels.map(c => html`
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full" style=${{ backgroundColor: c.color }}></span>
                                            <span className="text-slate-600">${c.name}</span>
                                        </div>
                                        <span className="font-semibold text-slate-900">${c.value}</span>
                                    </div>
                                `)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Mount
console.log("Mounting HTM Dashboard...");
try {
    const root = ReactDOM.createRoot(document.getElementById('react-root'));
    root.render(html`<${Dashboard} />`);
    console.log("HTM Dashboard Mounted Successfully.");
} catch (e) {
    console.error("Mount Error:", e);
    document.getElementById('react-root').innerHTML = `<div class="p-10 text-red-600 font-bold">Failed: ${e.message}</div>`;
}
