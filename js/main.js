// Global Chart Instances
let revenueChart, channelChart, productChart;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dashboard if elements exist
    if (document.getElementById('revenueChart')) {
        initDashboard();
    }

    // Initialize Data Page if elements exist
    if (document.getElementById('file-upload-zone')) {
        initDataPage();
    }

    // Initialize Analytics Page
    if (document.getElementById('comparisonChart')) {
        initAnalytics();
    }

    // Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Global Event Listener for Data Changes
    window.addEventListener('insightDataChanged', () => {
        if (document.getElementById('revenueChart')) {
            updateDashboard();
        }
    });
});

// --- Dashboard Logic ---

function initDashboard() {
    // Initial Render
    initCharts();
    updateDashboard();

    // Event Listeners for Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'btn-secondary'));
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.add('btn-secondary')); // Reset style

            // Add active to clicked
            e.target.classList.add('active');
            e.target.classList.remove('btn-secondary'); // Optional: change style for active

            updateDashboard();
        });
    });

    // Search Listener
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            updateTransactionsTable(e.target.value);
        });
    }

    // Add Transaction Form
    const addTxForm = document.getElementById('add-transaction-form');
    if (addTxForm) {
        addTxForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(addTxForm);
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
            addTxForm.reset();
            alert('Transaction added successfully!');
        });
    }

    // Export Button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const transactions = store.getTransactions();
            const headers = ['Date', 'Order ID', 'Customer', 'Amount', 'Status', 'Channel'];
            const csvContent = [
                headers.join(','),
                ...transactions.map(t => [
                    new Date(t.date).toLocaleDateString(),
                    t.id,
                    `"${t.customer}"`, // Quote to handle commas
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
        });
    }
}

function updateDashboard() {
    // Get active filter
    const activeBtn = document.querySelector('.filter-btn.active');
    const timeRange = activeBtn ? activeBtn.dataset.range : '30d';

    // Update KPIs
    const kpis = store.getKPIs(timeRange);
    document.getElementById('kpi-revenue').textContent = formatCurrency(kpis.revenue);
    document.getElementById('kpi-customers').textContent = kpis.customers.toLocaleString();
    document.getElementById('kpi-orders').textContent = kpis.orders.toLocaleString();
    document.getElementById('kpi-refund').textContent = kpis.refundRate + '%';

    // Update Charts
    const chartData = store.getChartData(timeRange);

    updateChart(revenueChart, chartData.revenue.labels, chartData.revenue.data);
    updateChart(channelChart, chartData.channels.labels, chartData.channels.data);
    updateChart(productChart, chartData.products.labels, chartData.products.data);

    // Update Table (default view)
    updateTransactionsTable();
}

function updateTransactionsTable(searchTerm = '') {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    const transactions = store.getTransactions({ search: searchTerm }).slice(0, 10); // Show top 10

    tbody.innerHTML = transactions.map(tx => {
        let statusClass = 'badge-neutral';
        if (tx.status === 'Paid') statusClass = 'badge-success';
        if (tx.status === 'Pending') statusClass = 'badge-warning';
        if (tx.status === 'Refunded') statusClass = 'badge-danger';

        return `
            <tr>
                <td class="font-medium">${tx.id}</td>
                <td>${tx.customer}</td>
                <td class="text-muted">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="font-bold">${formatCurrency(tx.amount)}</td>
                <td><span class="badge ${statusClass}">${tx.status}</span></td>
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

    revenueChart = new Chart(ctxRevenue, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#e2e8f0' } },
                x: { grid: { display: false } }
            }
        }
    });

    channelChart = new Chart(ctxChannel, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Orders',
                data: [],
                backgroundColor: ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b', '#cbd5e1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } },
            cutout: '70%'
        }
    });
}

function updateChart(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

// --- Data Page Logic ---

function initDataPage() {
    const dropZone = document.getElementById('file-upload-zone');
    const fileInput = document.getElementById('file-input');

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and Drop
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

        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileUpload(e.target.files[0]);
        }
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
            // Refresh page to show new data in preview if we had one, or just redirect
            window.location.href = 'dashboard.html';
        } else {
            alert('Error importing data: ' + result.message);
        }
    };
    reader.readAsText(file);
}

// Utility
function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
}

// --- Analytics Page Logic ---

function initAnalytics() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const chartData = store.getChartData('1y'); // Get 1 year data

    // Calculate orders data (mock logic based on revenue for demo, or use real count if available)
    // In our store.getChartData, we have revenue and channels. 
    // We'll re-calculate monthly orders count here for accuracy.

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
                    backgroundColor: '#0ea5e9',
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
                    title: { display: true, text: 'Orders' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // Make saved reports clickable (Mock)
    document.querySelectorAll('.card').forEach(card => {
        if (card.querySelector('h4')) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                // Highlight effect
                card.style.borderColor = 'var(--primary)';
                setTimeout(() => card.style.borderColor = 'var(--border)', 300);
            });
        }
    });
}
