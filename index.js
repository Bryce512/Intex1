let express = require('express');
let app = express();
let path = require('path');
const PORT = process.env.PORT || 3001
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

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Define route for home page

// Serve the login page (login.ejs)
app.get('/', (req, res) => {
  res.render('public_views/external');  // Renders 'login.ejs' file
});

// *** --------------------------------- ADMIN Routes --------------------------------***

// Admin Home Page
// Define a route for the About page
app.get('/admin', (req, res) => {
  const navItems = [
    { text: 'Home', link: '/' },
    { text: 'About', link: '/about' },
    { text: 'Support', link: '/support' }
  ];
  res.render("admin_Views/adminHome", { navItems });
});

//see if this route works, do we need a different route to display the records
app.get("/searchUser", (req, res) => {
  const { searchFirstName, searchLastName } = req.query;

  // Build the query
  let query = knex.select().from('contact_info');

  if (searchFirstName) {
    query = query.where(knex.raw('UPPER(first_name)'), '=', searchFirstName.toUpperCase());
  }
  
  if (searchLastName) {
    query = query.andWhere(knex.raw('UPPER(last_name)'), '=', searchLastName.toUpperCase());
  }

  // Execute the query
  // is users the right list 
  query
    .then(results => {
      if (results.length > 0) {
        res.render("displayUser", { users: results });
      } else {
        res.render("displayUser", { users: [], message: "No matches found." });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ err });
    });
});



// *** --------------------------------- PUBLIC Routes --------------------------------***


// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));


// port number, (parameters) => what you want it to do.
app.listen(PORT, () => console.log('Server started on port ' + PORT));
