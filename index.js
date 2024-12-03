let express = require('express');
let app = express();
let path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 3000
// grab html form from file 
// allows to pull JSON data from form 
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));
app.use(express.urlencoded( {extended: true} )); 
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(ejsLayouts); // Use layouts middleware
// Set custom directory for layouts
app.set('layout', path.join(__dirname, 'views/layouts/adminLayout'));


const knex = require("knex") ({
  client : "pg",
  connection : {
  host : process.env.RDS_HOSTNAME || "awseb-e-ypkcf5xizp-stack-awsebrdsdatabase-hdqch4trssrm.c7kgaykw042g.us-east-2.rds.amazonaws.com",
  user : process.env.RDS_USERNAME || "sudosudo",
  password : process.env.RDS_PASSWORD || "ISAdmins",
  database : process.env.RDS_DB_NAME || "ebdb",
  port : process.env.RDS_PORT || 5432,
  ssl:  {rejectUnauthorized: false}
}
})



// Define route for home page

// Serve the external page (external.ejs)
app.get('/', (req, res) => {
  res.render('public_views/publicHome', {
    layout: false });  // Renders external.ejs from public_views folder
});

// Serve the login page (login.ejs)
app.get('/login', (req, res) => {
  res.render('admin_Views/login');  // Renders login.ejs from admin_Views folder
});

// *** --------------------------------- ADMIN ONLY Routes --------------------------------***

// Login Route
app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  try {
      // Query the user table to find the record
      const user = await knex('user')
          .select('*')
          .where({ username, password }) // Replace with hashed password comparison in production
          .first(); // Returns the first matching record
          
      if (user) {
          security = true;
          res.redirect("/admin");  // Redirect to admin page on success
      } else {
          security = false;
          res.render('admin_Views/login', { error: 'Invalid username or password' });
      }
  } catch (error) {
      console.error('Database error:', error);
      res.render('admin_Views/login', { error: 'An error occurred. Please try again.' });
  }
});

// Admin Home Page
app.get('/adminHome', (req, res) => {
  res.render("admin_Views/adminHome", {
    title: 'Admin Home',
    navItems: [],
    layout: 'layouts/adminLayout'});  // Use the admin layout for this route
});

// User Maintenance Page
app.get('/users', async (req, res) => {
  try {
    // Fetch users from the 'users' table
    const users = await knex('contact_info').select(); // Adjust field names as needed

    // Render the users page and pass the users data to the view
    res.render("admin_Views/users", {
      title: 'Manage Users',
      navItems: [],
      layout: 'layouts/adminLayout', // Use the admin layout for this route
      users: users // Pass the users data to the view
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving users");
  }
});

// Volunteers Page
app.get('/volunteers', (req, res) => {
  res.render("admin_Views/volunteers", {
    title: 'Manage Volunteers',
    navItems: [],
    layout: 'layouts/adminLayout'  // Use the admin layout for this route
  });
});

// Events Page
app.get('/events', (req, res) => {
  res.render("admin_Views/events", {
    title: 'Manage Events',
    navItems: [],  // You can add navigation items here if needed
    layout: 'layouts/adminLayout'  // Use the admin layout for this route
  });
});

// FAQs Page
app.get('/faqs', (req, res) => {
  res.render("admin_Views/FAQs", {
    title: 'Manage FAQs',
    navItems: [],  // You can add navigation items here if needed
    layout: 'layouts/adminLayout'  // Use the admin layout for this route
  });
});

// Trainings Page
app.get('/trainings', (req, res) => {
  res.render("admin_Views/trainings", {
    title: 'Manage Trainings',
    navItems: [],  // You can add navigation items here if needed
    layout: 'layouts/adminLayout'  // Use the admin layout for this route
  });
});



// *** --------------------------------- PUBLIC Routes --------------------------------***


// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));


// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));