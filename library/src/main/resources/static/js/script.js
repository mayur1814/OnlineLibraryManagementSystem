/* ====================================================================
   SHREE LIBRARY - COMPREHENSIVE CLIENT LOGIC & CONTROLLER ENGINE
   REST API Client, Chrome Image URL Cleaner & Live Clipboard Handler,
   Ultra-Fast Reactive Filters, View Modes (Grid/Table), Modals & Toasts
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
        <span style="font-size:1.15rem;font-weight:800;line-height:1;">${iconMap[type] || 'ℹ'}</span>
        <span style="flex:1;line-height:1.4;">${escapeHtml(message)}</span>
        <span style="cursor:pointer;opacity:0.8;font-weight:bold;padding:0.2rem;" onclick="this.parentElement.remove()" title="Close">✕</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(110%)';
            setTimeout(() => toast.remove(), 350);
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
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Close modals when clicking outside modal-box
window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
        closeModal(e.target.id);
    }
});

// Close modals on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
});

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
        showToast(`Unauthorized. Redirecting to appropriate portal...`, 'error');
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
        }, 400);
    }
}

// -------------------------------------------------------------
// Chrome Image URL Cleaner & Live Preview Handler
// -------------------------------------------------------------
/**
 * Intelligently cleans and extracts direct image URLs.
 * Handles:
 * - Google Images Search links (extracts 'imgurl=' query parameter)
 * - Google redirect URLs
 * - Extra whitespace, quotes, or trailing parameters
 * - Standard web URLs and Base64 Data URLs
 */
function cleanImageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();

    // Strip accidental wrapping quotes
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
        url = url.slice(1, -1).trim();
    }

    // Check if user copied a Google Images search result link
    if (url.includes('google.') && (url.includes('/imgres') || url.includes('/url'))) {
        try {
            const parsed = new URL(url);
            const nestedImgUrl = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url');
            if (nestedImgUrl) {
                return decodeURIComponent(nestedImgUrl).trim();
            }
        } catch (e) {
            // Regex fallback for Google Image URL extraction
            const match = url.match(/[?&](?:imgurl|url)=([^&]+)/i);
            if (match && match[1]) {
                return decodeURIComponent(match[1]).trim();
            }
        }
    }

    return url;
}

