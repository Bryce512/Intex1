let express = require('express');
let app = express();
let path = require('path');
const PORT = process.env.PORT || 3000
// grab html form from file 
// allows to pull JSON data from form 
app.use(express.urlencoded( {extended: true} )); 

const knex = require("knex") ({
  client : "pg",
  connection : {
  host : process.env.RDS_HOSTNAME || "awseb-e-jscipcpyz9-stack-awsebrdsdatabase-roat50cnm4ii.c7kgaykw042g.us-east-2.rds.amazonaws.com",
  user : process.env.RDS_USERNAME || "dev-admins",
  password : process.env.RDS_PASSWORD || "Password123",
  database : process.env.RDS_DB_NAME || "ebdb",
  port : process.env.RDS_PORT || 5432,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false  // Fixed line
}
})

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// Define route for home page

// Serve the external page (external.ejs)
app.get('/', (req, res) => {
  res.render('public_views/external');  // Renders external.ejs from public_views folder
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
app.get('/admin', (req, res) => {
  const navItems = [
    { text: 'Home', link: '/' },
    { text: 'About', link: '/about' },
    { text: 'Support', link: '/support' }
  ];
  res.render("admin_Views/adminHome", { navItems });
});



// *** --------------------------------- PUBLIC Routes --------------------------------***


// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));


// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));
