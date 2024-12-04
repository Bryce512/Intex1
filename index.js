let express = require('express');
let app = express();
let path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const res = require('express/lib/response');
const PORT = process.env.PORT || 3000

const authorized = false;
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
    const users = await knex('contact_info').select().orderBy('last_name', "asc").orderBy('first_name',"asc"); // Adjust field names as needed

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

app.post('/update-user/:id', (req, res) => {
  const id = req.params.id;
  // Access each value directly from req.body
  const first_name = req.body.firstName;
  const last_name = req.body.lastName;
  const email = req.body.email;
  // Update the Character in the database
  knex('contact_info')
    .where('contact_id', id)
    .update({
      first_name: first_name,
      last_name: last_name,
      email: email,
    })
    .then(() => {
      res.redirect('/users'); // Redirect to the list of Character after saving
    })
    .catch(error => {
      console.error('Error updating Character:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Search Bar grabbing data
app.get('/search', async (req, res) => {
  try {
    const query = req.query.query.toLowerCase(); // Get the search query from the request

    // Search for users whose first_name or last_name matches the query
    const users = await knex('contact_info')
      .whereRaw('LOWER(first_name) LIKE ?', [`%${query}%`])
      .orWhereRaw('LOWER(last_name) LIKE ?', [`%${query}%`]);

    res.json(users); // Return the matching users as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving search results" });
  }
});

// *** ------------------------------ Volunteers Begin ---------------- ***//
app.get('/volunteers', async (req, res) => {
  try {
    const volunteers = await knex('contact_info as c')
      .select(
        'c.contact_id',
        'c.first_name',
        'c.last_name',
        'c.email',
        'c.phone',
        'v.sewing_level',
        's.level_description',
        'v.hours_willing'
      )
      .leftJoin('volunteers as v', 'c.contact_id', '=', 'v.contact_id')
      .leftJoin('sewing_level as s', 'v.sewing_level', '=', 's.sewing_level');

    console.log('Sample volunteer data:', volunteers[0]);

    return res.render('admin_Views/volunteers', {
      title: 'Manage Volunteers',
      volunteers: volunteers,
      layout: 'layouts/adminLayout',
      navItems: [
        { text: 'Home', link: '/' },
        { text: 'About', link: '/about' },
        { text: 'Support', link: '/support' }
      ]
    });

  } catch (err) {
    console.error('Error:', err);
    return res.render('admin_Views/volunteers', {
      title: 'Manage Volunteers',
      volunteers: [],
      error: 'Failed to load volunteers: ' + err.message,
      layout: 'layouts/adminLayout',
      navItems: []
    });
  }
});

app.post('/update-volunteer/:id', async (req, res) => {
  console.log('Update volunteer route hit with ID:', req.params.id);
  const id = req.params.id;
  try {
    // Convert sewing level description to number
    let sewingLevelNum;
    switch(req.body.sewingLevel.toLowerCase()) {
      case 'beginner':
        sewingLevelNum = 1;
        break;
      case 'intermediate':
        sewingLevelNum = 2;
        break;
      case 'advanced':
        sewingLevelNum = 3;
        break;
      default:
        sewingLevelNum = null;
    }

    await knex.transaction(async trx => {
      // Update contact_info table
      await trx('contact_info')
        .where('contact_id', id)
        .update({
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          email: req.body.email,
          phone: req.body.phone
        });

      // Update volunteers table with numeric sewing level
      await trx('volunteers')
        .where('contact_id', id)
        .update({
          sewing_level: sewingLevelNum,
          hours_willing: req.body.hoursWilling
        });
    });

    console.log('Update successful, redirecting to /volunteers');
    res.redirect('/volunteers');
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).send('Error updating volunteer');
  }
});


app.get('/searchVolunteers', async (req, res) => {
  try {
    const query = req.query.query.trim().toLowerCase();

    if (!query) {
      return res.json([]);
    }

    const searchTerms = query.split(' '); // Split query into individual terms (e.g., ["pam", "b"])

    let volunteers;

    if (searchTerms.length > 1) {
      // If multiple terms, search for combinations of first and last names
      volunteers = await knex('contact_info as c')
        .leftJoin('volunteers as v', 'c.contact_id', '=', 'v.contact_id')
        .leftJoin('sewing_level as s', 'v.sewing_level', '=', 's.sewing_level')
        .select(
          'c.contact_id',
          'c.first_name',
          'c.last_name',
          'c.email',
          'c.phone',
          'v.sewing_level',
          's.level_description',
          'v.hours_willing'
        )
        .where(function() {
          this.whereRaw('LOWER(c.first_name) LIKE ?', [`%${searchTerms[0]}%`])
              .andWhereRaw('LOWER(c.last_name) LIKE ?', [`%${searchTerms[1]}%`])
              .orWhere(function() {
                this.whereRaw('LOWER(c.first_name) LIKE ?', [`%${searchTerms[1]}%`])
                    .andWhereRaw('LOWER(c.last_name) LIKE ?', [`%${searchTerms[0]}%`]);
              });
        });
    } else {
      // If a single term, search in both first and last names
      volunteers = await knex('contact_info as c')
        .leftJoin('volunteers as v', 'c.contact_id', '=', 'v.contact_id')
        .leftJoin('sewing_level as s', 'v.sewing_level', '=', 's.sewing_level')
        .select(
          'c.contact_id',
          'c.first_name',
          'c.last_name',
          'c.email',
          'c.phone',
          'v.sewing_level',
          's.level_description',
          'v.hours_willing'
        )
        .whereRaw('LOWER(c.first_name) LIKE ?', [`%${query}%`])
        .orWhereRaw('LOWER(c.last_name) LIKE ?', [`%${query}%`]);
    }

    console.log('Search query:', query);
    console.log('Search terms:', searchTerms);
    console.log('Results:', volunteers);

    res.json(volunteers);
  } catch (error) {
    console.error('Error retrieving search results:', error);
    res.status(500).json({ error: 'Error retrieving search results' });
  }
});

// *** ------------------------------ Events Begin ---------------- ***//
app.get('/events', async (req, res) => {
  try {
    // Fetch events from the 'events' table
    const events = await knex({r:'requested_events'})
    .join({c: 'contact_info'}, 'c.contact_id', '=', 'r.contact_id')
    .select().orderBy('estimated_date', 'asc'); // Adjust field names as needed

    // Render the events page and pass the events data to the view
    res.render("admin_Views/events", {
      title: 'Manage Events',
      navItems: [],
      layout: 'layouts/adminLayout', // Use the admin layout for this route
      events: events // Pass the events data to the view
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving events");
  }
});
// *** ------------------------------ End Events ------------- *** //



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

// donate route for home page 
app.get('/donate', (req, res) => {
  res.redirect('https://turtleshelterproject.org/checkout/donate?donatePageId=5b6a44c588251b72932df5a0');
});

// Jen's story
app.get('/jensstory', (req, res) => {
  res.render('public_views/jensstory', {
    layout: false });  // Renders external.ejs from public_views folder
});
