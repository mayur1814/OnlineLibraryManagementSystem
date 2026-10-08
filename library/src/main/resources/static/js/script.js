/* ====================================================================
   ONLINE LIBRARY MANAGEMENT SYSTEM - FRONTEND SCRIPT
   REST API Client, Form Validation, Modal Controls, Toast Alerts, Dashboards
   ==================================================================== */

const API_BASE = ''; // Same-origin REST API calls

// -------------------------------------------------------------
// Toast Notification Engine
// -------------------------------------------------------------
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span style="font-size:1.1rem;font-weight:bold;">${iconMap[type] || 'ℹ'}</span>
        <span style="flex:1;">${escapeHtml(message)}</span>
        <span style="cursor:pointer;opacity:0.8;font-weight:bold;" onclick="this.parentElement.remove()">✕</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transition = 'opacity 0.4s, transform 0.4s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4000);
}

// -------------------------------------------------------------
// Modal Dialog Controls
// -------------------------------------------------------------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }
}

// -------------------------------------------------------------
// Utility Functions
// -------------------------------------------------------------
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    if (response.status === 204) return null;

    let payload;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        payload = await response.json();
    } else {
        const text = await response.text();
        try {
            payload = JSON.parse(text);
        } catch {
            payload = text;
        }
    }

    if (!response.ok) {
        const message = (typeof payload === 'object' && payload !== null && payload.message)
            ? payload.message
            : (typeof payload === 'string' && payload.length > 0 ? payload : `Request failed with status ${response.status}`);
        throw new Error(message);
    }

    return payload;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('library_user'));
    } catch {
        localStorage.removeItem('library_user');
        return null;
    }
}

function requireUser(expectedRole = null) {
    const user = getCurrentUser();
    if (!user) {
        window.location.replace('login.html');
        return null;
    }
    if (expectedRole && user.role !== expectedRole) {
        showToast(`Unauthorized. Redirecting...`, 'error');
        window.location.replace(user.role === 'ADMIN' ? 'admin-dashboard.html' : 'student-dashboard.html');
        return null;
    }
    return user;
}

async function logout() {
    try {
        await apiRequest('/logout', { method: 'POST' });
    } catch (e) {
        console.warn('Backend logout warning:', e);
    } finally {
        localStorage.removeItem('library_user');
        showToast('Logged out successfully.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

// -------------------------------------------------------------
// Authentication Forms
// -------------------------------------------------------------
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!name || !email || !mobile || !password) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
        showToast('Passwords do not match.', 'warning');
        return;
    }

    try {
        const res = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, mobile, password, role: 'STUDENT' })
        });
        showToast(res.message || 'Registration successful! Please log in.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
    }

    try {
        const user = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('library_user', JSON.stringify(user));
        showToast(`Welcome, ${user.name}!`, 'success');

        setTimeout(() => {
            if (user.role === 'ADMIN') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }
        }, 800);
    } catch (err) {
        showToast(err.message || 'Login failed. Please check credentials.', 'error');
    }
}

