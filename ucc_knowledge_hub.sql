-- UCC Knowledge Hub PostgreSQL Setup

-- Enable UUID generation (for IDs if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables

-- Departments
CREATE TABLE departments (
    department_id VARCHAR(10) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Majors
CREATE TABLE student_majors (
    major_id VARCHAR(10) PRIMARY KEY,
    major_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(10) REFERENCES departments(department_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(40) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15),
    membership_date DATE NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('Student','Librarian','Admin')) DEFAULT 'Student',
    account_status VARCHAR(20) CHECK (account_status IN ('Active','Suspended','Inactive')) DEFAULT 'Active',
    major_id VARCHAR(10) REFERENCES student_majors(major_id),
    department_id VARCHAR(10) REFERENCES departments(department_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books
CREATE TABLE books (
    book_id VARCHAR(30) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(30) NOT NULL,
    subject_of_resource VARCHAR(50) NOT NULL,
    format_of_resource VARCHAR(20) CHECK (format_of_resource IN ('Print','E-book','Audiobook','Journal')) DEFAULT 'Print',
    genre_of_resource VARCHAR(50),
    publication_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    location VARCHAR(50),
    description_of_resource TEXT,
    cover_image_url VARCHAR(255),
    access_type VARCHAR(20) CHECK (access_type IN ('Physical','Digital','Hybrid')) DEFAULT 'Physical',
    digital_access_url VARCHAR(255),
    pdf_available BOOLEAN DEFAULT FALSE,
    department_recommendations TEXT,
    total_borrowed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans
CREATE TABLE loans (
    loan_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    checkout_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    renewal_count INT DEFAULT 0,
    loan_status VARCHAR(20) CHECK (loan_status IN ('Active','Returned','Overdue')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines
CREATE TABLE fines (
    fine_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id),
    loan_id VARCHAR(30) REFERENCES loans(loan_id),
    fine_amount NUMERIC(8,2) NOT NULL,
    reason_for_fine VARCHAR(20) CHECK (reason_for_fine IN ('Overdue','Damaged','Lost')) DEFAULT 'Overdue',
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    fine_status VARCHAR(20) CHECK (fine_status IN ('Outstanding','Paid','Waived')) DEFAULT 'Outstanding',
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reservations
CREATE TABLE reservations (
    reservation_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    reservation_status VARCHAR(20) CHECK (reservation_status IN ('Pending','Ready','Cancelled','Expired')) DEFAULT 'Pending',
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    payment_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    fine_id VARCHAR(30) REFERENCES fines(fine_id) ON DELETE SET NULL,
    amount NUMERIC(8,2) NOT NULL,
    payment_method VARCHAR(20) CHECK (payment_method IN ('Credit Card','Debit Card','PayPal','Stripe','Payoneer')),
    transaction_id VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending','completed','failed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    notification_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('Due_date','Overdue','Reservation','Event','General')) DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(10) CHECK (priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    action_url VARCHAR(255)
);

-- Digital Cards
CREATE TABLE digital_cards (
    card_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    qr_code_url VARCHAR(255),
    barcode_number VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading Lists
CREATE TABLE reading_lists (
    list_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    list_name VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookmarks
CREATE TABLE bookmarks (
    bookmark_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id),
    book_id VARCHAR(30) REFERENCES books(book_id),
    list_id VARCHAR(20) REFERENCES reading_lists(list_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id, list_id)
);

-- Reviews
CREATE TABLE reviews (
    review_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(user_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    review_date DATE NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Curated Book Lists
CREATE TABLE curated_book_lists (
    list_id VARCHAR(30) PRIMARY KEY,
    list_name VARCHAR(100) NOT NULL,
    list_type VARCHAR(20) CHECK (list_type IN ('Major','Department','Popular','New_Arrivals','Recommended')),
    target_department_id VARCHAR(10) REFERENCES departments(department_id),
    target_major_id VARCHAR(10) REFERENCES student_majors(major_id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(20) REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curated Book Items
CREATE TABLE curated_book_items (
    curated_list_id VARCHAR(30) REFERENCES curated_book_lists(list_id) ON DELETE CASCADE,
    book_id VARCHAR(30) REFERENCES books(book_id) ON DELETE CASCADE,
    position INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (curated_list_id, book_id)
);

-- Views

-- Student Fines Summary
CREATE OR REPLACE VIEW student_fines_summary AS
SELECT u.user_id, u.first_name, u.last_name, SUM(f.fine_amount) AS total_fines,
       SUM(CASE WHEN f.fine_status='Paid' THEN f.fine_amount ELSE 0 END) AS paid_fines,
       SUM(CASE WHEN f.fine_status='Outstanding' THEN f.fine_amount ELSE 0 END) AS outstanding_fines
FROM users u
LEFT JOIN fines f ON u.user_id = f.user_id
GROUP BY u.user_id, u.first_name, u.last_name;

-- Book Availability View
CREATE OR REPLACE VIEW book_availability_view AS
SELECT b.book_id, b.title, b.total_copies, b.available_copies,
       CASE WHEN b.available_copies>0 THEN 'Available' ELSE 'Not Available' END AS availability_status
FROM books b;

-- Department Popular Books
CREATE OR REPLACE VIEW department_popular_books AS
SELECT d.department_id, d.department_name, b.book_id, b.title, b.total_borrowed_count
FROM books b
JOIN users u ON u.department_id=d.department_id
JOIN departments d ON u.department_id=d.department_id
ORDER BY b.total_borrowed_count DESC;

-- Functions

-- Calculate fine amount
CREATE OR REPLACE FUNCTION calculate_fine_amount(loanId VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
    due DATE;
    returned DATE;
    days_overdue INT;
    fine NUMERIC(8,2);
BEGIN
    SELECT due_date, return_date INTO due, returned
    FROM loans WHERE loan_id=loanId;

    IF returned IS NULL THEN
        returned := CURRENT_DATE;
    END IF;

    days_overdue := GREATEST(0, returned - due);
    fine := days_overdue * 50; -- 50 JMD per day
    RETURN fine;
END;
$$ LANGUAGE plpgsql;

-- Check Book Availability
CREATE OR REPLACE FUNCTION check_book_availability(bookId VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    avail INT;
BEGIN
    SELECT available_copies INTO avail FROM books WHERE book_id=bookId;
    RETURN avail>0;
END;
$$ LANGUAGE plpgsql;

-- Update Daily Fines for Overdue Loans
CREATE OR REPLACE FUNCTION update_daily_fines()
RETURNS VOID AS $$
DECLARE
    l RECORD;
    f_id VARCHAR;
    amt NUMERIC(8,2);
BEGIN
    FOR l IN SELECT * FROM loans WHERE loan_status='Overdue'
    LOOP
        amt := calculate_fine_amount(l.loan_id);
        SELECT fine_id INTO f_id FROM fines WHERE loan_id=l.loan_id;
        IF f_id IS NULL THEN
            INSERT INTO fines(fine_id, user_id, loan_id, fine_amount, issued_date, due_date)
            VALUES (gen_random_uuid()::text, l.user_id, l.loan_id, amt, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');
        ELSE
            UPDATE fines SET fine_amount=amt WHERE fine_id=f_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sample Data

-- Departments
INSERT INTO departments(department_id, department_name, faculty)
VALUES ('CS','Computer Science','Science'), ('ENG','Engineering','Engineering');

-- Majors
INSERT INTO student_majors(major_id, major_name, department_id)
VALUES ('CS101','Software Engineering','CS'), ('ENG101','Mechanical Engineering','ENG');

-- Users
INSERT INTO users(user_id, username, email, password_hash, first_name, last_name, membership_date, user_type, major_id, department_id)
VALUES ('U001','dylon','dylon@example.com','hashedpassword','Dylon','Smith',CURRENT_DATE,'Student','CS101','CS'),
       ('U002','librarian1','lib1@example.com','hashedpassword','Libby','Jones',CURRENT_DATE,'Librarian',NULL,'CS');

-- Books
INSERT INTO books(book_id, title, author, isbn, subject_of_resource, publication_date, total_copies, available_copies)
VALUES ('B001','Intro to Python','John Doe','1234567890','Programming',CURRENT_DATE,5,5),
       ('B002','Advanced Networking','Jane Roe','0987654321','Networking',CURRENT_DATE,3,3);

-- Curated Lists
INSERT INTO curated_book_lists(list_id, list_name, list_type, created_by)
VALUES ('CL001','CS Essentials','Major','U002');

-- Curated Items
INSERT INTO curated_book_items(curated_list_id, book_id, position)
VALUES ('CL001','B001',1), ('CL001','B002',2);

-- Loans
INSERT INTO loans(loan_id, user_id, book_id, checkout_date, due_date)
VALUES ('L001','U001','B001',CURRENT_DATE-10,CURRENT_DATE-3);
