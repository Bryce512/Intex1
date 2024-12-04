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
app.get('/', (req, res) => {
  res.render('public_views/publicHome', {
    title: 'Home',
    layout: 'layouts/mainLayout',
    navItems: []
  });
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
    return res.redirect('/');  // Changed from '/publicHome' to '/'
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

// admin Maintenance Page
app.get('/admins', async (req, res) => {
  if (authorized) {
    try {
        // Fetch admins from the 'admins' table
        const admins = await knex('contact_info').select().orderBy('last_name', "asc").orderBy('first_name',"asc"); // Adjust field names as needed
        // Render the admins page and pass the admins data to the view
        res.render("admin_Views/admins", {
          title: 'Manage Admins',
          navItems: [],
          layout: 'layouts/adminLayout', // Use the admin layout for this route
          admins: admins // Pass the admins data to the view
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving admins");
      }
  } else {
    res.redirect('/login');
  }
  
});

app.post('/update-admin/:id', (req, res) => {

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
        res.redirect('/admins'); // Redirect to the list of Character after saving
      })
      .catch(error => {
        console.error('Error updating Character:', error);
        res.status(500).send('Internal Server Error');
      });
  } else {
    res.redirect('/login');
  }
  
});


// *** ------------------------------ team_members Begin ---------------- ***//
app.get('/team_members', async (req, res) => {
  if(authorized) {
    try {
        const team_members = await knex({c: 'contact_info'})
          .select(
            'c.contact_id',
            'c.first_name',
            'c.last_name',
            'c.email',
            'c.phone',
            'tm.sewing_level',
            's.level_description',
            'tm.hours_willing'
          )
          .leftJoin('team_members as tm', 'c.contact_id', '=', 'tm.contact_id')
          .leftJoin('sewing_level as s', 'tm.sewing_level', '=', 's.sewing_level');

        return res.render('admin_Views/team_members', {
          title: 'Manage Team Members',
          team_members: team_members,
          layout: 'layouts/adminLayout',
          navItems: [
            { text: 'Home', link: '/' },
            { text: 'About', link: '/about' },
            { text: 'Support', link: '/support' }
          ]
        });

      } catch (err) {
        console.error('Error:', err);
        return res.render('admin_Views/team_members', {
          title: 'Manage Team Members',
          team_members: [],
          error: 'Failed to load Team Members: ' + err.message,
          layout: 'layouts/adminLayout',
          navItems: []
        });
      }
  } else {
    res.redirect('/login');
  }
});
  

app.post('/update-team_member/:id', async (req, res) => {
  if (authorized) {
      console.log('Update Team Member route hit with ID:', req.params.id);
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

        // Update team_members table with numeric sewing level
        await trx('team_members')
          .where('contact_id', id)
          .update({
            sewing_level: sewingLevelNum,
            hours_willing: req.body.hoursWilling
          });
      });

      console.log('Update successful, redirecting to /team_members');
      res.redirect('/team_members');
    } catch (error) {
      console.error('Error updating Team Member:', error);
      res.status(500).send('Error updating Team Member');
    }
  } else {
    res.redirect('/login');
  }
});

// *** ------------------------------ Events Begin ---------------- ***//
// Route to fetch and display executed_events

if (authorized) {
    
}else {
  res.redirect('/login');
}
app.get('/events', async (req, res) => {
  const status = req.query.status || 'pending'; // Default to 'pending' if no status is provided
  if (authorized) {
      try {
      let events;

    if (status === 'finished') {
      // Query the executed_events table for finished events
      events = await knex('executed_events')
        .select('*',
        'type.type_description', // Add type_description
        'requested_events.organization'
      )
      .leftJoin('type', 'executed_events.type_id', '=', 'type.type_id') // Join with type table
      .leftJoin('requested_events', 'executed_events.event_id', '=', 'requested_events.event_id');


    } else {
      // Default query for pending and approved events
      events = await knex('requested_events')
        .select(
          'requested_events.estimated_date',
          'requested_events.contact_id',
          'requested_events.street_address',
          'requested_events.loc_id',
          'requested_events.estimated_start_time',
          'requested_events.estimated_duration',
          'requested_events.type_id',
          'type.type_description',
          'requested_events.loc_size',
          'requested_events.estimated_num_adults',
          'requested_events.estimated_num_youth',
          'requested_events.estimated_num_children',
          'requested_events.num_machines',
          'requested_events.share_story',
          'requested_events.story_minutes',
          'requested_events.num_tables',
          'requested_events.table_shape',
          'requested_events.additional_notes',
          'requested_events.status',
          'requested_events.organization',
          'contact_info.first_name',
          'contact_info.last_name',
          'contact_info.phone',
          'location.city',
          'location.state',
          'location.zip',
        )
        .leftJoin('contact_info', 'requested_events.contact_id', '=', 'contact_info.contact_id')
        .leftJoin('location', 'requested_events.loc_id', '=', 'location.loc_id')
        .leftJoin('type', 'requested_events.type_id', '=', 'type.type_id')
        .where('requested_events.status', status); // Filter by the status
    }

      res.render('admin_Views/events', { 
        events,
        status,
        title: 'Manage Events',
        navItems: [],
      });
    } catch (error) {
      console.error('Error fetching events:', error.message, error.stack);
      res.status(500).send('An error occurred while fetching events.');
    }
  }else {
    res.redirect('/login');
  }
});
// *** ------------------------------ End Events ------------- *** //

