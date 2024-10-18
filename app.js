const express = require('express');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');
const db = require('./database/db'); // Your database setup file
const XLSX = require('xlsx');
const app = express();

// Middleware to handle form data (for POST requests)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the folder for static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Set the views folder and template engine (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express session configuration
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
}));

// Make user available in all templates.
app.use((req, res, next) => {
    res.locals.user = req.user || null;  // Make user available in all templates
    next();
});


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect-flash middleware for flashing messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Passport Local Strategy for authentication
passport.use(new LocalStrategy((username, password, done) => {
    // Query the user from the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return done(err);
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        // Compare password with hashed password in the database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        });
    });
}));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
// passport.deserializeUser((id, done) => {
//     db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
//         done(err, user);
//     });
// });
passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false); // Return false if the user is not found
        }
        done(null, user);
    });
});


// Route for homepage
app.get('/', (req, res) => {
    res.render('home'); // This will render home.ejs
});

// Route for the form page
app.get('/form', (req, res) => {
    res.render('index'); // This will render index.ejs (the form page)
});

// Route to handle form submission
app.post('/submit', (req, res) => {
    const { date, time_of_arrival, company, badge, name, age, gender, incident, complaints, mobility, respiratory_rate, pulse, blood_pressure, temperature, avpu, oxygen_saturation, glucose, pain_score, final_triage, detained, treatment_given, disposition, disposition_time, reporting } = req.body;

    db.run(
        'INSERT INTO daily_records (date, time_of_arrival, company, badge, name, age, gender, incident, complaints, mobility, respiratory_rate, pulse, blood_pressure, temperature, avpu, oxygen_saturation, glucose, pain_score, final_triage, detained, treatment_given, disposition, disposition_time, reporting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [date, time_of_arrival, company, badge, name, age, gender, incident, complaints, mobility, respiratory_rate, pulse, blood_pressure, temperature, avpu, oxygen_saturation, glucose, pain_score, final_triage, detained, treatment_given, disposition, disposition_time, reporting], 
        (err) => {
            if (err) {
                console.error('Error saving record:', err.message);
                return res.render('error', { title: 'Error', errorMessage: 'Failed to save the record. Please try again.' });
            } else {
                res.render('success', { title: 'Submission Successful' });
            }
        }
    );
});

// Route for user registration
app.get('/register', (req, res) => {
    res.render('register', {errors: [] })
    });;
app.post('/register', (req, res) => {
    const { username, password, password2 } = req.body;
    let errors = [];

    // Validate form input
    if (!username || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors });
    } else {
        // Check if user exists
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
            if (user) {
                errors.push({ msg: 'Username already exists' });
                res.render('register', { errors });
            } else {
                // Hash password
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) throw err;

                        // Insert new user into database
                        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
                            if (err) throw err;
                            req.flash('success_msg', 'You are registered and can log in');
                            res.redirect('/login');
                        });
                    });
                });
            }
        });
    }
});

// Route for login

// Working below
// app.get('/login', (req, res) => res.render('login'));
// app.post('/login', passport.authenticate('local', {
//     successRedirect: '/dashboard',
//     failureRedirect: '/login',
//     failureFlash: true
// }));
// New below
// app.post('/login', (req, res, next) => {
//     passport.authenticate('local', (err, user, info) => {
//       if (err) {
//         return next(err); // Handle any unexpected errors
//       }
//       if (!user) {
//         // If user is not authenticated, show the failure message (info) from Passport
//         return res.render('login', { errors: [{ msg: info.message || 'Invalid credentials' }] });
//       }
  
//       // Check if the user is approved, pending, or blocked
//       if (user.status === 'pending') {
//         return res.render('login', { errors: [{ msg: 'Your account is pending approval.' }] });
//       } else if (user.status === 'blocked') {
//         return res.render('login', { errors: [{ msg: 'Your account has been blocked.' }] });
//       }
  
//       // If the user is approved, log them in and redirect to dashboard
//       req.logIn(user, (err) => {
//         if (err) {
//           return next(err); // Handle unexpected login errors
//         }
//         return res.redirect('/dashboard'); // Success: redirect to dashboard
//       });
//     })(req, res, next);
//   });
// Login form route (GET)
app.get('/login', (req, res) => {
    res.render('login');
});

