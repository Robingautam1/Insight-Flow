// Global Chart Instances
let revenueChart, channelChart, productChart;

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Init ---
    initTheme();
    initMobileSidebar();
    initLandingMenu();

    // --- Page Specific Init ---
    if (document.getElementById('revenueChart')) {
        initDashboard();
    }

    if (document.getElementById('file-upload-zone')) {
        initDataPage();
    }

    if (document.getElementById('comparisonChart')) {
        initAnalytics();
    }

    // Accordions (FAQ)
    if (document.querySelectorAll('.accordion-item').length) {
        initAccordions();
    }

    // Global Event Listener for Data Changes
    window.addEventListener('insightDataChanged', () => {
        if (document.getElementById('revenueChart')) {
            updateDashboard();
        }
    });
});

function initLandingMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            // Change icon if needed, or simple toggle
        });
    }
}

// --- Theme Management ---
// --- Theme Management ---
function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const saved = localStorage.getItem('insightflow-theme');

    // Apply saved theme or default
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    // Set initial icon if toggle exists
    if (toggle) {
        toggle.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', current);
            localStorage.setItem('insightflow-theme', current);
            toggle.textContent = current === 'dark' ? '☀️' : '🌙';

            // Helper for existing body.dark styles if any remain
            if (current === 'dark') document.body.classList.add('dark');
            else document.body.classList.remove('dark');

            // Update charts
            if (typeof revenueChart !== 'undefined' && revenueChart) updateChartColors();
        });
    }
}
}

function initMobileSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.createElement('div');

    // Create overlay for mobile
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 30; display: none;
        backdrop-filter: blur(2px);
    `;
    document.body.appendChild(overlay);

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.style.display = 'none';
        });
    }
}

// --- Dashboard Logic ---
function initDashboard() {
    // Simulate loading state
    const charts = ['revenueChart', 'channelChart', 'productChart'];
    charts.forEach(id => {
        const ctx = document.getElementById(id).getContext('2d');
        // Placeholder or skeleton could go here
    });

    setTimeout(() => {
        initCharts();
        updateDashboard();

        // Animate Cards
        document.querySelectorAll('.kpi-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 100); // Slight delay for effect

    // Filter Logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'btn-secondary'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.add('btn-secondary'));

            e.target.classList.add('active');
            e.target.classList.remove('btn-secondary');

            updateDashboard();
        });
    });

    // Search & Forms
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => updateTransactionsTable(e.target.value));
    }

    const addTxForm = document.getElementById('add-transaction-form');
    if (addTxForm) {
        addTxForm.addEventListener('submit', handleAddTransaction);
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
}

function handleAddTransaction(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTx = {
        id: `MAN-${Date.now()}`,
        customer: formData.get('customer'),
        amount: parseFloat(formData.get('amount')),
        date: new Date(formData.get('date')).toISOString(),
        status: formData.get('status'),
        channel: formData.get('channel'),
        category: 'Manual'
    };

    const currentData = store.loadData();
    currentData.transactions.unshift(newTx);
    store.saveData(currentData);

    document.getElementById('add-transaction-modal').style.display = 'none';
    e.target.reset();
    updateDashboard();
    alert('Transaction added successfully!');
}

function handleExport() {
    const transactions = store.getTransactions();
    const headers = ['Date', 'Order ID', 'Customer', 'Amount', 'Status', 'Channel'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.id,
            `"${t.customer}"`,
            t.amount,
            t.status,
            t.channel
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `insight_flow_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function updateDashboard() {
    // 1. Get Active Range
    const activeBtn = document.querySelector('.filter-btn.active');
    const timeRange = activeBtn ? activeBtn.dataset.range : '30d';

    // 2. Define Demo Data
    const demoDataSets = {
        '7d': {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            current: [15000, 21000, 18000, 24000, 28000, 32000, 29000],
            previous: [12000, 15000, 14000, 19000, 23000, 25000, 22000]
        },
        '30d': {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            current: [85000, 92000, 115000, 108000, 124000],
            previous: [70000, 80000, 95000, 90000, 100000]
        },
        '90d': {
            labels: ['Month 1', 'Month 2', 'Month 3'],
            current: [320000, 410000, 450000],
            previous: [280000, 310000, 380000]
        },
        '1y': {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            current: [800000, 850000, 920000, 1100000, 1050000, 1150000, 1200000, 1250000, 1340000, 1400000, 1550000, 1600000],
            previous: [700000, 750000, 800000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000]
        }
    };

    const selectedData = demoDataSets[timeRange] || demoDataSets['30d'];

    // 3. Update Revenue Chart (Priority)
    if (typeof revenueChart !== 'undefined' && revenueChart) {
        revenueChart.data.labels = selectedData.labels;
        revenueChart.data.datasets[0].data = selectedData.current;
        revenueChart.data.datasets[1].data = selectedData.previous;
        revenueChart.update();

        // Update Revenue KPI to match chart (Directly)
        const totalRevenue = selectedData.current.reduce((a, b) => a + b, 0);
        animateValue('kpi-revenue', totalRevenue, true);
    }

    // 4. Update other KPIs from Store (safely)
    try {
        const kpis = store.getKPIs(timeRange);
        animateValue('kpi-customers', kpis.customers);
        animateValue('kpi-orders', kpis.orders);
        document.getElementById('kpi-refund').textContent = kpis.refundRate + '%';
    } catch (e) {
        console.error("Store KPI error", e);
    }

    // 5. Update Table
    updateTransactionsTable();
}

