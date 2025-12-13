// Dashboard Logic
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    PieChart, Pie, Cell, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Brush, ReferenceLine
} = Recharts;

// Lucide Icon Component
const Icon = ({ name, size = 18, className = "" }) => {
    const lucide = window.lucide || {};
    if (!lucide.icons) return null;
    const iconData = lucide.icons[name];
    if (!iconData) return null;

    const [tag, attrs, children] = iconData;

    try {
        return React.createElement(
            tag,
            {
                ...attrs,
                width: size,
                height: size,
                className: `lucide lucide-${name} ${className}`,
            },
            children.map(([childTag, childAttrs], index) =>
                React.createElement(childTag, { ...childAttrs, key: index })
            )
        );
    } catch (e) {
        console.error("Icon render error:", name, e);
        return null;
    }
};

const Icons = new Proxy({}, {
    get: (target, prop) => (props) => <Icon name={prop} {...props} />
});

// Expose widely used icons
const {
    Leaf, DollarSign, Users, ShoppingBag, AlertCircle,
    TrendingUp, TrendingDown, Download, Plus, X,
    RefreshCw, Search, Eye, Edit, Trash2, FileText,
    UserPlus, BarChart3, Clock, Target, Zap,
    Activity, Check, CheckCircle, XCircle, Info,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Calendar, Filter,
    Sparkles, Menu, Keyboard, FileX, Settings, MoreHorizontal, Bell,
    CreditCard, Smartphone, Globe, Box
} = Icons;

window.Icons = Icons;

// Valid Data Generator
const generateData = () => {
    const data = [];
    const start = new Date();
    start.setDate(start.getDate() - 30);
    for (let i = 0; i < 30; i++) {
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

const initialTransactions = [
    { id: '#ORD-9281', customer: 'Rajesh Kumar', amount: 24500, date: new Date().toISOString(), status: 'Paid', channel: 'Website', isNew: false },
    { id: '#ORD-9280', customer: 'Priya Singh', amount: 8900, date: new Date(Date.now() - 3600000).toISOString(), status: 'Pending', channel: 'Mobile App', isNew: false },
    { id: '#ORD-9279', customer: 'Amit Patel', amount: 14200, date: new Date(Date.now() - 7200000).toISOString(), status: 'Paid', channel: 'Marketplace', isNew: false },
    { id: '#ORD-9278', customer: 'Sneha Gupta', amount: 5600, date: new Date(Date.now() - 10800000).toISOString(), status: 'Paid', channel: 'Website', isNew: false },
    { id: '#ORD-9277', customer: 'Vikram Malhotra', amount: 3200, date: new Date(Date.now() - 86400000).toISOString(), status: 'Refunded', channel: 'Offline', isNew: false },
    { id: '#ORD-9276', customer: 'Anjali Desai', amount: 12100, date: new Date(Date.now() - 90000000).toISOString(), status: 'Paid', channel: 'Website', isNew: false }
];

const formatNumber = (val) => new Intl.NumberFormat('en-IN').format(val);

// Components
const MetricCard = ({ title, value, change, icon: IconName, color, delay }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(String(value).replace(/[^0-9]/g, ''));
        if (start === end) return;
        const duration = 1000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);

    const prefix = title.includes('Revenue') ? '₹' : '';
    const suffix = title.includes('Rate') ? '%' : '';
    const finalVal = title.includes('Rate') ? value : prefix + formatNumber(displayValue) + suffix;

    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600' }
    }[color] || { bg: 'bg-slate-50', text: 'text-slate-600' };

    const TrendIcon = change.includes('+') ? TrendingUp : (change === 'Stable' ? MoreHorizontal : TrendingDown);
    const trendColor = change.includes('+') ? 'text-green-600' : (change === 'Stable' ? 'text-slate-500' : 'text-red-500');

    return (
        <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fade-in`} style={{ animationDelay: `${delay}ms` }}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.text} group-hover:scale-110 transition-transform`}>
                    <IconName size={24} />
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-50 ${trendColor}`}>
                    <TrendIcon size={12} /> {change}
                </span>
            </div>
            <div>
                <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{finalVal}</h3>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div className={`h-full ${colorClasses.bg.replace('bg-', 'bg-').replace('50', '500')} w-2/3 animate-pulse`}></div>
            </div>
        </div>
    );
};

const Toast = ({ message, type, onClose }) => {
    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white mb-2 animate-slide-in ${colors[type]}`}>
            {type === 'success' && <CheckCircle size={18} />}
            {type === 'error' && <XCircle size={18} />}
            {type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
    );
};

