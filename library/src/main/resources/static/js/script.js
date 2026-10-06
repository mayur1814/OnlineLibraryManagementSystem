// Load Student's Issued Books (for Student Dashboard)
async function loadStudentIssuedBooks() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        // Assuming an endpoint exists or filtering transactions by user ID
        const response = await fetch(`${API_BASE}/issue/user/${user.id}`);
        if (response.ok) {
            const issuedBooks = await response.json();
            const issuedTableBody = document.getElementById('issuedTableBody');
            if (!issuedTableBody) return;

            issuedTableBody.innerHTML = '';
            issuedBooksforEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.id}</td>
                    <td>${record.bookTitle || record.book.title}</td>
                    <td>${record.issueDate}</td>
                    <td>${record.status}</td>
                    <td><button onclick="returnBook(${record.id})" style="background: #e74c3c;">Return</button></td>
                `;
                issuedTableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading issued books:", error);
    }
}

// Return Book Function
async function returnBook(issueId) {
    try {
        const response = await fetch(`${API_BASE}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: issueId })
        });

        if (response.ok) {
            alert("Book returned successfully!");
            loadBooks();
            loadStudentIssuedBooks();
        } else {
            alert("Failed to return the book.");
        }
    } catch (error) {
        console.error("Error during return:", error);
    }
}

// Admin: Load Books for Management (Update/Delete)
async function loadAdminBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`);
        if (response.ok) {
            const books = await response.json();
            const adminBookTable = document.getElementById('adminBookTableBody');
            if (!adminBookTable) return;

            adminBookTable.innerHTML = '';
            books.forEach(book => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.quantity}</td>
                    <td>
                        <button onclick="deleteBook(${book.id})" style="background: #e74c3c; padding: 0.4rem 0.8rem;">Delete</button>
                    </td>
                `;
                adminBookTable.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading admin books:", error);
    }
}

// Admin: Delete Book
async function deleteBook(bookId) {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert("Book deleted successfully!");
            loadAdminBooks();
        } else {
            alert("Failed to delete book.");
        }
    } catch (error) {
        console.error("Error deleting book:", error);
    }
}