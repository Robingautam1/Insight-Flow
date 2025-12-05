// InsightFlow Data Manager & State Store

const DEFAULT_DATA = {
    transactions: [],
    users: [
        { id: 'u1', name: 'John Doe', email: 'john@insightflow.com', role: 'Admin', avatar: 'JD' },
        { id: 'u2', name: 'Sarah Smith', email: 'sarah@insightflow.com', role: 'Editor', avatar: 'SS' },
        { id: 'u3', name: 'Mike Johnson', email: 'mike@insightflow.com', role: 'Viewer', avatar: 'MJ' }
    ],
    workspace: {
        name: 'My Company',
        currency: 'USD',
        timezone: 'UTC'
    },
    settings: {
        theme: 'light'
    },
    lastUpdated: new Date().toISOString()
};

// Generate initial dummy data if store is empty
function generateInitialData() {
    const transactions = [];
    const statuses = ['Paid', 'Pending', 'Refunded'];
    const channels = ['Website', 'Mobile App', 'Marketplace', 'Offline'];
    const categories = ['Electronics', 'Clothing', 'Home', 'Accessories'];
    const names = ['Acme Corp', 'Global Tech', 'Stark Ind', 'Wayne Ent', 'Cyberdyne', 'Massive Dynamic', 'Hooli', 'Pied Piper'];

    // Generate 200 rows of data spanning last 12 months
    for (let i = 0; i < 200; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));

        const amount = Math.floor(Math.random() * 50000 + 1000);

        transactions.push({
            id: `ORD-${1000 + i}`,
            customer: names[Math.floor(Math.random() * names.length)],
            date: date.toISOString(), // Store as ISO string for easier parsing
            amount: amount,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            channel: channels[Math.floor(Math.random() * channels.length)],
            category: categories[Math.floor(Math.random() * categories.length)]
        });
    }

    // Sort by date descending
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

class InsightStore {
    constructor() {
        this.STORAGE_KEY = 'insight_flow_data';
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Initialize with dummy data
        const initial = {
            ...DEFAULT_DATA,
            transactions: generateInitialData()
        };
        this.saveData(initial);
        return initial;
    }

    saveData(data) {
        this.data = data;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        // Dispatch event for other tabs/components
        window.dispatchEvent(new Event('insightDataChanged'));
    }

    // --- User Management ---

    getUsers() {
        return this.data.users || DEFAULT_DATA.users;
    }

    addUser(user) {
        const newUser = { ...user, id: `u${Date.now()}`, avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) };
        this.data.users.push(newUser);
        this.saveData(this.data);
        return newUser;
    }

    removeUser(userId) {
        this.data.users = this.data.users.filter(u => u.id !== userId);
        this.saveData(this.data);
    }

    updateUser(userId, updates) {
        const index = this.data.users.findIndex(u => u.id === userId);
        if (index !== -1) {
            this.data.users[index] = { ...this.data.users[index], ...updates };
            // Update avatar if name changed
            if (updates.name) {
                this.data.users[index].avatar = updates.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            }
            this.saveData(this.data);
        }
    }

    // --- Workspace Management ---

    getWorkspace() {
        return this.data.workspace || DEFAULT_DATA.workspace;
    }

    updateWorkspace(settings) {
        this.data.workspace = { ...this.data.workspace, ...settings };
        this.saveData(this.data);
    }

    // --- Data Accessors ---

    getTransactions(filters = {}) {
        let filtered = [...this.data.transactions];

        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.customer.toLowerCase().includes(term) ||
                t.id.toLowerCase().includes(term)
            );
        }

        if (filters.dateRange) {
            const now = new Date();
            const past = new Date();
            if (filters.dateRange === '7d') past.setDate(now.getDate() - 7);
            if (filters.dateRange === '30d') past.setDate(now.getDate() - 30);
            if (filters.dateRange === '90d') past.setDate(now.getDate() - 90);
            if (filters.dateRange === '1y') past.setFullYear(now.getFullYear() - 1);

            filtered = filtered.filter(t => new Date(t.date) >= past);
        }

        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        return filtered;
    }

    getKPIs(timeRange = '30d') {
        const currentData = this.getTransactions({ dateRange: timeRange });

        // Calculate previous period for comparison
        // Simplified: just taking the same length of time before the current period
        // In a real app, this date logic would be more robust

        const totalRevenue = currentData.reduce((sum, t) => t.status !== 'Refunded' ? sum + t.amount : sum, 0);
        const activeCustomers = new Set(currentData.map(t => t.customer)).size;
        const newOrders = currentData.length;

        const refundCount = currentData.filter(t => t.status === 'Refunded').length;
        const refundRate = newOrders > 0 ? ((refundCount / newOrders) * 100).toFixed(1) : 0;

        return {
            revenue: totalRevenue,
            customers: activeCustomers,
            orders: newOrders,
            refundRate: refundRate
        };
    }

    getChartData(timeRange = '1y') {
        const data = this.getTransactions({ dateRange: timeRange });
        const months = {};
        const channels = {};
        const products = {};

        data.forEach(t => {
            if (t.status === 'Refunded') return;

            // Monthly Revenue
            const date = new Date(t.date);
            const monthKey = date.toLocaleString('default', { month: 'short' });
            months[monthKey] = (months[monthKey] || 0) + t.amount;

            // Channel Orders
            channels[t.channel] = (channels[t.channel] || 0) + 1;

            // Product Revenue
            products[t.category] = (products[t.category] || 0) + t.amount;
        });

        // Sort months chronologically (simplified for this demo)
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sortedMonths = Object.keys(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

        return {
            revenue: {
                labels: sortedMonths,
                data: sortedMonths.map(m => months[m])
            },
            channels: {
                labels: Object.keys(channels),
                data: Object.values(channels)
            },
            products: {
                labels: Object.keys(products),
                data: Object.values(products)
            }
        };
    }

    // --- Actions ---

    importCSV(csvText) {
        // Simple CSV parser
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const newTransactions = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',');
            const entry = {};

            headers.forEach((h, index) => {
                let value = values[index]?.trim();
                // Basic mapping and cleaning
                if (h.includes('amount')) value = parseFloat(value.replace(/[^0-9.-]+/g, ""));
                if (h.includes('date')) value = new Date(value).toISOString();
                entry[h] = value;
            });

            // Validate essential fields
            if (entry.date && entry.amount) {
                // Map to our internal schema if names differ
                newTransactions.push({
                    id: entry.id || entry.order_id || `IMP-${Date.now()}-${i}`,
                    customer: entry.customer || entry.name || 'Unknown',
                    date: entry.date,
                    amount: entry.amount,
                    status: entry.status || 'Paid',
                    channel: entry.channel || 'Imported',
                    category: entry.category || 'General'
                });
            }
        }

        if (newTransactions.length > 0) {
            const updatedData = {
                ...this.data,
                transactions: [...newTransactions, ...this.data.transactions]
            };
            this.saveData(updatedData);
            return { success: true, count: newTransactions.length };
        }
        return { success: false, message: "No valid data found" };
    }

    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.data = this.loadData();
        window.location.reload();
    }
}

const store = new InsightStore();
