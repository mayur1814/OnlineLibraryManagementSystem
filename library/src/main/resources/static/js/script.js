const API_BASE = '';

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed (${response.status}).`);
    }

    if (response.status === 204) return null;
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json') ? response.json() : response.text();
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        localStorage.removeItem('user');
        return null;
    }
}

function requireUser(role) {
    const user = getCurrentUser();
    if (!user || (role && user.role !== role)) {
        window.location.replace('login.html');
        return null;
    }
    return user;
}

function addCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value == null ? '' : String(value);
    row.appendChild(cell);
    return cell;
}

function showTableMessage(tableBody, columnCount, message) {
    tableBody.replaceChildren();
    const row = document.createElement('tr');
    const cell = addCell(row, message);
    cell.colSpan = columnCount;
    tableBody.appendChild(row);
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const user = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        password: document.getElementById('password').value
    };

    try {
        await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify(user)
        });
        alert('Registration successful. Please log in.');
        window.location.href = 'login.html';
    } catch (error) {
        alert(error.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const credentials = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    try {
        const user = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = user.role === 'ADMIN' ? 'admin-dashboard.html' : 'student-dashboard.html';
    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    try {
        await apiRequest('/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

async function loadBooks(searchTerm = '') {
    const tableBody = document.getElementById('bookTableBody');
    if (!tableBody) return;

    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        const books = await apiRequest('/books');
        const term = searchTerm.trim().toLocaleLowerCase();
        const filteredBooks = books.filter(book =>
            `${book.title} ${book.author} ${book.category}`.toLocaleLowerCase().includes(term));
        tableBody.replaceChildren();

        if (filteredBooks.length === 0) {
            showTableMessage(tableBody, 7, 'No books found.');
            return;
        }

        filteredBooks.forEach(book => {
            const row = document.createElement('tr');
            addCell(row, book.id);
            addCell(row, book.title);
            addCell(row, book.author);
            addCell(row, book.category);
            addCell(row, book.quantity);
            addCell(row, book.status);
            const actionCell = document.createElement('td');
            if (book.quantity > 0) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = 'Issue';
                button.addEventListener('click', () => issueBook(book.id));
                actionCell.appendChild(button);
            } else {
                actionCell.textContent = 'Unavailable';
            }
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        showTableMessage(tableBody, 7, `Could not load books: ${error.message}`);
    }
}

async function issueBook(bookId) {
    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        await apiRequest('/issue', {
            method: 'POST',
            body: JSON.stringify({ bookId, userId: user.id })
        });
        alert('Book issued successfully.');
        await Promise.all([
            loadBooks(document.getElementById('searchInput')?.value || ''),
            loadStudentIssuedBooks()
        ]);
    } catch (error) {
        alert(error.message);
    }
}

async function loadStudentIssuedBooks() {
    const tableBody = document.getElementById('issuedTableBody');
    if (!tableBody) return;

    const user = requireUser('STUDENT');
    if (!user) return;

    try {
        const [records, books] = await Promise.all([
            apiRequest(`/issue/user/${encodeURIComponent(user.id)}`),
            apiRequest('/books')
        ]);
        const titles = new Map(books.map(book => [book.id, book.title]));
        tableBody.replaceChildren();

        if (records.length === 0) {
            showTableMessage(tableBody, 5, 'You have no issued books.');
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            addCell(row, record.id);
            addCell(row, titles.get(record.bookId) || 'Book no longer available');
            addCell(row, record.issueDate);
            addCell(row, record.status);
            const actionCell = document.createElement('td');
            if (record.status === 'ISSUED') {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = 'Return';
                button.addEventListener('click', () => returnBook(record.id));
                actionCell.appendChild(button);
            }
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        showTableMessage(tableBody, 5, `Could not load issued books: ${error.message}`);
    }
}

async function returnBook(issueId) {
    try {
        await apiRequest('/return', {
            method: 'POST',
            body: JSON.stringify({ id: issueId })
        });
        alert('Book returned successfully.');
        await Promise.all([loadBooks(), loadStudentIssuedBooks()]);
    } catch (error) {
        alert(error.message);
    }
}

async function loadAdminBooks() {
    const tableBody = document.getElementById('adminBookTableBody');
    if (!tableBody) return;
    if (!requireUser('ADMIN')) return;

    try {
        const books = await apiRequest('/books');
        tableBody.replaceChildren();
        if (books.length === 0) {
            showTableMessage(tableBody, 5, 'No books in the library yet.');
            return;
        }

        books.forEach(book => {
            const row = document.createElement('tr');
            addCell(row, book.id);
            addCell(row, book.title);
            addCell(row, book.author);
            addCell(row, book.quantity);
            const actionCell = document.createElement('td');
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Delete';
            button.addEventListener('click', () => deleteBook(book.id));
            actionCell.appendChild(button);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });
    } catch (error) {
        showTableMessage(tableBody, 5, `Could not load books: ${error.message}`);
    }
}

async function handleAddBook(event) {
    event.preventDefault();
    if (!requireUser('ADMIN')) return;

    const book = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        category: document.getElementById('bookCategory').value.trim(),
        quantity: Number(document.getElementById('bookQuantity').value)
    };

    try {
        await apiRequest('/books', {
            method: 'POST',
            body: JSON.stringify(book)
        });
        alert('Book added successfully.');
        document.getElementById('addBookForm').reset();
        await loadAdminBooks();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteBook(bookId) {
    if (!requireUser('ADMIN') || !confirm('Are you sure you want to delete this book?')) return;

    try {
        await apiRequest(`/books/${encodeURIComponent(bookId)}`, { method: 'DELETE' });
        await loadAdminBooks();
    } catch (error) {
        alert(error.message);
    }
}