// *** ------------------------------ FAQ Routes ------------- *** //
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

// Thanks to sponsors 
app.get('/thank-you-to-our-sponsors', (req, res) => {
  res.render('public_views/thank-you-to-our-sponsors', {
    layout: false });  // Renders external.ejs from public_views folder
});

// How you can help
app.get('/howYouCanHelp', (req, res) => {
  res.render('public_views/howYouCanHelp', {
    title: 'How You Can Help',
    layout: 'layouts/mainLayout',
    navItems: []
  });
});

// Schedule an Event
app.get('/event', (req, res) => {
  // Fetch location sizes and table shapes independently
  Promise.all([
    knex('location_size').select('loc_size','size_description'), // Fetch size descriptions
    knex('table_shape').select('table_shape','shape_description'),  // Fetch shape descriptions
    knex('type').select('type_id','type_description')  // Fetch type descriptions
  ])
  .then(([locationSizes, tableShapes, types]) => {
    // Render the page without layout
    res.render('public_views/scheduleEvent', {
      locationSizes,
      tableShapes,
      types,
      title: 'Manage Events',
      layout: false  // Explicitly disable layout
    });
  })
  .catch(error => {
    console.error('Error fetching Location sizes and table shapes:', error);
    res.status(500).send('Internal Server Error');
  });
});

// Add someone's Event Schedule Request to the Database
app.post('/scheduleEvent', (req, res) => {
  // Extract form values from req.body
  const firstName = req.body.firstName || ''; // Default to empty string if not provided
  const lastName = req.body.lastName || '';
  const email = req.body.email || '';
  const phone = req.body.phone || ''; 
  const city = req.body.city || ''; 
  const state = req.body.state || ''; 
  const zip = parseInt(req.body.zip, 10); // Convert to integer
  const organization = req.body.organization || ''; 
  const street = req.body.street || '';
  const eventCity = req.body.eventCity || '';
  const eventState = req.body.eventState || '';  
  const eventZip = parseInt(req.body.eventZip, 10);
  const locationSize = req.body.locationSize || '';
  const eventDate = req.body.eventDate || new Date().toISOString().split('T')[0]; // Default to today 
  const startTime = req.body.startTime || '12:00:00';
  const eventDuration = parseFloat(req.body.eventDuration);
  const numAdults = parseInt(req.body.numAdults, 10);
  const numYouth = parseInt(req.body.numYouth, 10);
  const numChildren = parseInt(req.body.numYouth, 10);
  const eventType = req.body.eventType || 'Both'; // Default to Both
  const numMachines = parseInt(req.body.numMachines, 10);
  const shareStory = req.body.shareStory === 'true'; // Checkbox returns true or undefined
  const storyDuration = parseInt(req.body.storyDuration, 10) || 0;
  const numTables = parseInt(req.body.numTables, 10);
  const tableShape = req.body.tableShape || '';
  const additionalNotes = req.body.additionalNotes || '';

  // Insert the new Event into the database
  knex('requested_events')
      .insert({
          estimated_date: eventDate,
          street_address: street,
          estimated_start_time: startTime,
          estimated_duration: eventDuration,
          type_id: eventType,
          loc_size: locationSize,
          estimated_num_adults: numAdults,
          estimated_num_youth: numYouth,
          estimated_num_children: numChildren,
          num_machines: numMachines,
          share_story: shareStory,
          story_minutes: storyDuration,
          num_tables: numTables,
          table_shape: tableShape,
          additional_notes: additionalNotes,
          organization: organization,
      })
      .then(() => {
        res.render('public_views/publicHome', {
          layout: false,
          title: 'Home'
        });
      })
      .catch(error => {
          console.error('Error adding Event:', error);
          res.status(500).send('Internal Server Error');
      });
});

// port number, (parameters) => what you want it to do.

app.listen(PORT, () => console.log('Server started on port ' + PORT));