function fillDemo(type) {
    if (type === 'student') {
        document.getElementById('email').value = 'student@library.com';
        document.getElementById('password').value = 'student123';
    } else if (type === 'admin') {
        document.getElementById('email').value = 'admin@library.com';
        document.getElementById('password').value = 'admin123';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

// -------------------------------------------------------------
// Public Catalog (index.html)
// -------------------------------------------------------------
let allPublicBooks = [];
async function loadPublicCatalog() {
    try {
        allPublicBooks = await apiRequest('/books');
        renderPublicCatalog(allPublicBooks);

        // Fetch stats if available
        const stats = await apiRequest('/stats');
        if (stats) {
            const bElem = document.getElementById('statTotalBooks');
            if (bElem) bElem.textContent = stats.totalBooks;
            const cElem = document.getElementById('statTotalCopies');
            if (cElem) cElem.textContent = stats.totalPhysicalCopies;
            const sElem = document.getElementById('statTotalStudents');
            if (sElem) sElem.textContent = stats.totalStudents;
        }
    } catch (err) {
        console.error('Public catalog load error:', err);
    }
}

function filterPublicCatalog() {
    const term = (document.getElementById('catalogSearch')?.value || '').toLowerCase().trim();
    const category = document.getElementById('catalogCategory')?.value || '';

    const filtered = allPublicBooks.filter(b => {
        const matchesTerm = !term ||
            b.title.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            b.category.toLowerCase().includes(term);
        const matchesCat = !category || b.category === category;
        return matchesTerm && matchesCat;
    });

    renderPublicCatalog(filtered);
}

function renderPublicCatalog(books) {
    const tbody = document.getElementById('publicBooksTbody');
    if (!tbody) return;

    if (!books || books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No matching books found.</td></tr>`;
        return;
    }

    tbody.innerHTML = books.map(b => `
        <tr>
            <td><strong>#${b.id}</strong></td>
            <td><strong>${escapeHtml(b.title)}</strong></td>
            <td>${escapeHtml(b.author)}</td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td>${b.quantity} copies</td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// Student Dashboard (student-dashboard.html)
// -------------------------------------------------------------
let studentBooksCache = [];
async function initStudentDashboard() {
    const user = requireUser('STUDENT');
    if (!user) return;

    // Display user profile info
    const nameElem = document.getElementById('studentName');
    if (nameElem) nameElem.textContent = user.name;
    const emailElem = document.getElementById('studentEmail');
    if (emailElem) emailElem.textContent = user.email;

    await Promise.all([
        loadStudentBooks(),
        loadStudentIssuedRecords(),
        loadDashboardStats()
    ]);
}

async function loadStudentBooks() {
    const tbody = document.getElementById('studentBookTableBody');
    if (!tbody) return;

    try {
        studentBooksCache = await apiRequest('/books');
        populateCategoryFilter('categoryFilter', studentBooksCache);
        filterStudentBooks();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load books: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterStudentBooks() {
    const tbody = document.getElementById('studentBookTableBody');
    if (!tbody) return;

    const term = (document.getElementById('studentSearch')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('categoryFilter')?.value || '';
    const availOnly = document.getElementById('availFilter')?.checked || false;

    const filtered = studentBooksCache.filter(b => {
        const matchesTerm = !term ||
            b.title.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            b.category.toLowerCase().includes(term);
        const matchesCat = !cat || b.category === cat;
        const matchesAvail = !availOnly || b.quantity > 0;
        return matchesTerm && matchesCat && matchesAvail;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No books match your criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td><strong>#${b.id}</strong></td>
            <td><strong style="color:var(--text-primary);">${escapeHtml(b.title)}</strong></td>
            <td>${escapeHtml(b.author)}</td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td>${b.quantity}</td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                ${b.quantity > 0
                    ? `<button class="btn btn-primary btn-sm" onclick="issueBook(${b.id}, '${escapeHtml(b.title).replace(/'/g, "\\'")}')">Issue Book</button>`
                    : `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;cursor:not-allowed;">Out of Stock</button>`}
            </td>
        </tr>
    `).join('');
}

async function issueBook(bookId, bookTitle) {
    const user = requireUser('STUDENT');
    if (!user) return;

    if (!confirm(`Are you sure you want to issue "${bookTitle}"?`)) {
        return;
    }

    try {
        await apiRequest('/issue', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, bookId: bookId })
        });
        showToast(`Successfully issued "${bookTitle}"!`, 'success');
        await Promise.all([
            loadStudentBooks(),
            loadStudentIssuedRecords(),
            loadDashboardStats()
        ]);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadStudentIssuedRecords() {
    const tbody = document.getElementById('studentIssuedTableBody');
    if (!tbody) return;

    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        const records = await apiRequest(`/issue/user/${user.id}`);
        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">You currently have no issued books.</td></tr>`;
            return;
        }

        // Count active issues for student badge
        const activeCount = records.filter(r => r.status === 'ISSUED').length;
        const myActiveElem = document.getElementById('myActiveIssuesCount');
        if (myActiveElem) myActiveElem.textContent = activeCount;

        tbody.innerHTML = records.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td><strong>${escapeHtml(r.bookTitle)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(r.bookAuthor)}</small></td>
                <td><span class="badge badge-category">${escapeHtml(r.bookCategory)}</span></td>
                <td>${r.issueDate}</td>
                <td>
                    <span class="badge ${r.status === 'ISSUED' ? 'badge-issued' : 'badge-returned'}">
                        ${r.status}
                    </span>
                    ${r.returnDate ? `<br><small style="color:var(--text-muted);">Returned: ${r.returnDate}</small>` : ''}
                </td>
                <td>
                    ${r.status === 'ISSUED'
                        ? `<button class="btn btn-success btn-sm" onclick="returnBook(${r.id}, '${escapeHtml(r.bookTitle).replace(/'/g, "\\'")}')">Return Book</button>`
                        : `<span style="color:#059669;font-weight:600;font-size:0.85rem;">✓ Completed</span>`}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load records: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function returnBook(issueId, bookTitle) {
    if (!confirm(`Are you sure you want to return "${bookTitle}"?`)) {
        return;
    }

    try {
        await apiRequest('/return', {
            method: 'POST',
            body: JSON.stringify({ id: issueId })
        });
        showToast(`"${bookTitle}" returned successfully!`, 'success');
        await Promise.all([
            loadStudentBooks(),
            loadStudentIssuedRecords(),
            loadDashboardStats()
        ]);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadDashboardStats() {
    try {
        const stats = await apiRequest('/stats');
        if (stats) {
            const totalElem = document.getElementById('statTotalBooks');
            if (totalElem) totalElem.textContent = stats.totalBooks;
            const availElem = document.getElementById('statAvailBooks');
            if (availElem) availElem.textContent = stats.availableBooks;
        }
    } catch (e) {
        console.warn('Stats fetch warning:', e);
    }
}

// -------------------------------------------------------------
// Admin Dashboard (admin-dashboard.html)
// -------------------------------------------------------------
let adminBooksCache = [];
let adminStudentsCache = [];
let adminTransactionsCache = [];

async function initAdminDashboard() {
    const admin = requireUser('ADMIN');
    if (!admin) return;

    const nameElem = document.getElementById('adminName');
    if (nameElem) nameElem.textContent = admin.name;

    await refreshAdminAll();
}

async function refreshAdminAll() {
    await Promise.all([
        loadAdminStats(),
        loadAdminBooks(),
        loadAdminStudents(),
        loadAdminTransactions()
    ]);
}

async function loadAdminStats() {
    try {
        const stats = await apiRequest('/stats');
        if (stats) {
            document.getElementById('statAdminBooks').textContent = stats.totalBooks;
            document.getElementById('statAdminCopies').textContent = stats.totalPhysicalCopies;
            document.getElementById('statAdminIssued').textContent = stats.issuedBooksCount;
            document.getElementById('statAdminStudents').textContent = stats.totalStudents;
        }
    } catch (err) {
        console.warn('Admin stats error:', err);
    }
}

async function loadAdminBooks() {
    const tbody = document.getElementById('adminBookTableBody');
    if (!tbody) return;

    try {
        adminBooksCache = await apiRequest('/books');
        populateCategoryFilter('adminCategoryFilter', adminBooksCache);
        filterAdminBooks();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load books: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterAdminBooks() {
    const tbody = document.getElementById('adminBookTableBody');
    if (!tbody) return;

    const term = (document.getElementById('adminBookSearch')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('adminCategoryFilter')?.value || '';

    const filtered = adminBooksCache.filter(b => {
        const matchesTerm = !term ||
            b.title.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            b.category.toLowerCase().includes(term);
        const matchesCat = !cat || b.category === cat;
        return matchesTerm && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No books match criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td><strong>#${b.id}</strong></td>
            <td><strong>${escapeHtml(b.title)}</strong></td>
            <td>${escapeHtml(b.author)}</td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td><strong>${b.quantity}</strong></td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:0.4rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${b.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id}, '${escapeHtml(b.title).replace(/'/g, "\\'")}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleAddBook(event) {
    event.preventDefault();
    const title = document.getElementById('addTitle').value.trim();
    const author = document.getElementById('addAuthor').value.trim();
    const category = document.getElementById('addCategory').value.trim();
    const quantity = parseInt(document.getElementById('addQuantity').value, 10);

    if (!title || !author || !category || isNaN(quantity)) {
        showToast('Please fill out all fields.', 'warning');
        return;
    }

    try {
        await apiRequest('/books', {
            method: 'POST',
            body: JSON.stringify({ title, author, category, quantity })
        });
        showToast('Book added successfully!', 'success');
        document.getElementById('addBookForm').reset();
        closeModal('addBookModal');
        await refreshAdminAll();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openEditModal(bookId) {
    const book = adminBooksCache.find(b => b.id === bookId);
    if (!book) return;

    document.getElementById('editBookId').value = book.id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editCategory').value = book.category;
    document.getElementById('editQuantity').value = book.quantity;

    openModal('editBookModal');
}

async function handleUpdateBook(event) {
    event.preventDefault();
    const id = document.getElementById('editBookId').value;
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const category = document.getElementById('editCategory').value.trim();
    const quantity = parseInt(document.getElementById('editQuantity').value, 10);

    try {
        await apiRequest(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, author, category, quantity })
        });
        showToast('Book updated successfully!', 'success');
        closeModal('editBookModal');
        await refreshAdminAll();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteBook(id, title) {
    if (!confirm(`Are you sure you want to delete book "${title}" (ID: #${id})?`)) {
        return;
    }

    try {
        await apiRequest(`/books/${id}`, { method: 'DELETE' });
        showToast('Book deleted successfully.', 'success');
        await refreshAdminAll();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadAdminStudents() {
    const tbody = document.getElementById('adminStudentsTableBody');
    if (!tbody) return;

    try {
        adminStudentsCache = await apiRequest('/users');
        filterAdminStudents();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load students: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterAdminStudents() {
    const tbody = document.getElementById('adminStudentsTableBody');
    if (!tbody) return;

    const term = (document.getElementById('adminStudentSearch')?.value || '').toLowerCase().trim();
    const filtered = adminStudentsCache.filter(s =>
        !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.mobile.includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No registered students found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td><strong>#${s.id}</strong></td>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.mobile)}</td>
            <td><span class="badge badge-category">${s.role}</span></td>
            <td>
                <span class="badge ${s.activeIssuesCount > 0 ? 'badge-issued' : 'badge-available'}">
                    ${s.activeIssuesCount} Active (${s.totalIssuesCount} Total)
                </span>
            </td>
        </tr>
    `).join('');
}

async function loadAdminTransactions() {
    const tbody = document.getElementById('adminTransactionsTableBody');
    if (!tbody) return;

    try {
        adminTransactionsCache = await apiRequest('/issues');
        filterAdminTransactions();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load transactions: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterAdminTransactions() {
    const tbody = document.getElementById('adminTransactionsTableBody');
    if (!tbody) return;

    const status = document.getElementById('transactionStatusFilter')?.value || '';
    const term = (document.getElementById('transactionSearch')?.value || '').toLowerCase().trim();

    const filtered = adminTransactionsCache.filter(t => {
        const matchesStatus = !status || t.status === status;
        const matchesTerm = !term ||
            t.userName.toLowerCase().includes(term) ||
            t.bookTitle.toLowerCase().includes(term) ||
            t.userEmail.toLowerCase().includes(term);
        return matchesStatus && matchesTerm;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No issue/return transactions recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td><strong>#${t.id}</strong></td>
            <td><strong>${escapeHtml(t.userName)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(t.userEmail)}</small></td>
            <td><strong>${escapeHtml(t.bookTitle)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(t.bookAuthor)}</small></td>
            <td><span class="badge badge-category">${escapeHtml(t.bookCategory)}</span></td>
            <td>${t.issueDate}</td>
            <td>${t.returnDate ? t.returnDate : '<span style="color:var(--text-muted);">Not returned</span>'}</td>
            <td>
                <span class="badge ${t.status === 'ISSUED' ? 'badge-issued' : 'badge-returned'}">
                    ${t.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// UI Helpers
// -------------------------------------------------------------
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
}

function populateCategoryFilter(selectId, books) {
    const sel = document.getElementById(selectId);
    if (!sel) return;

    const currentVal = sel.value;
    const cats = Array.from(new Set(books.map(b => b.category).filter(Boolean))).sort();

    sel.innerHTML = `<option value="">All Categories</option>` +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    if (cats.includes(currentVal)) {
        sel.value = currentVal;
    }
}
