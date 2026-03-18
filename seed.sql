
-- UCC Knowledge Hub Sample Data


-- USERS
INSERT INTO users (school_id, fullname, email, password_hash)
VALUES
('620001', 'John Brown', 'john.brown@stu.ucc.edu.jm', 'hashed_password_1'),
('620002', 'Jack Smith', 'jack.smith@stu.ucc.edu.jm', 'hashed_password_2'),
('620003', 'Sarah Wilson', 'librarian01@ucc.edu.jm', 'hashed_password_3'),
('620004', 'Admin User', 'admin@ucc.edu.jm', 'hashed_password_4');

-- Books
INSERT INTO books (title, author, description, isbn, published_date)
VALUES
('Management Information Systems', 'Kenneth C. Laudon & Jane P. Laudon', 'Covers MIS fundamentals', '9781292403571', '2022-05-05'),
('1984', 'George Orwell', 'Dystopian novel', '9780451524935', '1949-06-08'),
('Fluent Python', 'Luciano Ramalho', 'Advanced Python programming', '9781491946008', '2015-08-21'),
('Introduction to Algorithms', 'Thomas H. Cormen', 'Algorithms textbook', '9780262033848', '2009-07-31'),
('Clean Code', 'Robert C. Martin', 'Code quality and best practices', '9780132350884', '2008-08-01');

-- Bookmarks
INSERT INTO bookmarks (user_id, book_id)
VALUES
(1, 1),
(1, 3),
(2, 2),
(2, 4);

-- Reviews
INSERT INTO reviews (user_id, book_id, rating, content)
VALUES
(1, 1, 5, 'Very informative and well-structured.'),
(1, 3, 4, 'Good Python techniques, but some chapters are dense.'),
(2, 2, 5, 'Classic novel, highly recommended.'),
(2, 4, 4, 'Great algorithms coverage, a bit heavy.');

-- Events
INSERT INTO events (title, description, event_date)
VALUES
('Python Workshop', 'Hands-on Python coding for students', '2026-03-20 10:00:00'),
('Library Orientation', 'Learn to use UCC library resources', '2026-03-18 14:00:00');

-- Notifications
INSERT INTO notifications (user_id, message)
VALUES
(1, 'Your book "1984" is due in 3 days.'),
(2, 'Your reservation for "Fluent Python" is ready for pickup.');

-- Curated Lists
INSERT INTO curated_lists (title, description)
VALUES
('Top Computer Science Books', 'Essential reading for CS students'),
('Business & IT Essentials', 'Recommended books for Business students'),
('Popular Books', 'Most borrowed books');

-- Forum Threads
INSERT INTO forum_threads (user_id, title, content)
VALUES
(1, 'Best Study Resources for Python', 'Hi everyone, what resources do you recommend for learning Python effectively?'),
(2, 'Library Hours During Holidays', 'Can anyone confirm library opening hours for Easter break?');

-- Forum Replies
INSERT INTO forum_replies (thread_id, user_id, content)
VALUES
(1, 2, 'I suggest "Fluent Python" and online tutorials on RealPython.com'),
(1, 3, 'We also have workshops every month in the library.'),
(2, 1, 'Library will be open 9am-5pm from Mon-Fri.');