// Login form submission (POST)
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { errors: [{ msg: info.message || 'Invalid credentials' }] });
        }
        if (user.status === 'pending') {
            return res.render('login', { errors: [{ msg: 'Your account is pending approval.' }] });
        } else if (user.status === 'blocked') {
            return res.render('login', { errors: [{ msg: 'Your account has been blocked.' }] });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

  

//   Route to display/approve all users

// Restrict access to the admin panel for all routes starting with /admin
app.use('/admin', (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
});

// Route to display all users in the admin panel
app.get('/admin/users', (req, res) => {
    db.all('SELECT * FROM users', (err, users) => {
        if (err) {
            return res.render('admin-users', { errorMessage: 'Error fetching users', users: [] });
        }
        res.render('admin-users', { users });
    });
});

// Route to approve a user
app.get('/admin/approve/:id', (req, res) => {
    const userId = req.params.id;
    db.run('UPDATE users SET status = ? WHERE id = ?', ['approved', userId], (err) => {
        if (err) {
            return res.render('admin-users', { errorMessage: 'Error approving user', users: [] });
        }
        res.redirect('/admin/users');
    });
});

// Route to block a user
app.get('/admin/block/:id', (req, res) => {
    const userId = req.params.id;
    db.run('UPDATE users SET status = ? WHERE id = ?', ['blocked', userId], (err) => {
        if (err) {
            return res.render('admin-users', { errorMessage: 'Error blocking user', users: [] });
        }
        res.redirect('/admin/users');
    });
});

// Route to unblock a user
app.get('/admin/unblock/:id', (req, res) => {
    const userId = req.params.id;
    db.run('UPDATE users SET status = ? WHERE id = ?', ['approved', userId], (err) => {
        if (err) {
            return res.render('admin-users', { errorMessage: 'Error unblocking user', users: [] });
        }
        res.redirect('/admin/users');
    });
});

// Adding "failureFlash" Back (Optional)
// app.post('/login', passport.authenticate('local', {
//     successRedirect: '/dashboard',
//     failureRedirect: '/login',
//     failureFlash: true
// }));



// Route for logout
// app.get('/logout', (req, res) => {
//     req.logout(function(err) {
//         if (err) { return next(err); }
//         req.flash('success_msg', 'You are logged out');
//         res.redirect('/login');
//     });
// });
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/login');
    });
});



// Route to display records
app.get('/records', ensureAuthenticated, (req, res) => {
    db.all('SELECT * FROM daily_records', (err, rows) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            res.send('Failed to retrieve records.');
        } else {
            res.render('records', { records: rows });
        }
    });
});

// Dashboard route (requires login)
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.user });
});

// Ensure authenticated middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/login');
}

// Route to delete a record
app.get('/delete/:id', ensureAuthenticated, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM daily_records WHERE id = ?', id, (err) => {
        if (err) {
            console.error('Error deleting record:', err.message);
        }
        res.redirect('/records');
    });
});

// Route to export records to Excel
app.get('/export', ensureAuthenticated, (req, res) => {
    db.all('SELECT * FROM daily_records', (err, rows) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            return res.status(500).send('Error retrieving records');
        }

        if (rows.length === 0) {
            return res.status(404).send('No records found to export');
        }

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Records');
            const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            res.setHeader('Content-Disposition', 'attachment; filename="daily_records.xlsx"');
            res.send(buffer);
        } catch (error) {
            console.error('Error exporting to Excel:', error.message);
            return res.status(500).send('Error exporting records to Excel');
        }
    });
});

// Route for the admin page (only for authenticated users)
app.get('/admin', ensureAuthenticated, (req, res) => {
    db.all('SELECT * FROM daily_records', (err, rows) => {
        if (err) {
            console.error('Error fetching records:', err.message);
            res.send('Failed to retrieve records.');
        } else {
            res.render('admin', { records: rows });
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Catch-all route for undefined pages (404 error)
app.use((req, res) => {
    res.status(404).render('error'); // Render the error page if the route is not found
});
