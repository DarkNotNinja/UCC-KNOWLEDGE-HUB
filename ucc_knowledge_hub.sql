-- UCC Knowledge Hub - PostgreSQL Database Setup

-- Create and connect to the database
CREATE DATABASE ucc_knowledge_hub;
\c ucc_knowledge_hub;

-- USERS TABLE
CREATE TABLE users (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15),
    membership_date DATE NOT NULL,
    user_type TEXT CHECK (user_type IN ('Student', 'Librarian', 'Admin')) DEFAULT 'Student',
    account_status TEXT CHECK (account_status IN ('Active', 'Suspended', 'Inactive')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKS TABLE
CREATE TABLE books (
    book_id VARCHAR(30) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(30) NOT NULL,
    subject_of_resource VARCHAR(50) NOT NULL,
    format_of_resource TEXT CHECK (format_of_resource IN ('Print', 'E-book', 'Audiobook', 'Journal')) DEFAULT 'Print',
    genre_of_resource VARCHAR(50),
    publication_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    location VARCHAR(50),
    description_of_resource TEXT,
    cover_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOANS TABLE
CREATE TABLE loans (
    loan_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    checkout_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    renewal_count INT DEFAULT 0,
    loan_status TEXT CHECK (loan_status IN ('Active', 'Returned', 'Overdue')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_book_id ON loans(book_id);
CREATE INDEX idx_loans_due_date ON loans(due_date);

-- RESERVATIONS TABLE
CREATE TABLE reservations (
    reservation_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    reservation_status TEXT CHECK (reservation_status IN ('Pending', 'Ready', 'Cancelled', 'Expired')) DEFAULT 'Pending',
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FINES TABLE
CREATE TABLE fines (
    fine_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES users(user_id) ON DELETE CASCADE,
    loan_id VARCHAR(30) REFERENCES loans(loan_id) ON DELETE SET NULL,
    fine_amount DECIMAL(8,2) NOT NULL,
    reason_for_fine TEXT CHECK (reason_for_fine IN ('Overdue', 'Damaged', 'Lost')) DEFAULT 'Overdue',
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    fine_status TEXT CHECK (fine_status IN ('Outstanding', 'Paid', 'Waived')) DEFAULT 'Outstanding',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    payment_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    fine_id VARCHAR(20) REFERENCES fines(fine_id) ON DELETE SET NULL,
    amount DECIMAL(8,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('Credit Card', 'Debit Card', 'PayPal', 'Stripe', 'Payoneer')),
    transaction_id VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DIGITAL CARDS
CREATE TABLE digital_cards (
    card_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    qr_code_url VARCHAR(255),
    barcode_number VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- READING LISTS
CREATE TABLE reading_lists (
    list_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    list_name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOOKMARKS
CREATE TABLE bookmarks (
    bookmark_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(20) REFERENCES books(book_id) ON DELETE CASCADE,
    list_id VARCHAR(20) REFERENCES reading_lists(list_id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, book_id, list_id)
);

-- REVIEWS
CREATE TABLE reviews (
    review_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(20) REFERENCES books(book_id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date DATE NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, book_id)
);

-- EVENTS
CREATE TABLE library_events (
    event_id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(100),
    event_type TEXT CHECK (event_type IN ('Workshop', 'Seminar', 'Exhibition', 'Meeting')) DEFAULT 'Workshop',
    max_attendees INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EVENT REGISTRATIONS
CREATE TABLE event_registrations (
    registration_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    event_id VARCHAR(20) REFERENCES library_events(event_id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('Registered', 'Attended', 'Cancelled')) DEFAULT 'Registered',
    UNIQUE (user_id, event_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    notification_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT CHECK (notification_type IN ('Due_date', 'Overdue', 'Reservation', 'Event', 'General')) DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SAMPLE DATA
INSERT INTO users (user_id, username, email, password_hash, first_name, last_name, phone_number, membership_date, user_type)
VALUES 
('UCC001', 'john_brown', 'john.brown@stu.ucc.edu.jm', 'hashed_password_1', 'John', 'Brown', '5550101', '2023-01-15', 'Student'),
('UCC002', 'jack_smith', 'jack.smith@stu.ucc.edu.jm', 'hashed_password_2', 'Jack', 'Smith', '5890102', '2024-02-20', 'Student'),
('UCC003', 'admin_lib', 'librarian01@ucc.edu.jm', 'hashed_password_3', 'Sarah', 'Wilson', '3450103', '2020-05-10', 'Librarian')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO books (book_id, title, author, isbn, subject_of_resource, genre_of_resource, format_of_resource, publication_date, total_copies, available_copies, is_available)
VALUES
('B001', 'Management Information Systems', 'Kenneth C. Laudon & Jane P. Laudon', '978-1-292-40357-1', 'IT', 'Non-Fiction', 'E-book', '2022-05-05', 13, 4, TRUE),
('B005', '1984', 'George Orwell', '978-0451524935', 'Dystopian', 'Fiction', 'Print', '1949-06-08', 5, 3, TRUE),
('B008', 'Fluent Python', 'Luciano Ramalho', '978-1-491-94600-8', 'Programming', 'Non-Fiction', 'Print', '2015-08-21', 20, 15, TRUE)
ON CONFLICT (book_id) DO NOTHING;