function getBookCoverUrl(book) {
    if (book && book.imageUrl && typeof book.imageUrl === 'string') {
        const cleaned = cleanImageUrl(book.imageUrl);
        if (cleaned.length > 0) {
            return cleaned;
        }
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
            <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')" loading="lazy">
        </div>
    `;
}

/**
 * Reads directly from Chrome/system clipboard and updates the given input field
 */
async function pasteFromClipboard(inputId, previewId, statusId) {
    try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            const manual = prompt('Paste your image URL here:');
            if (manual) {
                applyCleanedCoverUrl(manual, inputId, previewId, statusId);
            }
            return;
        }

        const text = await navigator.clipboard.readText();
        if (!text || text.trim().length === 0) {
            showToast('Clipboard is empty or contains no text.', 'warning');
            return;
        }

        applyCleanedCoverUrl(text, inputId, previewId, statusId);
        showToast('Image URL pasted from clipboard!', 'success');
    } catch (err) {
        console.warn('Clipboard read error:', err);
        const manual = prompt('Please paste your image URL:');
        if (manual) {
            applyCleanedCoverUrl(manual, inputId, previewId, statusId);
        }
    }
}

function applyCleanedCoverUrl(rawUrl, inputId, previewId, statusId) {
    const cleaned = cleanImageUrl(rawUrl);
    const input = document.getElementById(inputId);
    if (input) {
        input.value = cleaned;
    }
    updateCoverPreviewLive(cleaned, previewId, statusId);
}

/**
 * Live debounced preview testing for Chrome image URLs
 */
let previewDebounceTimer = null;
function updateCoverPreviewLive(rawUrl, previewId, statusId) {
    clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(() => {
        const preview = document.getElementById(previewId);
        const status = document.getElementById(statusId);
        if (!preview) return;

        const cleaned = cleanImageUrl(rawUrl);

        if (!cleaned || cleaned.length === 0) {
            preview.src = '/images/covers/default-cover.svg';
            if (status) {
                status.innerHTML = `<span class="cover-status-badge cover-status-warn">Using Default SVG Cover</span>`;
            }
            return;
        }

        if (status) {
            status.innerHTML = `<span class="cover-status-badge" style="background:#e0e7ff;color:#4338ca;">⏳ Verifying Image...</span>`;
        }

        const testImg = new Image();
        testImg.referrerPolicy = 'no-referrer';
        testImg.onload = () => {
            preview.src = cleaned;
            if (status) {
                status.innerHTML = `<span class="cover-status-badge cover-status-ok">✓ Image Loaded Successfully</span>`;
            }
        };
        testImg.onerror = () => {
            preview.src = '/images/covers/default-cover.svg';
            if (status) {
                status.innerHTML = `<span class="cover-status-badge cover-status-warn">⚠️ Preview Failed — Default SVG Fallback</span>`;
            }
        };
        testImg.src = cleaned;
    }, 250);
}

// Preset cover suggestions for 1-click test
const PRESET_COVERS = [
    { label: 'Clean Code', url: 'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg' },
    { label: 'Algorithms (CLRS)', url: 'https://images-na.ssl-images-amazon.com/images/I/41T0iBxY8FL._SX440_BO1,204,203,200_.jpg' },
    { label: 'Designing Data', url: 'https://images-na.ssl-images-amazon.com/images/I/51r26r7gH0L._SX379_BO1,204,203,200_.jpg' },
    { label: 'Spring Boot', url: 'https://images-na.ssl-images-amazon.com/images/I/513yv6s0jLL._SX397_BO1,204,203,200_.jpg' },
    { label: 'AI Modern Approach', url: 'https://images-na.ssl-images-amazon.com/images/I/51A1bS4VzGL._SX382_BO1,204,203,200_.jpg' },
    { label: 'Design Patterns', url: 'https://images-na.ssl-images-amazon.com/images/I/51szD9HC9pL._SX430_BO1,204,203,200_.jpg' }
];

function selectPresetCover(index, inputId, previewId, statusId) {
    const preset = PRESET_COVERS[index];
    if (preset) {
        applyCleanedCoverUrl(preset.url, inputId, previewId, statusId);
    }
}

// Quick Cover Modal Logic (Admin)
let quickCoverBookId = null;
function openQuickCoverModal(bookId) {
    const book = (adminBooksCache && adminBooksCache.find(b => b.id === bookId)) ||
                 (allPublicBooks && allPublicBooks.find(b => b.id === bookId));
    if (!book) return;

    quickCoverBookId = bookId;
    document.getElementById('quickCoverBookTitle').textContent = book.title;
    document.getElementById('quickCoverBookAuthor').textContent = 'by ' + book.author;
    document.getElementById('quickCoverUrlInput').value = book.imageUrl || '';
    
    updateCoverPreviewLive(book.imageUrl || '', 'quickCoverPreview', 'quickCoverStatus');
    openModal('quickCoverModal');
}

async function handleQuickCoverSave() {
    if (!quickCoverBookId) return;
    const input = document.getElementById('quickCoverUrlInput');
    const newUrl = cleanImageUrl(input?.value || '');

    const btn = document.getElementById('quickCoverSaveBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
    }

    try {
        const updated = await apiRequest(`/books/${quickCoverBookId}/cover`, {
            method: 'PATCH',
            body: JSON.stringify({ imageUrl: newUrl })
        });

        // Update local caches
        if (adminBooksCache) {
            const idx = adminBooksCache.findIndex(b => b.id === quickCoverBookId);
            if (idx !== -1) adminBooksCache[idx] = updated;
            filterAdminBooks();
        }
        if (allPublicBooks) {
            const idx = allPublicBooks.findIndex(b => b.id === quickCoverBookId);
            if (idx !== -1) allPublicBooks[idx] = updated;
            filterPublicCatalog();
        }

        showToast('Book cover updated successfully!', 'success');
        closeModal('quickCoverModal');
    } catch (err) {
        // Fallback to full PUT if PATCH is unsupported
        try {
            const book = adminBooksCache.find(b => b.id === quickCoverBookId);
            if (book) {
                const bookCopy = { ...book, imageUrl: newUrl };
                const updated = await apiRequest(`/books/${quickCoverBookId}`, {
                    method: 'PUT',
                    body: JSON.stringify(bookCopy)
                });
                const idx = adminBooksCache.findIndex(b => b.id === quickCoverBookId);
                if (idx !== -1) adminBooksCache[idx] = updated;
                filterAdminBooks();
                showToast('Book cover updated successfully!', 'success');
                closeModal('quickCoverModal');
            }
        } catch (innerErr) {
            showToast(innerErr.message || 'Failed to update cover', 'error');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save Cover';
        }
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
        showToast(`Welcome back, ${user.name}!`, 'success');

        setTimeout(() => {
            if (user.role === 'ADMIN') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }
        }, 600);
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
// Public Catalog Engine (index.html)
// -------------------------------------------------------------
let allPublicBooks = [];
let publicCatalogViewMode = 'table'; // 'table' or 'grid'

async function loadPublicCatalog() {
    try {
        allPublicBooks = await apiRequest('/books');
        populateCategoryFilter('catalogCategory', allPublicBooks);
        filterPublicCatalog();

        // Fetch stats if available
        const stats = await apiRequest('/stats');
        if (stats) {
            const bElem = document.getElementById('statTotalBooks');
            if (bElem) bElem.textContent = stats.totalBooks;
            const cElem = document.getElementById('statTotalCopies');
            if (cElem) cElem.textContent = stats.totalPhysicalCopies + '+';
            const sElem = document.getElementById('statTotalStudents');
            if (sElem) sElem.textContent = stats.totalStudents + '+';
        }
    } catch (err) {
        console.error('Public catalog load error:', err);
    }
}

function setPublicCatalogView(mode) {
    publicCatalogViewMode = mode;
    document.querySelectorAll('.public-view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    filterPublicCatalog();
}

function filterPublicCatalog() {
    const term = (document.getElementById('catalogSearch')?.value || '').toLowerCase().trim();
    const category = (document.getElementById('catalogCategory')?.value || '').toLowerCase().trim();
    const availFilter = document.getElementById('catalogAvailFilter')?.value || 'all';
    const sortBy = document.getElementById('catalogSort')?.value || 'default';

    // Show/hide clear button
    const clearBtn = document.getElementById('catalogSearchClear');
    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';

    let filtered = allPublicBooks.filter(b => {
        const title = (b.title || '').toLowerCase();
        const author = (b.author || '').toLowerCase();
        const cat = (b.category || '').toLowerCase();
        const isbn = (b.isbn || '').toLowerCase();
        const idStr = String(b.id || '');

        const matchesTerm = !term ||
            title.includes(term) ||
            author.includes(term) ||
            cat.includes(term) ||
            isbn.includes(term) ||
            idStr.includes(term);

        const matchesCat = !category || cat === category;

        let matchesAvail = true;
        if (availFilter === 'available') matchesAvail = (b.quantity > 0);
        else if (availFilter === 'unavailable') matchesAvail = (b.quantity <= 0);

        return matchesTerm && matchesCat && matchesAvail;
    });

    // Sorting
    filtered = sortBookList(filtered, sortBy);

    // Update Counter
    const countElem = document.getElementById('catalogResultsCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${allPublicBooks.length} books`;
    }

    renderPublicCatalog(filtered);
}

