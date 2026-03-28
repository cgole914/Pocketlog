document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const transactionForm = document.getElementById('transaction-form');
    const amountInput = document.getElementById('amount-input');
    const typeExpenseBtn = document.getElementById('type-expense');
    const typeIncomeBtn = document.getElementById('type-income');
    const categoryGridContainer = document.getElementById('category-grid-container');
    const transactionItemsContainer = document.getElementById('transaction-items-container');
    const currentBalanceEl = document.getElementById('current-balance');
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpenseEl = document.getElementById('monthly-expense');
    const titleInput = document.getElementById('title-input');
    const memoInput = document.getElementById('memo-input');
    const searchInput = document.getElementById('search-input');
    const filterCategory = document.getElementById('filter-category');
    const filterMonth = document.getElementById('filter-month');
    const editIdInput = document.getElementById('edit-id');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    const navDashboard = document.getElementById('nav-dashboard');
    const navStatistics = document.getElementById('nav-statistics');
    const dashboardLeft = document.getElementById('dashboard-left');
    const statisticsView = document.getElementById('statistics-view');
    const inputPanel = document.getElementById('input-panel');
    const mobileFab = document.getElementById('mobile-fab');

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const csvFileInput = document.getElementById('csv-file-input');

    // --- State ---
    let transactions = [];
    let currentInputType = 'expense';
    let selectedCategory = '식비';
    let selectedIcon = '🍔';
    let currentListFilter = 'all';
    let initialBalance = 0;
    let expenseChart = null;

    const CATEGORIES = {
        expense: [
            { name: '식비', icon: '🍔' },
            { name: '교통', icon: '🚌' },
            { name: '쇼핑', icon: '🛍️' },
            { name: '의료', icon: '💊' },
            { name: '교육', icon: '📚' },
            { name: '문화', icon: '🎬' },
            { name: '취미', icon: '🎨' },
            { name: '기타', icon: '✨' }
        ],
        income: [
            { name: '급여', icon: '💳' },
            { name: '기타', icon: '💰' }
        ]
    };

    // --- Initialization ---
    init();

    function init() {
        loadData();
        loadTheme();
        renderCategoryGrid();
        updateFilterOptions();
        updateMonthFilterOptions();
        refreshUI();
    }

    // --- Theme Management ---
    function loadTheme() {
        const savedTheme = localStorage.getItem('pocketlog_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
        }
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('pocketlog_theme', isDark ? 'dark' : 'light');
        
        if (statisticsView.style.display === 'block') {
            renderExpenseChart();
        }
    });

    // --- Data Management ---
    function loadData() {
        const saved = localStorage.getItem('pocketlog_db');
        if (saved) {
            transactions = JSON.parse(saved);
        } else {
            transactions = [
                { id: 1, type: 'expense', amount: 8500, category: '식비', icon: '🍔', title: '맥도날드', memo: '빅맥 세트 점심', date: '2026-03-28' },
                { id: 2, type: 'expense', amount: 20000, category: '교통', icon: '🚌', title: '버스 카드 충전', memo: '주간 교통비', date: '2026-03-27' },
                { id: 3, type: 'income', amount: 50000, category: '기타', icon: '💰', title: '용돈', memo: '부모님 용돈', date: '2026-03-26' }
            ];
            saveData();
        }
    }

    function saveData() {
        localStorage.setItem('pocketlog_db', JSON.stringify(transactions));
    }

    // --- UI Update Logic ---
    function refreshUI() {
        renderTransactions();
        updateDashboard();
    }

    function renderTransactions() {
        const searchText = searchInput.value.toLowerCase();
        const catFilter = filterCategory.value;
        const monthFilter = filterMonth.value;

        const filtered = transactions.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchText) || t.memo.toLowerCase().includes(searchText);
            const matchesCategory = catFilter === 'all' || t.category === catFilter;
            const matchesType = currentListFilter === 'all' || t.type === currentListFilter;
            let matchesMonth = true;
            if (monthFilter !== 'all') {
                matchesMonth = t.date.startsWith(monthFilter);
            }
            return matchesSearch && matchesCategory && matchesType && matchesMonth;
        });

        transactionItemsContainer.innerHTML = '';
        if (filtered.length === 0) {
            transactionItemsContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:30px;">내역이 없습니다.</p>';
            return;
        }

        filtered.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            const typeClass = t.type === 'expense' ? 'expense' : 'income';
            const sign = t.type === 'expense' ? '-' : '+';
            
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-icon">${t.icon}</div>
                    <div class="item-details">
                        <div class="item-title">${t.title}</div>
                        <div class="item-memo">${t.memo}</div>
                        <div class="item-date">${t.date}</div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <div class="item-amount ${typeClass}">${sign} ₩ ${t.amount.toLocaleString()}</div>
                    <div class="item-actions">
                        <button type="button" class="btn-edit" onclick="handleEdit(${t.id})">✏️</button>
                        <button type="button" class="btn-delete" onclick="handleDelete(${t.id})">🗑️</button>
                    </div>
                </div>
            `;
            transactionItemsContainer.appendChild(item);
        });
    }

    function updateDashboard() {
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
        });
        currentBalanceEl.textContent = `₩ ${(initialBalance + totalIncome - totalExpense).toLocaleString()}`;
        monthlyIncomeEl.textContent = `₩ ${totalIncome.toLocaleString()}`;
        monthlyExpenseEl.textContent = `₩ ${totalExpense.toLocaleString()}`;
    }

    function renderCategoryGrid() {
        categoryGridContainer.innerHTML = '';
        const list = CATEGORIES[currentInputType];
        
        selectedCategory = list[0].name;
        selectedIcon = list[0].icon;

        list.forEach((cat, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `cat-btn ${index === 0 ? 'active' : ''}`;
            btn.dataset.category = cat.name;
            btn.dataset.icon = cat.icon;
            btn.innerHTML = `<span>${cat.icon}</span><span>${cat.name}</span>`;
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedCategory = cat.name;
                selectedIcon = cat.icon;
            });
            categoryGridContainer.appendChild(btn);
        });
    }

    function updateFilterOptions() {
        const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
        const uniqueCats = [...new Set(allCats.map(c => c.name))];
        filterCategory.innerHTML = '<option value="all">전체 카테고리</option>';
        uniqueCats.forEach(catName => {
            const option = document.createElement('option');
            option.value = catName;
            option.textContent = catName;
            filterCategory.appendChild(option);
        });
    }

    function updateMonthFilterOptions() {
        const months = transactions.map(t => t.date.substring(0, 7));
        const uniqueMonths = [...new Set(months)];
        uniqueMonths.sort((a, b) => b.localeCompare(a));

        const currentSelection = filterMonth.value;
        filterMonth.innerHTML = '<option value="all">전체 기간</option>';

        uniqueMonths.forEach(m => {
            const [year, month] = m.split('-');
            const option = document.createElement('option');
            option.value = m;
            option.textContent = `${year}년 ${parseInt(month)}월`;
            filterMonth.appendChild(option);
        });

        if ([...filterMonth.options].some(opt => opt.value === currentSelection)) {
            filterMonth.value = currentSelection;
        }
    }

    // --- Navigation ---
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboard');
    });

    navStatistics.addEventListener('click', (e) => {
        e.preventDefault();
        showView('statistics');
        renderExpenseChart();
    });

    function showView(view) {
        navDashboard.classList.remove('active');
        navStatistics.classList.remove('active');
        if (view === 'dashboard') {
            navDashboard.classList.add('active');
            dashboardLeft.style.display = 'block';
            statisticsView.style.display = 'none';
            inputPanel.style.display = 'block';
            mobileFab.style.display = 'flex';
        } else {
            navStatistics.classList.add('active');
            dashboardLeft.style.display = 'none';
            statisticsView.style.display = 'block';
            inputPanel.style.display = 'none';
            mobileFab.style.display = 'none';
        }
    }

    // --- Chart ---
    function renderExpenseChart() {
        const expenseData = {};
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === 'expense') {
                expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
                totalExpense += t.amount;
            }
        });

        const canvas = document.getElementById('expenseChart');
        const noDataMsg = document.getElementById('no-data-msg');

        if (totalExpense === 0) {
            canvas.style.display = 'none';
            noDataMsg.style.display = 'block';
            return;
        }

        canvas.style.display = 'block';
        noDataMsg.style.display = 'none';
        if (expenseChart) expenseChart.destroy();

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#e0e0e0' : '#333';

        expenseChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(expenseData),
                datasets: [{
                    data: Object.values(expenseData),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#00C2A8'],
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#242424' : '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ₩ ${ctx.raw.toLocaleString()} (${((ctx.raw/totalExpense)*100).toFixed(1)}%)`
                        }
                    }
                }
            }
        });
    }

    // --- Event Handlers ---
    typeExpenseBtn.addEventListener('click', () => {
        currentInputType = 'expense';
        typeExpenseBtn.classList.add('active');
        typeIncomeBtn.classList.remove('active');
        renderCategoryGrid();
    });

    typeIncomeBtn.addEventListener('click', () => {
        currentInputType = 'income';
        typeIncomeBtn.classList.add('active');
        typeExpenseBtn.classList.remove('active');
        renderCategoryGrid();
    });

    amountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = value ? Number(value).toLocaleString() : '';
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentListFilter = btn.dataset.filter;
            renderTransactions();
        });
    });

    searchInput.addEventListener('input', renderTransactions);
    filterCategory.addEventListener('change', renderTransactions);
    filterMonth.addEventListener('change', renderTransactions);

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawAmount = parseInt(amountInput.value.replace(/,/g, ''));
        if (isNaN(rawAmount) || rawAmount <= 0) {
            alert('올바른 금액을 입력해주세요.');
            return;
        }

        const editId = editIdInput.value;
        if (editId) {
            const index = transactions.findIndex(t => t.id === parseInt(editId));
            if (index !== -1) {
                transactions[index] = { ...transactions[index], type: currentInputType, amount: rawAmount, category: selectedCategory, icon: selectedIcon, title: titleInput.value || selectedCategory, memo: memoInput.value };
            }
        } else {
            transactions.unshift({ id: Date.now(), type: currentInputType, amount: rawAmount, category: selectedCategory, icon: selectedIcon, title: titleInput.value || selectedCategory, memo: memoInput.value, date: new Date().toISOString().split('T')[0] });
        }

        saveData();
        updateMonthFilterOptions();
        resetForm();
        refreshUI();
    });

    cancelEditBtn.addEventListener('click', resetForm);

    function resetForm() {
        transactionForm.reset();
        editIdInput.value = '';
        formTitle.textContent = '빠른 내역 추가';
        submitBtn.textContent = '저장하기';
        cancelEditBtn.style.display = 'none';
        renderCategoryGrid();
    }

    window.handleDelete = function(id) {
        if (confirm('삭제하시겠습니까?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateMonthFilterOptions();
            refreshUI();
        }
    };

    window.handleEdit = function(id) {
        const t = transactions.find(t => t.id === id);
        if (!t) return;
        editIdInput.value = t.id;
        formTitle.textContent = '내역 수정하기';
        submitBtn.textContent = '수정 완료';
        cancelEditBtn.style.display = 'block';
        amountInput.value = t.amount.toLocaleString();
        titleInput.value = t.title;
        memoInput.value = t.memo;
        currentInputType = t.type;
        if (currentInputType === 'expense') {
            typeExpenseBtn.classList.add('active');
            typeIncomeBtn.classList.remove('active');
        } else {
            typeIncomeBtn.classList.add('active');
            typeExpenseBtn.classList.remove('active');
        }
        renderCategoryGrid();
        setTimeout(() => {
            document.querySelectorAll('.cat-btn').forEach(btn => {
                if (btn.dataset.category === t.category) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            selectedCategory = t.category;
            selectedIcon = t.icon;
        }, 0);
        
        if (window.innerWidth <= 768) {
            inputPanel.classList.add('show-mobile');
            updateFabAppearance();
        } else {
            document.getElementById('input-panel').scrollIntoView({ behavior: 'smooth' });
        }
    };

    mobileFab.addEventListener('click', () => {
        inputPanel.classList.toggle('show-mobile');
        updateFabAppearance();
    });

    // --- CSV Export / Import ---
    btnExport.addEventListener('click', () => {
        if (transactions.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        const headers = ['id', 'type', 'amount', 'category', 'icon', 'title', 'memo', 'date'];
        const csvRows = [headers.join(',')];
        transactions.forEach(t => {
            const row = headers.map(header => {
                let val = t[header] === undefined ? '' : t[header];
                if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
                return val;
            });
            csvRows.push(row.join(','));
        });
        const csvString = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        link.href = url;
        link.setAttribute('download', `pocketlog_backup_${dateStr}.csv`);
        link.click();
    });

    btnImport.addEventListener('click', () => {
        csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target.result;
                const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error('데이터가 부족합니다.');
                const headers = lines[0].split(',').map(h => h.trim().replace(/^\ufeff/, ''));
                const importedData = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const obj = {};
                    headers.forEach((header, index) => {
                        let val = values[index] ? values[index].trim() : '';
                        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                        if (header === 'id' || header === 'amount') obj[header] = parseInt(val);
                        else obj[header] = val;
                    });
                    if (obj.id && obj.type && obj.amount !== undefined) importedData.push(obj);
                }
                if (importedData.length === 0) throw new Error('유효한 데이터가 없습니다.');
                if (confirm(`${importedData.length}개의 내역을 불러오시겠습니까? 기존 데이터는 삭제됩니다.`)) {
                    transactions = importedData;
                    saveData();
                    updateMonthFilterOptions();
                    refreshUI();
                    alert('데이터를 성공적으로 불러왔습니다.');
                }
            } catch (err) {
                alert('CSV 파일을 읽는 중 오류가 발생했습니다.');
            }
            csvFileInput.value = '';
        };
        reader.readAsText(file);
    });

    function updateFabAppearance() {
        if (inputPanel.classList.contains('show-mobile')) {
            mobileFab.textContent = '×';
            mobileFab.classList.add('open');
        } else {
            mobileFab.textContent = '+';
            mobileFab.classList.remove('open');
        }
    }
});
