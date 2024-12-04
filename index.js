let express = require('express');
let app = express();
let path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const res = require('express/lib/response');
const PORT = process.env.PORT || 3000;
let authorized = true;

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

// *** --------------------------------- LOGIN Routes --------------------------------***


// Serve the login page (login.ejs)
app.get('/login', (req, res) => {
  res.render('admin_Views/login', {
    layout: false,
    navItems:[]
  });  // Renders login.ejs from admin_Views folder
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      // Query the user table to find the record
      const user = await knex('users')
          .select('*')
          .where('username', username) // Replace with hashed password comparison in production
          .first(); // Returns the first matching record
          
      if (user && user.password === password) {  // Compare the plain text password
            // Authentication successful
          console.log("Log in Success")
          authorized = true;
          res.redirect("adminHome");  // Redirect to admin page on success
      } else {
        console.log("Log in failed")
          authorized = false;
          res.render('admin_Views/login', { 
            error: 'Invalid username or password',
            layout: false });
      }
  } catch (error) {
      console.error('Database error:', error);
      res.render('admin_Views/login', { 
        error: 'An error occurred. Please try again.',
        layout: false });
  }
});

app.get('/logout', (req, res) => {
    authorized = false;
    return res.redirect('/publicHome');  // In case of an error, go back to admin home
});



// *** --------------------------------- ADMIN ONLY Routes --------------------------------***

// Admin Home Page
app.get('/adminHome', (req, res) => {
  if (authorized) {
      res.render("admin_Views/adminHome", {
    title: 'Admin Home',
    navItems: [],
    layout: 'layouts/adminLayout'});  // Use the admin layout for this route
  } else {
    res.redirect('/login');
  }

});

// User Maintenance Page
app.get('/users', async (req, res) => {
  if (authorized) {
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
  } else {
    res.redirect('/login');
  }
  
});

app.post('/update-user/:id', (req, res) => {

  if (authorized) {
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
  } else {
    res.redirect('/login');
  }
  
});

// Search Bar grabbing data
app.get('/search', async (req, res) => {
  try {
    const query = req.query.query.trim().toLowerCase(); // Trim and convert query to lowercase

    if (!query) {
      return res.json([]); // Return an empty array if the query is empty
    }

    const searchTerms = query.split(' '); // Split query into individual terms (e.g., ["john", "doe"])

    let users;

    if (searchTerms.length > 1) {
      // If multiple terms, search for combinations of first and last names
      users = await knex('contact_info')
        .whereRaw('LOWER(first_name) LIKE ?', [`%${searchTerms[0]}%`])
        .andWhereRaw('LOWER(last_name) LIKE ?', [`%${searchTerms[1]}%`])
        .orWhereRaw('LOWER(first_name) LIKE ?', [`%${searchTerms[1]}%`])
        .andWhereRaw('LOWER(last_name) LIKE ?', [`%${searchTerms[0]}%`]);
    } else {
      // If a single term, search in both first and last names
      users = await knex('contact_info')
        .whereRaw('LOWER(first_name) LIKE ?', [`%${query}%`])
        .orWhereRaw('LOWER(last_name) LIKE ?', [`%${query}%`]);
    }

    res.json(users); // Return the matching users as JSON
  } catch (error) {
    console.error('Error retrieving search results:', error);
    res.status(500).json({ error: 'Error retrieving search results' });
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

    console.log('Query results:', {
      count: volunteers.length,
      sample: volunteers[0]
    });

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
    // Fetch data from your database
    const requestedEventsPending = await knex('requested_events')
      .where('status', 'pending')
      .orderBy('estimated_date', 'asc');
    const requestedEventsApproved = await knex('requested_events')
      .where('status', 'approved')
      .orderBy('estimated_date', 'asc');
    const executedEvents = await knex('executed_events')
      .orderBy('actual_start_date', 'desc');

    // Render the EJS page and pass the data
    res.render('admin_Views/events', {
      title: 'Manage Events',
      navItems: [],
      layout: 'layouts/adminLayout',
      requestedEventsPending: requestedEventsPending,
      requestedEventsApproved: requestedEventsApproved,
      executedEvents: executedEvents
    });
  } catch (error) {
    console.error("Error retrieving events:", error);
    res.status(500).send("Error retrieving events");
  }
});




// *** ------------------------------ End Events ------------- *** //

// *** ------------------------------ FAQ Routes ------------- *** //

// FAQs Page
app.get('/faqs', (req, res) => {
  if (authorized) {
    res.render("admin_Views/FAQs", {
        title: 'Manage FAQs',
        navItems: [],  // You can add navigation items here if needed
        layout: 'layouts/adminLayout'  // Use the admin layout for this route
      });
  } else {
    res.redirect('/login');
  }
});

// Trainings Page
app.get('/trainings', (req, res) => {
  if (authorized) {
    res.render("admin_Views/trainings", {
        title: 'Manage Trainings',
        navItems: [],  // You can add navigation items here if needed
        layout: 'layouts/adminLayout'  // Use the admin layout for this route
      });
  } else {
    res.redirect('/login');
  }
});

//see if this route works, do we need a different route to display the records
app.get("/searchUser", (req, res) => {
  if (authorized) {
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
  } else {
    res.redirect('/login');
  }
});



// *** --------------------------------- PUBLIC Routes --------------------------------***


// Serve static files (e.g., CSS) if needed
app.use(express.static('public'));

// donate route for home page 
app.get('/donate', (req, res) => {
  res.redirect('https://turtleshelterproject.org/checkout/donate?donatePageId=5b6a44c588251b72932df5a0');
});

// Jen's story
app.get('/jensstory', (req, res) => {
  res.render('public_views/jensstory', {
    layout: false });  // Renders external.ejs from public_views folder
});

// Schedule an Event
app.get('/event', (req, res) => {
  // Fetch location sizes and table shapes independently
  Promise.all([
    knex('location_size').select('size_description'), // Fetch size descriptions
    knex('table_shape').select('shape_description')  // Fetch shape descriptions
  ])
  .then(([locationSizes, tableShapes]) => {
    // Render the page without layout
    res.render('public_views/scheduleEvent', {
      locationSizes,
      tableShapes,
      layout: false  // Explicitly disable layout
    });
  })
  .catch(error => {
    console.error('Error fetching Location sizes and table shapes:', error);
    res.status(500).send('Internal Server Error');
  });
});

// port number, (parameters) => what you want it to do.

app.listen(PORT, () => console.log('Server started on port ' + PORT));