function resetPublicCatalogFilters() {
    const searchInput = document.getElementById('catalogSearch');
    if (searchInput) searchInput.value = '';
    const catSelect = document.getElementById('catalogCategory');
    if (catSelect) catSelect.value = '';
    const availSelect = document.getElementById('catalogAvailFilter');
    if (availSelect) availSelect.value = 'all';
    const sortSelect = document.getElementById('catalogSort');
    if (sortSelect) sortSelect.value = 'default';
    filterPublicCatalog();
}

function renderPublicCatalog(books) {
    const tbody = document.getElementById('publicBooksTbody');
    const gridContainer = document.getElementById('publicBooksGrid');
    const tableWrap = document.getElementById('publicCatalogTableWrap');

    if (!books || books.length === 0) {
        const emptyHtml = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h4>No Matching Books Found</h4>
                <p>Try refining your search keyword or clearing the selected category filters.</p>
                <button class="btn btn-secondary btn-sm" onclick="resetPublicCatalogFilters()">↻ Reset Filters</button>
            </div>
        `;
        if (tableWrap) tableWrap.style.display = 'none';
        if (gridContainer) {
            gridContainer.style.display = 'block';
            gridContainer.innerHTML = emptyHtml;
        }
        return;
    }

    if (publicCatalogViewMode === 'grid') {
        if (tableWrap) tableWrap.style.display = 'none';
        if (gridContainer) {
            gridContainer.style.display = 'grid';
            gridContainer.className = 'books-grid-view';
            gridContainer.innerHTML = books.map(b => renderBookCardHtml(b, false)).join('');
        }
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableWrap) tableWrap.style.display = 'block';
        if (tbody) {
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
                        <div style="display:flex;gap:0.4rem;">
                            <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})">Details</button>
                            <a href="login.html" class="btn btn-primary btn-sm">Issue Book →</a>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// -------------------------------------------------------------
// Student Dashboard (student-dashboard.html)
// -------------------------------------------------------------
let studentBooksCache = [];
let studentLoansCache = [];
let studentCatalogViewMode = 'table';
let pendingIssueBook = null;
let pendingReturnRecord = null;

async function initStudentDashboard() {
    const user = requireUser('STUDENT');
    if (!user) return;

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

function setStudentCatalogView(mode) {
    studentCatalogViewMode = mode;
    document.querySelectorAll('.student-view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
    filterStudentBooks();
}

function filterStudentBooks() {
    const tbody = document.getElementById('studentBookTableBody');
    const gridContainer = document.getElementById('studentBooksGrid');
    const tableWrap = document.getElementById('studentCatalogTableWrap');
    if (!tbody && !gridContainer) return;

    const term = (document.getElementById('studentSearch')?.value || '').toLowerCase().trim();
    const cat = (document.getElementById('categoryFilter')?.value || '').toLowerCase().trim();
    const availFilter = document.getElementById('studentAvailFilter')?.value || 'all';
    const sortBy = document.getElementById('studentSort')?.value || 'default';

    // Toggle search clear button
    const clearBtn = document.getElementById('studentSearchClear');
    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';

    let filtered = studentBooksCache.filter(b => {
        const title = (b.title || '').toLowerCase();
        const author = (b.author || '').toLowerCase();
        const category = (b.category || '').toLowerCase();
        const isbn = (b.isbn || '').toLowerCase();
        const idStr = String(b.id || '');

        const matchesTerm = !term ||
            title.includes(term) ||
            author.includes(term) ||
            category.includes(term) ||
            isbn.includes(term) ||
            idStr.includes(term);

        const matchesCat = !cat || category === cat;

        let matchesAvail = true;
        if (availFilter === 'available') matchesAvail = (b.quantity > 0);
        else if (availFilter === 'unavailable') matchesAvail = (b.quantity <= 0);

        return matchesTerm && matchesCat && matchesAvail;
    });

    filtered = sortBookList(filtered, sortBy);

    // Update Counter
    const countElem = document.getElementById('studentResultsCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${studentBooksCache.length} titles`;
    }

    if (filtered.length === 0) {
        const emptyHtml = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4>No Matching Books Found</h4>
                <p>No catalog titles match your filter settings. Try clearing the search or category.</p>
                <button class="btn btn-secondary btn-sm" onclick="resetStudentBookFilters()">↻ Reset All Filters</button>
            </div>
        `;
        if (tableWrap) tableWrap.style.display = 'none';
        if (gridContainer) {
            gridContainer.style.display = 'block';
            gridContainer.innerHTML = emptyHtml;
        }
        return;
    }

    if (studentCatalogViewMode === 'grid') {
        if (tableWrap) tableWrap.style.display = 'none';
        if (gridContainer) {
            gridContainer.style.display = 'grid';
            gridContainer.className = 'books-grid-view';
            gridContainer.innerHTML = filtered.map(b => renderBookCardHtml(b, true)).join('');
        }
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableWrap) tableWrap.style.display = 'block';
        if (tbody) {
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
    }
}

function resetStudentBookFilters() {
    const sInput = document.getElementById('studentSearch');
    if (sInput) sInput.value = '';
    const catSelect = document.getElementById('categoryFilter');
    if (catSelect) catSelect.value = '';
    const availSelect = document.getElementById('studentAvailFilter');
    if (availSelect) availSelect.value = 'all';
    const sortSelect = document.getElementById('studentSort');
    if (sortSelect) sortSelect.value = 'default';
    filterStudentBooks();
}

function renderBookCardHtml(b, isStudent = false) {
    const coverUrl = getBookCoverUrl(b);
    const title = escapeHtml(b.title || 'Book');
    const author = escapeHtml(b.author || 'Unknown');
    const cat = escapeHtml(b.category || 'General');
    const isAvail = b.quantity > 0;

    return `
        <div class="book-catalog-card">
            <div class="book-card-cover-wrap" onclick="openBookDetailsModal(${b.id})">
                <img class="book-card-cover-img" src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')" loading="lazy">
            </div>
            <div class="book-card-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                    <span class="badge badge-category">${cat}</span>
                    <span class="badge ${isAvail ? 'badge-available' : 'badge-unavailable'}">${isAvail ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                <h4 class="book-card-title" onclick="openBookDetailsModal(${b.id})" title="${title}">${title}</h4>
                <div class="book-card-author">by ${author}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;">
                    Available: <strong>${b.quantity}</strong> / ${b.totalCopies || b.quantity} copies
                </div>
                <div class="book-card-footer">
                    <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})">Details</button>
                    ${isStudent
                        ? (isAvail 
                            ? `<button class="btn btn-primary btn-sm" onclick="openIssueBookModal(${b.id})">Issue →</button>`
                            : `<button class="btn btn-secondary btn-sm" disabled style="opacity:0.6;">Waitlist</button>`)
                        : `<a href="login.html" class="btn btn-primary btn-sm">Sign in →</a>`
                    }
                </div>
            </div>
        </div>
    `;
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

    modalBody.innerHTML = `
        <div class="action-confirm-box">
            <div class="action-confirm-cover">
                <img src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
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
        <div style="background:var(--primary-light);border:1px solid #c7d2fe;border-radius:var(--radius-md);padding:0.85rem 1rem;font-size:0.875rem;color:#3730a3;line-height:1.5;">
            ℹ Confirming this loan will issue 1 copy to your student library account. The book is due in <strong>14 days</strong> from today.
        </div>
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
// Student Issued Records & Enhanced Filters
// -------------------------------------------------------------
async function loadStudentIssuedRecords() {
    const tbody = document.getElementById('studentIssuedTableBody');
    if (!tbody) return;

    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        const records = await apiRequest(`/issue/user/${user.id}`);
        studentLoansCache = records || [];

        // Count active issues for student badge
        const activeCount = studentLoansCache.filter(r => r.status === 'ISSUED').length;
        const myActiveElem = document.getElementById('myActiveIssuesCount');
        if (myActiveElem) myActiveElem.textContent = activeCount;

        filterStudentLoans();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:2rem;">Failed to load records: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function filterStudentLoans() {
    const tbody = document.getElementById('studentIssuedTableBody');
    if (!tbody) return;

    const term = (document.getElementById('studentLoanSearch')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('studentLoanStatusFilter')?.value || 'ALL';

    const filtered = studentLoansCache.filter(r => {
        const title = (r.bookTitle || '').toLowerCase();
        const author = (r.bookAuthor || '').toLowerCase();
        const cat = (r.bookCategory || '').toLowerCase();
        const idStr = String(r.id || '');

        const matchesTerm = !term ||
            title.includes(term) ||
            author.includes(term) ||
            cat.includes(term) ||
            idStr.includes(term);

        const matchesStatus = (statusFilter === 'ALL') || (r.status === statusFilter);

        return matchesTerm && matchesStatus;
    });

    const countElem = document.getElementById('studentLoansCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${studentLoansCache.length} loans`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#94a3b8;">No loan records match your criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        const coverUrl = getBookCoverUrl({ imageUrl: r.bookImageUrl });
        const title = escapeHtml(r.bookTitle);
        const author = escapeHtml(r.bookAuthor || 'Unknown Author');
        const cat = escapeHtml(r.bookCategory || 'General');
        const dueDate = r.dueDate || '14 days';
        const isIssued = r.status === 'ISSUED';

        return `
            <tr>
                <td>
                    <div class="book-thumb-wrapper" onclick="openBookDetailsModal(${r.bookId})">
                        <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
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
                    ${r.returnDate ? `<br><small style="color:var(--text-muted);font-size:0.75rem;">Returned: ${r.returnDate}</small>` : ''}
                </td>
                <td>
                    ${isIssued
                        ? `<button class="btn btn-secondary btn-sm" onclick="returnBookDirect(${r.id}, '${title.replace(/'/g, "\\'")}')">Return Book</button>`
                        : `<span style="color:#059669;font-size:0.8rem;font-weight:600;">✓ Completed</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function resetStudentLoanFilters() {
    const sInput = document.getElementById('studentLoanSearch');
    if (sInput) sInput.value = '';
    const sStatus = document.getElementById('studentLoanStatusFilter');
    if (sStatus) sStatus.value = 'ALL';
    filterStudentLoans();
}

async function returnBookDirect(issueId, bookTitle) {
    if (!confirm(`Are you ready to return "${bookTitle}"?`)) {
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
// Admin Dashboard Engine (admin-dashboard.html)
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
            const b = document.getElementById('statAdminBooks');
            if (b) b.textContent = stats.totalBooks;
            const c = document.getElementById('statAdminCopies');
            if (c) c.textContent = stats.totalPhysicalCopies;
            const i = document.getElementById('statAdminIssued');
            if (i) i.textContent = stats.issuedBooksCount;
            const s = document.getElementById('statAdminStudents');
            if (s) s.textContent = stats.totalStudents;
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
    const cat = (document.getElementById('adminCategoryFilter')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('adminStatusFilter')?.value || 'all';
    const sortBy = document.getElementById('adminSortBy')?.value || 'default';

    // Toggle clear search button
    const clearBtn = document.getElementById('adminBookSearchClear');
    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';

    let filtered = adminBooksCache.filter(b => {
        const title = (b.title || '').toLowerCase();
        const author = (b.author || '').toLowerCase();
        const category = (b.category || '').toLowerCase();
        const isbn = (b.isbn || '').toLowerCase();
        const idStr = String(b.id || '');

        const matchesTerm = !term ||
            title.includes(term) ||
            author.includes(term) ||
            category.includes(term) ||
            isbn.includes(term) ||
            idStr.includes(term);

        const matchesCat = !cat || category === cat;

        let matchesStatus = true;
        if (statusFilter === 'available') matchesStatus = (b.quantity > 0);
        else if (statusFilter === 'unavailable') matchesStatus = (b.quantity <= 0);

        return matchesTerm && matchesCat && matchesStatus;
    });

    filtered = sortBookList(filtered, sortBy);

    // Live count badge
    const countElem = document.getElementById('adminBooksCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${adminBooksCache.length} books`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">📖</div>
                        <h4>No Books Match Your Criteria</h4>
                        <p>No inventory records found matching your filters. Try resetting the filters.</p>
                        <button class="btn btn-secondary btn-sm" onclick="resetAdminBookFilters()">↻ Reset Filters</button>
                    </div>
                </td>
            </tr>
        `;
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
                <strong style="color:${b.quantity > 0 ? '#10b981' : '#f43f5e'};">${b.quantity}</strong> available
            </td>
            <td>
                <span class="badge ${b.quantity > 0 ? 'badge-available' : 'badge-unavailable'}">
                    ${b.status}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:0.35rem;align-items:center;">
                    <button class="btn btn-secondary btn-sm" onclick="openBookDetailsModal(${b.id})" title="View Details">Info</button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${b.id})" title="Edit Details">Edit</button>
                    <button class="btn btn-secondary btn-sm" onclick="openQuickCoverModal(${b.id})" title="Change Book Cover URL">🖼️ Cover</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id}, '${escapeHtml(b.title).replace(/'/g, "\\'")}')" title="Delete Book">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function resetAdminBookFilters() {
    const sInput = document.getElementById('adminBookSearch');
    if (sInput) sInput.value = '';
    const catSelect = document.getElementById('adminCategoryFilter');
    if (catSelect) catSelect.value = '';
    const statusSelect = document.getElementById('adminStatusFilter');
    if (statusSelect) statusSelect.value = 'all';
    const sortSelect = document.getElementById('adminSortBy');
    if (sortSelect) sortSelect.value = 'default';
    filterAdminBooks();
}

async function handleAddBook(event) {
    event.preventDefault();
    const title = document.getElementById('addTitle').value.trim();
    const author = document.getElementById('addAuthor').value.trim();
    const category = document.getElementById('addCategory').value.trim();
    const isbn = document.getElementById('addIsbn')?.value.trim() || '';
    const totalCopies = parseInt(document.getElementById('addTotalCopies')?.value, 10) || 1;
    const quantity = parseInt(document.getElementById('addQuantity').value, 10);
    const rawImageUrl = document.getElementById('addImageUrl')?.value.trim() || '';
    const imageUrl = cleanImageUrl(rawImageUrl) || '/images/covers/default-cover.svg';
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
        updateCoverPreviewLive('', 'addCoverPreview', 'addCoverStatus');
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
        updateCoverPreviewLive(book.imageUrl || '', 'editCoverPreview', 'editCoverStatus');
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
    const rawImageUrl = document.getElementById('editImageUrl')?.value.trim() || '';
    const imageUrl = cleanImageUrl(rawImageUrl);
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
    if (!confirm(`Are you sure you want to permanently delete book "${title}" (ID: #${id})?`)) {
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

// -------------------------------------------------------------
// Admin Student Records & Filtering
// -------------------------------------------------------------
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
    const roleFilter = document.getElementById('adminStudentRoleFilter')?.value || 'ALL';
    const loanFilter = document.getElementById('adminStudentLoanFilter')?.value || 'ALL';

    const filtered = adminStudentsCache.filter(s => {
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const mobile = String(s.mobile || '');
        const idStr = String(s.id || '');

        const matchesTerm = !term ||
            name.includes(term) ||
            email.includes(term) ||
            mobile.includes(term) ||
            idStr.includes(term);

        const matchesRole = (roleFilter === 'ALL') || (s.role === roleFilter);

        let matchesLoan = true;
        if (loanFilter === 'ACTIVE') matchesLoan = (s.activeIssuesCount > 0);
        else if (loanFilter === 'NONE') matchesLoan = (!s.activeIssuesCount || s.activeIssuesCount === 0);

        return matchesTerm && matchesRole && matchesLoan;
    });

    const countElem = document.getElementById('adminStudentsCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${adminStudentsCache.length} users`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#94a3b8;">No registered accounts match your filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td><strong>#${s.id}</strong></td>
            <td>
                <div style="display:flex;align-items:center;gap:0.6rem;">
                    <div class="user-avatar-circle">${escapeHtml(s.name.charAt(0).toUpperCase())}</div>
                    <strong>${escapeHtml(s.name)}</strong>
                </div>
            </td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.mobile)}</td>
            <td><span class="badge badge-category">${s.role}</span></td>
            <td>
                <span class="badge ${s.activeIssuesCount > 0 ? 'badge-issued' : 'badge-available'}">
                    ${s.activeIssuesCount || 0} Active (${s.totalIssuesCount || 0} Total)
                </span>
            </td>
        </tr>
    `).join('');
}

function resetAdminStudentFilters() {
    const sInput = document.getElementById('adminStudentSearch');
    if (sInput) sInput.value = '';
    const rSelect = document.getElementById('adminStudentRoleFilter');
    if (rSelect) rSelect.value = 'ALL';
    const lSelect = document.getElementById('adminStudentLoanFilter');
    if (lSelect) lSelect.value = 'ALL';
    filterAdminStudents();
}

// -------------------------------------------------------------
// Admin Transactions Engine & Filters
// -------------------------------------------------------------
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
        const uName = (t.userName || '').toLowerCase();
        const bTitle = (t.bookTitle || '').toLowerCase();
        const uEmail = (t.userEmail || '').toLowerCase();
        const idStr = String(t.id || '');

        const matchesTerm = !term ||
            uName.includes(term) ||
            bTitle.includes(term) ||
            uEmail.includes(term) ||
            idStr.includes(term);

        return matchesStatus && matchesTerm;
    });

    const countElem = document.getElementById('adminTransactionsCount');
    if (countElem) {
        countElem.textContent = `Showing ${filtered.length} of ${adminTransactionsCache.length} transactions`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:#94a3b8;">No issue/return transactions match your filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const coverUrl = getBookCoverUrl({ imageUrl: t.bookImageUrl });
        const title = escapeHtml(t.bookTitle);
        const cat = escapeHtml(t.bookCategory || 'General');
        const isIssued = t.status === 'ISSUED';
        const dueDate = t.dueDate || 'N/A';

        return `
            <tr>
                <td>
                    <div class="book-thumb-wrapper" onclick="openBookDetailsModal(${t.bookId})">
                        <img class="book-thumb-img" src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
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
                <td>${t.returnDate ? t.returnDate : '<span style="color:var(--text-muted);font-size:0.8rem;">Pending</span>'}</td>
                <td>
                    <span class="badge ${isIssued ? 'badge-issued' : 'badge-returned'}">
                        ${t.status}
                    </span>
                </td>
                <td>
                    ${isIssued
                        ? `<button class="btn btn-success btn-sm" onclick="openReturnBookModal(${t.id})">Process Return</button>`
                        : `<span style="color:#059669;font-size:0.8rem;font-weight:600;">✓ Done</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function resetAdminTransactionFilters() {
    const sInput = document.getElementById('transactionSearch');
    if (sInput) sInput.value = '';
    const statusSelect = document.getElementById('transactionStatusFilter');
    if (statusSelect) statusSelect.value = '';
    filterAdminTransactions();
}

function openReturnBookModal(transactionId) {
    const tx = adminTransactionsCache.find(t => t.id === transactionId);
    if (!tx) return;
    pendingReturnRecord = tx;

    const modalBody = document.getElementById('returnModalBody');
    if (!modalBody) return;

    const coverUrl = getBookCoverUrl({ imageUrl: tx.bookImageUrl });
    const title = escapeHtml(tx.bookTitle);
    const cat = escapeHtml(tx.bookCategory || 'General');

    modalBody.innerHTML = `
        <div class="action-confirm-box">
            <div class="action-confirm-cover">
                <img src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
            </div>
            <div class="action-confirm-info">
                <h4>${title}</h4>
                <p>Issued to: <strong>${escapeHtml(tx.userName)}</strong> (${escapeHtml(tx.userEmail)})</p>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin:0.25rem 0;">
                    <span class="badge badge-category">${cat}</span>
                    <span class="due-date-pill ok">Issued: ${tx.issueDate}</span>
                </div>
            </div>
        </div>
        <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.5;">
            Confirming this will mark the loan as returned and restore 1 physical copy back to available inventory.
        </p>
    `;

    openModal('returnBookModal');
}

async function confirmReturnBookAction() {
    if (!pendingReturnRecord) return;
    const tx = pendingReturnRecord;

    const btn = document.getElementById('confirmReturnBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processing...';
    }

    try {
        await apiRequest('/return', {
            method: 'POST',
            body: JSON.stringify({ id: tx.id })
        });
        showToast(`"${tx.bookTitle}" returned successfully!`, 'success');
        closeModal('returnBookModal');
        await refreshAdminAll();
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
    const percentAvail = Math.min(100, Math.round((availCopies / totalCopies) * 100));
    const desc = escapeHtml(book.description || 'Standard academic reference textbook used for curriculum studies and research.');

    modalBody.innerHTML = `
        <div class="book-details-layout">
            <div class="book-details-cover-container">
                <img class="book-details-cover-img" src="${escapeHtml(coverUrl)}" alt="${title}" referrerpolicy="no-referrer" onerror="handleCoverError(this, '${title.replace(/'/g, "\\'")}', '${cat.replace(/'/g, "\\'")}')">
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
                        <span class="meta-item-value" style="color:${availCopies > 0 ? '#10b981' : '#f43f5e'};">
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
                    <strong style="display:block;margin-bottom:0.3rem;color:var(--text-primary);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;">Academic Overview & Notes</strong>
                    ${desc}
                </div>
            </div>
        </div>
    `;

    // Dynamic Contextual Footer Actions
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
            <button type="button" class="btn btn-secondary" onclick="closeModal('bookDetailsModal');openQuickCoverModal(${book.id})">🖼️ Change Cover</button>
            <button type="button" class="btn btn-primary" onclick="closeModal('bookDetailsModal');openEditModal(${book.id})">Edit Details</button>
        `;
    } else {
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
// UI Navigation & Sorting Helpers
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
    if (!sel || !books) return;

    const currentVal = sel.value;
    const cats = Array.from(new Set(books.map(b => (b.category || '').trim()).filter(Boolean))).sort();

    sel.innerHTML = `<option value="">All Categories</option>` +
        cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

    if (cats.map(c => c.toLowerCase()).includes(currentVal.toLowerCase())) {
        sel.value = currentVal;
    }
}

function sortBookList(books, sortBy) {
    if (!books) return [];
    const list = [...books];
    switch (sortBy) {
        case 'title_asc':
            return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        case 'title_desc':
            return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        case 'copies_desc':
            return list.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
        case 'copies_asc':
            return list.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
        case 'id_desc':
            return list.sort((a, b) => (b.id || 0) - (a.id || 0));
        case 'id_asc':
            return list.sort((a, b) => (a.id || 0) - (b.id || 0));
        default:
            return list;
    }
}