const Dashboard = () => {
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dates, setDates] = useState('30days');
    const [transactions, setTransactions] = useState(initialTransactions);
    const [toasts, setToasts] = useState([]);
    const [chartData, setChartData] = useState(generateData());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newTx = {
                    id: `#ORD-${Math.floor(Math.random() * 9000) + 10000}`,
                    customer: 'Smart Customer',
                    amount: Math.floor(Math.random() * 10000) + 500,
                    date: new Date().toISOString(),
                    status: 'Paid',
                    channel: 'Website',
                    isNew: true
                };
                setTransactions(prev => [newTx, ...prev]);
                showToast(`New order ${newTx.id} received!`, 'success');
            }
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const showToast = (msg, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message: msg, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const refreshData = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setChartData(generateData());
            setLastUpdated(new Date());
            setIsRefreshing(false);
            showToast('Dashboard stats updated', 'info');
        }, 1200);
    };

    const channels = [
        { name: 'Website', value: 1240, color: '#3B82F6' },
        { name: 'Mobile App', value: 856, color: '#10B981' },
        { name: 'Marketplace', value: 432, color: '#F59E0B' },
        { name: 'Offline', value: 128, color: '#EF4444' }
    ];

    const handleAddSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setTransactions(prev => [{
            id: `#ORD-${Math.floor(Math.random() * 9000) + 20000}`,
            customer: fd.get('customer'),
            amount: parseFloat(fd.get('amount')),
            date: fd.get('date'),
            status: fd.get('status'),
            channel: fd.get('channel'),
            isNew: true
        }, ...prev]);
        setIsModalOpen(false);
        showToast('Transaction added successfully', 'success');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-30 sticky top-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 hidden md:block">Console</h1>
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        {['7d', '30days', '90days', 'All'].map(d => (
                            <button key={d} onClick={() => setDates(d)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${dates === d ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{d}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={refreshData} className={`p-2 text-slate-500 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100 ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
                    <div className="h-8 w-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">JD</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Total Revenue" value={1245000} change="+14%" icon={DollarSign} color="blue" delay={0} />
                    <MetricCard title="Active Customers" value={1240} change="+5%" icon={Users} color="green" delay={100} />
                    <MetricCard title="New Orders" value={356} change="+2%" icon={ShoppingBag} color="purple" delay={200} />
                    <MetricCard title="Refund Rate" value="2.4" change="Stable" icon={AlertCircle} color="orange" delay={300} />
                </div>

                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 space-y-6 min-w-0">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Performance</h3>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={30} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillUrl="url(#colorRev)" />
                                        <Line type="monotone" dataKey="previousRevenue" stroke="#94a3b8" strokeDasharray="5 5" name="Previous" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-slate-800">Transactions</h3>
                                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"><Plus size={16} /> Add</button>
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
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-slate-500">{tx.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-700">{tx.customer}</td>
                                                <td className="px-6 py-4">₹{tx.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{tx.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="xl:w-80 w-full space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <h3 className="font-bold text-slate-800 mb-4">Channel Mix</h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={channels} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                            {channels.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed top-24 right-6 pointer-events-none">
                {toasts.map(t => <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 p-6 animate-fade-in">
                        <h3 className="font-bold text-lg mb-4">Add Transaction</h3>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <input name="customer" placeholder="Customer Name" required className="w-full border p-2 rounded" />
                            <input name="amount" type="number" placeholder="Amount" required className="w-full border p-2 rounded" />
                            <input name="date" type="date" required className="w-full border p-2 rounded" />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Save</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return <div className="p-10 text-red-600"><h2>Dashboard Crash</h2><pre>{this.state.error?.toString()}</pre></div>;
        }
        return this.props.children;
    }
}

// Mount
console.log("Mounting Dashboard Script...");
const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(
    <ErrorBoundary>
        <Dashboard />
    </ErrorBoundary>
);