function animateValue(id, end, isCurrency = false) {
    const obj = document.getElementById(id);
    if (!obj) return;

    // Simple direct update for now, can add tweening later if needed
    obj.textContent = isCurrency ? formatCurrency(end) : end.toLocaleString();
}

function updateTransactionsTable(searchTerm = '') {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    // Hardcoded Demo Data as requested
    const sampleTx = [
        { id: 'ORD-1001', name: 'Asha Patel', date: '2025-12-05', amount: '2499', status: 'Paid', channel: 'Website' },
        { id: 'ORD-1002', name: 'Rohit Singh', date: '2025-12-04', amount: '999', status: 'Pending', channel: 'Mobile App' },
        { id: 'ORD-1003', name: 'Pooja Sharma', date: '2025-12-03', amount: '4199', status: 'Refunded', channel: 'Marketplace' },
        { id: 'ORD-1004', name: 'Suresh Kumar', date: '2025-12-02', amount: '1299', status: 'Paid', channel: 'Offline' },
        { id: 'ORD-1005', name: 'Neha Jain', date: '2025-12-01', amount: '3499', status: 'Paid', channel: 'Website' }
    ];

    // Simple Filter
    let transactions = sampleTx;
    if (searchTerm) {
        transactions = sampleTx.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    tbody.innerHTML = transactions.map(tx => {
        let statusClass = 'status badge-neutral'; // Default
        if (tx.status === 'Paid') statusClass = 'status paid';
        if (tx.status === 'Pending') statusClass = 'status pending';
        if (tx.status === 'Refunded') statusClass = 'status refunded';

        return `
            <tr class="animate-fade-in">
                <td class="font-medium">${tx.id}</td>
                <td>${tx.name}</td>
                <td class="text-muted">${tx.date}</td>
                <td class="font-bold">₹${parseInt(tx.amount).toLocaleString()}</td>
                <td><span class="${statusClass}">${tx.status}</span></td>
                <td>${tx.channel}</td> <!-- Check if channel col exists in HTML, usually it does not or it is last -->
            </tr>
        `;
    }).join('');
}

function initCharts() {
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
    const ctxChannel = document.getElementById('channelChart').getContext('2d');
    const ctxProduct = document.getElementById('productChart').getContext('2d');

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    // Gradient for Revenue
    const gradientRevenue = ctxRevenue.createLinearGradient(0, 0, 0, 400);
    // Dynamic Gradient from Indigo to faint purple
    gradientRevenue.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
    gradientRevenue.addColorStop(1, 'rgba(124, 58, 237, 0.05)');

    const demoChannels = {
        Website: 55,
        'Mobile App': 25,
        Marketplace: 12,
        Offline: 8
    };

    revenueChart = new Chart(ctxRevenue, {
        type: 'line',
        data: {
            // Initial Empty Data - will be filled by updateDashboard immediately
            labels: [],
            datasets: [
                {
                    label: 'Current Period',
                    data: [],
                    borderColor: '#4f46e5', // Indigo 600
                    backgroundColor: gradientRevenue,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#4f46e5',
                    pointBorderWidth: 2
                },
                {
                    label: 'Previous Period',
                    data: [],
                    borderColor: '#94a3b8', // Slate 400
                    borderDash: [5, 5],
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 0, // Hide points for clean comparison
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart' // Smooth imaginative entry
            },
            plugins: {
                legend: {
                    display: true, // Show legend now that we have two
                    align: 'end',
                    labels: { boxWidth: 10, usePointStyle: true }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ₹' + context.formattedValue;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [4, 4], color: 'rgba(226, 232, 240, 0.6)' },
                    ticks: { callback: (val) => '₹' + val / 1000 + 'k' }
                },
                x: { grid: { display: false } }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });

    // ... (channelChart remains mostly same, just slight touch up if needed)
    channelChart = new Chart(ctxChannel, {
        type: 'bar',
        data: {
            labels: Object.keys(demoChannels),
            datasets: [{
                label: 'Orders',
                data: Object.values(demoChannels),
                backgroundColor: [
                    'rgba(79, 70, 229, 0.85)',
                    'rgba(14, 165, 233, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(245, 158, 11, 0.85)'
                ],
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, delay: 500 },
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' } },
                x: { grid: { display: false } }
            }
        }
    });

    productChart = new Chart(ctxProduct, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#cbd5e1'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 20 } }
            },
            cutout: '75%'
        }
    });
}

function updateChartColors() {
    // Logic to update chart colors based on theme could go here
    // For now, the charts use specific colors that work on both, 
    // but we could swap grid colors.
    const isDark = document.body.classList.contains('dark');
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    [revenueChart, channelChart].forEach(chart => {
        if (chart) {
            chart.options.scales.y.grid.color = gridColor;
            chart.update();
        }
    });
}

function updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// --- Accordion Logic ---
function initAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');

            // Close all others
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.accordion-content').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const content = item.querySelector('.accordion-content');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}

// --- Data Page Logic ---
function initDataPage() {
    const dropZone = document.getElementById('file-upload-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
        dropZone.style.backgroundColor = 'var(--primary-light)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.backgroundColor = 'var(--bg-body)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        dropZone.style.backgroundColor = 'var(--bg-body)';
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFileUpload(e.target.files[0]);
    });
}

