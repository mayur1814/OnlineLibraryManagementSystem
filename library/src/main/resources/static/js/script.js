/* ====================================================================
   ONLINE LIBRARY MANAGEMENT SYSTEM - FRONTEND SCRIPT
   REST API Client, Form Validation, Modal Controls, Toast Alerts, Dashboards,
   Cover Image Rendering, Book Details Modal, Issue/Return Modals
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
// Book Cover Image Helpers & Fallbacks
// -------------------------------------------------------------
function getBookCoverUrl(book) {
    if (book && book.imageUrl && book.imageUrl.trim().length > 0) {
        return book.imageUrl.trim();
    }
    return '/images/covers/default-cover.svg';
}

function handleCoverError(imgElement, title = 'Book', category = '') {
    imgElement.onerror = null;
    imgElement.src = '/images/covers/default-cover.svg';
}

function renderBookCoverThumb(book) {
    const coverUrl = getBookCoverUrl(book);
    const title = escapeHtml(book.title || 'Book');
    const cat = escapeHtml(book.category || '');
    return `
        <div class="book-thumb-wrapper" onclick="openBookDetailsModal(${book.id})" title="Click to view full details for '${title}'">
            <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')" loading="lazy">
        </div>
    `;
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
            b.category.toLowerCase().includes(term) ||
            (b.isbn && b.isbn.toLowerCase().includes(term)) ||
            (String(b.id).includes(term));
        const matchesCat = !category || b.category === category;
        return matchesTerm && matchesCat;
    });

    renderPublicCatalog(filtered);
}

function renderPublicCatalog(books) {
    const tbody = document.getElementById('publicBooksTbody');
    if (!tbody) return;

    if (!books || books.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No matching books found.</td></tr>`;
        return;
    }

    tbody.innerHTML = books.map(b => `
        <tr>
            <td>${renderBookCoverThumb(b)}</td>
            <td>
                <div class="book-info-col">
                    <a class="book-title-link" onclick="openBookDetailsModal(${b.id})">${escapeHtml(b.title)}</a>
                    <span class="book-author-text">by ${escapeHtml(b.author)}</span>
                    ${b.isbn ? `<span class="book-isbn-tag">ISBN: ${escapeHtml(b.isbn)}</span>` : ''}
                </div>
            </td>
            <td><strong>#${b.id}</strong></td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td>
                <strong>${b.quantity}</strong> <span style="font-size:0.8rem;color:var(--text-secondary);">/ ${b.totalCopies || b.quantity}</span>
            </td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})">View Details</button>
            </td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// Student Dashboard (student-dashboard.html)
// -------------------------------------------------------------
let studentBooksCache = [];
let studentLoansCache = [];
let pendingIssueBook = null;
let pendingReturnRecord = null;

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
            b.category.toLowerCase().includes(term) ||
            (b.isbn && b.isbn.toLowerCase().includes(term)) ||
            (String(b.id).includes(term));
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
            <td>${renderBookCoverThumb(b)}</td>
            <td>
                <div class="book-info-col">
                    <a class="book-title-link" onclick="openBookDetailsModal(${b.id})">${escapeHtml(b.title)}</a>
                    <span class="book-author-text">by ${escapeHtml(b.author)}</span>
                    ${b.isbn ? `<span class="book-isbn-tag">ISBN: ${escapeHtml(b.isbn)}</span>` : ''}
                </div>
            </td>
            <td><strong>#${b.id}</strong></td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td>
                <strong>${b.quantity}</strong> <span style="font-size:0.8rem;color:var(--text-secondary);">/ ${b.totalCopies || b.quantity}</span>
            </td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:0.4rem;align-items:center;">
                    ${b.quantity > 0
                        ? `<button class="btn btn-primary btn-sm" onclick="openIssueBookModal(${b.id})">Issue Book</button>`
                        : `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;cursor:not-allowed;">Out of Stock</button>`}
                    <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})" title="Details">ℹ</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// Interactive Issue Book Modal
// -------------------------------------------------------------
function openIssueBookModal(bookId) {
    const book = studentBooksCache.find(b => b.id === bookId) || allPublicBooks.find(b => b.id === bookId);
    if (!book) return;
    pendingIssueBook = book;

    const modalBody = document.getElementById('issueModalBody');
    if (!modalBody) {
        issueBookDirect(book.id, book.title);
        return;
    }

    const coverUrl = getBookCoverUrl(book);
    const title = escapeHtml(book.title);
    const author = escapeHtml(book.author);
    const cat = escapeHtml(book.category);
    const isbn = escapeHtml(book.isbn || 'N/A');

    modalBody.innerHTML = `
        <div class="action-confirm-box">
            <div class="action-confirm-cover">
                <img src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
            </div>
            <div class="action-confirm-info">
                <h4>${title}</h4>
                <p>by <strong>${author}</strong></p>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.25rem 0;">
                    <span class="badge badge-category">${cat}</span>
                    <span class="badge badge-category">ID: #${book.id}</span>
                    <span class="badge ${book.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">${book.status}</span>
                </div>
                <p style="font-size:0.825rem;color:var(--text-secondary);margin-top:0.2rem;">
                    Available Stock: <strong>${book.quantity}</strong> copies (Total: ${book.totalCopies || book.quantity})
                </p>
            </div>
        </div>
        <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;">
            Confirming this loan will issue 1 copy to your student library account. The book is due in <strong>14 days</strong>.
        </p>
    `;

    openModal('issueBookModal');
}

async function confirmIssueBookAction() {
    if (!pendingIssueBook) return;
    const book = pendingIssueBook;
    const user = requireUser('STUDENT');
    if (!user) return;

    const btn = document.getElementById('confirmIssueBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Issuing...';
    }

    try {
        await apiRequest('/issue', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, bookId: book.id })
        });
        showToast(`Successfully issued "${book.title}"!`, 'success');
        closeModal('issueBookModal');
        closeModal('bookDetailsModal');
        await Promise.all([
            loadStudentBooks(),
            loadStudentIssuedRecords(),
            loadDashboardStats()
        ]);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Confirm & Issue Book';
        }
        pendingIssueBook = null;
    }
}

async function issueBookDirect(bookId, bookTitle) {
    const user = requireUser('STUDENT');
    if (!user) return;

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

// -------------------------------------------------------------
// Interactive Return Book & Loan Records
// -------------------------------------------------------------
async function loadStudentIssuedRecords() {
    const tbody = document.getElementById('studentIssuedTableBody');
    if (!tbody) return;

    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        const records = await apiRequest(`/issue/user/${user.id}`);
        studentLoansCache = records || [];
        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">You currently have no issued books.</td></tr>`;
            return;
        }

        // Count active issues for student badge
        const activeCount = records.filter(r => r.status === 'ISSUED').length;
        const myActiveElem = document.getElementById('myActiveIssuesCount');
        if (myActiveElem) myActiveElem.textContent = activeCount;

        tbody.innerHTML = records.map(r => {
            const coverUrl = r.bookImageUrl || '/images/covers/default-cover.svg';
            const title = escapeHtml(r.bookTitle);
            const author = escapeHtml(r.bookAuthor || 'Unknown Author');
            const cat = escapeHtml(r.bookCategory || 'General');
            const dueDate = r.dueDate || '14 days';
            const isIssued = r.status === 'ISSUED';

            return `
                <tr>
                    <td>
                        <div class="book-thumb-wrapper" onclick="openBookDetailsModal(${r.bookId})">
                            <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
                        </div>
                    </td>
                    <td><strong>#${r.id}</strong></td>
                    <td>
                        <div class="book-info-col">
                            <a class="book-title-link" onclick="openBookDetailsModal(${r.bookId})">${title}</a>
                            <span class="book-author-text">by ${author}</span>
                            ${r.bookIsbn ? `<span class="book-isbn-tag">ISBN: ${escapeHtml(r.bookIsbn)}</span>` : ''}
                        </div>
                    </td>
                    <td><span class="badge badge-category">${cat}</span></td>
                    <td>${r.issueDate}</td>
                    <td>
                        <span class="due-date-pill ${isIssued ? 'ok' : ''}">
                            📅 ${dueDate}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${isIssued ? 'badge-issued' : 'badge-returned'}">
                            ${r.status}
                        </span>
                        ${r.returnDate ? `<br><small style="color:var(--text-muted);">Returned: ${r.returnDate}</small>` : ''}
                    </td>
                    <td>
                        ${isIssued
                            ? `<button class="btn btn-success btn-sm" onclick="openReturnBookModal(${r.id})">Return Book</button>`
                            : `<span style="color:#059669;font-weight:600;font-size:0.85rem;">✓ Completed</span>`}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load records: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function openReturnBookModal(issueId) {
    const record = (studentLoansCache && studentLoansCache.find(r => r.id === issueId)) ||
                   (adminTransactionsCache && adminTransactionsCache.find(r => r.id === issueId));
    if (!record) return;
    pendingReturnRecord = record;

    const modalBody = document.getElementById('returnModalBody');
    if (!modalBody) {
        returnBookDirect(record.id, record.bookTitle);
        return;
    }

    const coverUrl = record.bookImageUrl || '/images/covers/default-cover.svg';
    const title = escapeHtml(record.bookTitle);
    const author = escapeHtml(record.bookAuthor || 'Unknown');
    const cat = escapeHtml(record.bookCategory || 'General');
    const dueDate = record.dueDate || 'N/A';

    modalBody.innerHTML = `
        <div class="action-confirm-box">
            <div class="action-confirm-cover">
                <img src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
            </div>
            <div class="action-confirm-info">
                <h4>${title}</h4>
                <p>by <strong>${author}</strong></p>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.25rem 0;">
                    <span class="badge badge-category">${cat}</span>
                    <span class="badge ${record.status === 'ISSUED' ? 'badge-issued' : 'badge-returned'}">${record.status}</span>
                </div>
                <div style="font-size:0.825rem;color:var(--text-secondary);margin-top:0.3rem;">
                    <div>Issue Date: <strong>${record.issueDate}</strong></div>
                    <div>Due Date: <strong>${dueDate}</strong></div>
                </div>
            </div>
        </div>
        <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;">
            Are you sure you want to process this return? This will restore 1 copy of the book to available stock.
        </p>
    `;

    openModal('returnBookModal');
}

async function confirmReturnBookAction() {
    if (!pendingReturnRecord) return;
    const record = pendingReturnRecord;

    const btn = document.getElementById('confirmReturnBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processing...';
    }

    try {
        await apiRequest('/return', {
            method: 'POST',
            body: JSON.stringify({ id: record.id })
        });
        showToast(`"${record.bookTitle}" returned successfully!`, 'success');
        closeModal('returnBookModal');

        const user = getCurrentUser();
        if (user && user.role === 'ADMIN') {
            await refreshAdminAll();
        } else {
            await Promise.all([
                loadStudentBooks(),
                loadStudentIssuedRecords(),
                loadDashboardStats()
            ]);
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Confirm Return';
        }
        pendingReturnRecord = null;
    }
}

async function returnBookDirect(issueId, bookTitle) {
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load books: ${escapeHtml(err.message)}</td></tr>`;
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
            b.category.toLowerCase().includes(term) ||
            (b.isbn && b.isbn.toLowerCase().includes(term)) ||
            (String(b.id).includes(term));
        const matchesCat = !cat || b.category === cat;
        return matchesTerm && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">No books match criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td>${renderBookCoverThumb(b)}</td>
            <td>
                <div class="book-info-col">
                    <a class="book-title-link" onclick="openBookDetailsModal(${b.id})">${escapeHtml(b.title)}</a>
                    <span class="book-author-text">by ${escapeHtml(b.author)}</span>
                </div>
            </td>
            <td>
                <div><strong>#${b.id}</strong></div>
                <div class="book-isbn-tag">${b.isbn ? escapeHtml(b.isbn) : 'No ISBN'}</div>
            </td>
            <td><span class="badge badge-category">${escapeHtml(b.category)}</span></td>
            <td><strong>${b.totalCopies || b.quantity}</strong> copies</td>
            <td>
                <strong style="color:${b.quantity > 0 ? '#10b981' : '#ef4444'};">${b.quantity}</strong> available
            </td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:0.4rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})" title="Details">Info</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${b.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id}, '${escapeHtml(b.title).replace(/'/g, "\\'")}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateAddCoverPreview(url) {
    const preview = document.getElementById('addCoverPreview');
    if (!preview) return;
    preview.src = (url && url.trim().length > 0) ? url.trim() : '/images/covers/default-cover.svg';
}

function updateEditCoverPreview(url) {
    const preview = document.getElementById('editCoverPreview');
    if (!preview) return;
    preview.src = (url && url.trim().length > 0) ? url.trim() : '/images/covers/default-cover.svg';
}

async function handleAddBook(event) {
    event.preventDefault();
    const title = document.getElementById('addTitle').value.trim();
    const author = document.getElementById('addAuthor').value.trim();
    const category = document.getElementById('addCategory').value.trim();
    const isbn = document.getElementById('addIsbn')?.value.trim() || '';
    const totalCopies = parseInt(document.getElementById('addTotalCopies')?.value, 10) || 1;
    const quantity = parseInt(document.getElementById('addQuantity').value, 10);
    const imageUrl = document.getElementById('addImageUrl')?.value.trim() || '/images/covers/default-cover.svg';
    const description = document.getElementById('addDescription')?.value.trim() || '';

    if (!title || !author || !category || isNaN(quantity)) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    try {
        await apiRequest('/books', {
            method: 'POST',
            body: JSON.stringify({
                title, author, category, quantity, totalCopies, isbn, imageUrl, description
            })
        });
        showToast('Book added successfully!', 'success');
        document.getElementById('addBookForm').reset();
        updateAddCoverPreview('');
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
    if (document.getElementById('editIsbn')) document.getElementById('editIsbn').value = book.isbn || '';
    if (document.getElementById('editTotalCopies')) document.getElementById('editTotalCopies').value = book.totalCopies || book.quantity;
    if (document.getElementById('editImageUrl')) {
        document.getElementById('editImageUrl').value = book.imageUrl || '';
        updateEditCoverPreview(book.imageUrl);
    }
    if (document.getElementById('editDescription')) document.getElementById('editDescription').value = book.description || '';

    openModal('editBookModal');
}

async function handleUpdateBook(event) {
    event.preventDefault();
    const id = document.getElementById('editBookId').value;
    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();
    const category = document.getElementById('editCategory').value.trim();
    const quantity = parseInt(document.getElementById('editQuantity').value, 10);
    const isbn = document.getElementById('editIsbn')?.value.trim() || '';
    const totalCopies = parseInt(document.getElementById('editTotalCopies')?.value, 10) || quantity;
    const imageUrl = document.getElementById('editImageUrl')?.value.trim() || '';
    const description = document.getElementById('editDescription')?.value.trim() || '';

    try {
        await apiRequest(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                title, author, category, quantity, totalCopies, isbn, imageUrl, description
            })
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
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load transactions: ${escapeHtml(err.message)}</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:#94a3b8;">No issue/return transactions recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const coverUrl = t.bookImageUrl || '/images/covers/default-cover.svg';
        const title = escapeHtml(t.bookTitle);
        const cat = escapeHtml(t.bookCategory || 'General');
        const isIssued = t.status === 'ISSUED';
        const dueDate = t.dueDate || 'N/A';

        return `
            <tr>
                <td>
                    <div class="book-thumb-wrapper" onclick="openBookDetailsModal(${t.bookId})">
                        <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
                    </div>
                </td>
                <td><strong>#${t.id}</strong></td>
                <td><strong>${escapeHtml(t.userName)}</strong><br><small style="color:var(--text-secondary);">${escapeHtml(t.userEmail)}</small></td>
                <td>
                    <div class="book-info-col">
                        <a class="book-title-link" onclick="openBookDetailsModal(${t.bookId})">${title}</a>
                        <span class="book-author-text">by ${escapeHtml(t.bookAuthor)}</span>
                        ${t.bookIsbn ? `<span class="book-isbn-tag">ISBN: ${escapeHtml(t.bookIsbn)}</span>` : ''}
                    </div>
                </td>
                <td><span class="badge badge-category">${cat}</span></td>
                <td>${t.issueDate}</td>
                <td>
                    <span class="due-date-pill ${isIssued ? 'ok' : ''}">
                        📅 ${dueDate}
                    </span>
                </td>
                <td>${t.returnDate ? t.returnDate : '<span style="color:var(--text-muted);">Not returned</span>'}</td>
                <td>
                    <span class="badge ${isIssued ? 'badge-issued' : 'badge-returned'}">
                        ${t.status}
                    </span>
                </td>
                <td>
                    ${isIssued
                        ? `<button class="btn btn-success btn-sm" onclick="openReturnBookModal(${t.id})">Return</button>`
                        : `<span style="color:#059669;font-size:0.8rem;font-weight:600;">✓ Done</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------
// Universal Book Details Modal
// -------------------------------------------------------------
async function openBookDetailsModal(bookId) {
    let book = (adminBooksCache && adminBooksCache.find(b => b.id === bookId)) ||
               (studentBooksCache && studentBooksCache.find(b => b.id === bookId)) ||
               (allPublicBooks && allPublicBooks.find(b => b.id === bookId));

    if (!book) {
        try {
            book = await apiRequest(`/books/${bookId}`);
        } catch (e) {
            showToast('Unable to load book details.', 'error');
            return;
        }
    }
    if (!book) return;

    const modalBody = document.getElementById('bookDetailsBody');
    const modalFooter = document.getElementById('bookDetailsFooter');
    if (!modalBody) return;

    const coverUrl = getBookCoverUrl(book);
    const title = escapeHtml(book.title);
    const author = escapeHtml(book.author);
    const cat = escapeHtml(book.category);
    const isbn = escapeHtml(book.isbn || ('978-013000' + book.id));
    const totalCopies = book.totalCopies || Math.max(book.quantity, 1);
    const availCopies = book.quantity;
    const percentAvail = Math.round((availCopies / totalCopies) * 100);
    const desc = escapeHtml(book.description || 'Comprehensive academic textbook referenced in core academic curriculum and recommended library study material.');

    modalBody.innerHTML = `
        <div class="book-details-layout">
            <div class="book-details-cover-container">
                <img class="book-details-cover-img" src="${escapeHtml(coverUrl)}" alt="${title}" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
            </div>
            <div class="book-details-content">
                <div>
                    <span class="badge badge-category" style="margin-bottom:0.4rem;">${cat}</span>
                    <h3 class="book-details-title">${title}</h3>
                    <p class="book-details-author">Author: <strong>${author}</strong></p>
                </div>

                <div class="book-details-meta-grid">
                    <div class="meta-item">
                        <span class="meta-item-label">Catalog ID</span>
                        <span class="meta-item-value">Book #${book.id}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-item-label">ISBN Reference</span>
                        <span class="meta-item-value">${isbn}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-item-label">Available Copies</span>
                        <span class="meta-item-value" style="color:${availCopies > 0 ? '#10b981' : '#ef4444'};">
                            ${availCopies} copies
                        </span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-item-label">Total Inventory</span>
                        <span class="meta-item-value">${totalCopies} copies</span>
                    </div>
                </div>

                <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);font-weight:600;">
                        <span>Inventory Availability</span>
                        <span>${percentAvail}% in stock</span>
                    </div>
                    <div class="book-stock-meter">
                        <div class="book-stock-fill" style="width:${percentAvail}%;"></div>
                    </div>
                </div>

                <div class="book-details-desc">
                    <strong style="display:block;margin-bottom:0.25rem;color:var(--text-primary);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.04em;">Synopsis & Academic Summary</strong>
                    ${desc}
                </div>
            </div>
        </div>
    `;

    // Dynamic Contextual Footer
    const user = getCurrentUser();
    let actionButtons = `<button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal')">Close</button>`;

    if (user && user.role === 'STUDENT') {
        if (availCopies > 0) {
            actionButtons = `
                <button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal')">Close</button>
                <button type="button" class="btn btn-primary" onclick="closeModal('bookDetailsModal');openIssueBookModal(${book.id})">Issue This Book →</button>
            `;
        } else {
            actionButtons = `
                <button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal')">Close</button>
                <button type="button" class="btn btn-secondary" disabled style="opacity:0.6;cursor:not-allowed;">Currently Out of Stock</button>
            `;
        }
    } else if (user && user.role === 'ADMIN') {
        actionButtons = `
            <button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal')">Close</button>
            <button type="button" class="btn btn-primary" onclick="closeModal('bookDetailsModal');openEditModal(${book.id})">Edit Book Details</button>
        `;
    } else {
        // Public user on index.html
        actionButtons = `
            <button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal')">Close</button>
            <a href="login.html" class="btn btn-primary">Login to Issue Book →</a>
        `;
    }

    if (modalFooter) {
        modalFooter.innerHTML = actionButtons;
    }

    openModal('bookDetailsModal');
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