function handleFileUpload(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = store.importCSV(e.target.result);
        if (result.success) {
            alert(`Successfully imported ${result.count} records!`);
            window.location.href = 'dashboard.html';
        } else {
            alert('Error importing data: ' + result.message);
        }
    };
    reader.readAsText(file);
}

// --- Analytics Page Logic ---
function initAnalytics() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    // ... (Analytics chart logic similar to before but with new colors)
    // For brevity, using a simplified version or the previous one adapted

    // Re-using the logic from previous version but ensuring it runs
    const transactions = store.getTransactions({ dateRange: '1y' });
    const months = {};
    const orders = {};

    transactions.forEach(t => {
        if (t.status === 'Refunded') return;
        const date = new Date(t.date);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        months[monthKey] = (months[monthKey] || 0) + t.amount;
        orders[monthKey] = (orders[monthKey] || 0) + 1;
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedMonths = Object.keys(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Revenue',
                    data: sortedMonths.map(m => months[m]),
                    backgroundColor: '#4f46e5',
                    yAxisID: 'y',
                    order: 2,
                    borderRadius: 4
                },
                {
                    label: 'Orders',
                    data: sortedMonths.map(m => orders[m]),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    type: 'line',
                    borderWidth: 2,
                    pointRadius: 3,
                    yAxisID: 'y1',
                    order: 1,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: { borderDash: [4, 4], color: '#e2e8f0' },
                    ticks: { callback: (value) => '₹' + value.toLocaleString() }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { display: false },
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// Utility
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
}
