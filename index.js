let express = require('express');
let app = express();
let path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 3000;
let authorized = false;

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
      const user = await knex('admins')
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
            navItems:[],
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
    pageType: 'AdminHome',
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
        const admins = await knex('admins as a').select()
        .join('contact_info as c', 'a.contact_id', '=', 'c.contact_id')
        .leftJoin('team_members as tm', 'tm.contact_id', '=', 'c.contact_id')
        .leftJoin('sewing_level as sl', 'sl.sewing_level', '=', 'tm.sewing_level')
        .orderBy('last_name', "asc").orderBy('first_name',"asc"); // Adjust field names as needed

        const team_members = await knex('team_members as tm')
        .select('tm.contact_id', 'c.first_name', 'c.last_name')
        .join('contact_info as c', 'tm.contact_id', '=', 'c.contact_id')  // Join team_members with contact_info
        .leftJoin('admins as a', 'tm.contact_id', '=', 'a.contact_id')  // Left join with admins to exclude admins
        .whereNull('a.contact_id')  // Only select team members not in the admins table
        .orderBy('c.last_name', 'asc')  // Ordering by last_name first
        .orderBy('c.first_name', 'asc');  // Then by first_name
      

        // Render the admins page and pass the admins data to the view
        res.render("admin_Views/admins", {
          title: 'Manage Admins',
          navItems: [],
          layout: 'layouts/adminLayout', // Use the admin layout for this route
          admins: admins,
          teamMembers: team_members,
          pageType: "admin" // Pass the admins data to the view
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


// *** ------------------------------ Team_members Begin ---------------- ***//
app.get('/team_members', async (req, res) => {
  if(authorized) {
    try {
        const sewingLevels = await knex('sewing_level')
        .select('sewing_level', 'level_description');
        const team_members = await knex({c: 'contact_info'})
          .select(
            'c.contact_id',
            'c.first_name',
            'c.last_name',
            'c.email',
            'c.phone',
            'tm.source_id',
            'tm.sewing_level',
            's.level_description',
            'tm.hours_willing',
            'c.loc_id'
          )
          .leftJoin('team_members as tm', 'c.contact_id', '=', 'tm.contact_id')
          .leftJoin('sewing_level as s', 'tm.sewing_level', '=', 's.sewing_level')
          .join('sources', 'tm.source_id', '=', 'sources.source_id')
          .orderBy('last_name', "asc").orderBy('first_name',"asc"); // Adjust field names as needed
          ;
        
        return res.render('admin_Views/team_members', {
          sewingLevels: sewingLevels,
          title: 'Manage Team Members',
          team_members: team_members,
          layout: 'layouts/adminLayout',
          navItems: [],
          pageType: "team_member"
        });

      } catch (err) {
        console.error('Error:', err);
        return res.render('admin_Views/team_members', {
          title: 'Manage Team Members',
          sewingLevels: sewingLevels,
          team_members: [],
          error: 'Failed to load Team Members: ' + err.message,
          layout: 'layouts/adminLayout',
          navItems: [],
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
      .leftJoin('requested_events', 'executed_events.event_id', '=', 'requested_events.event_id')
      .orderBy('requested_events.estimated_date', 'desc'); // order by most recent date;


    } else {
      // Default query for pending and approved events
      events = await knex('requested_events')
        .select(
          'requested_events.*',
          'type.type_description',
          'contact_info.first_name',
          'contact_info.last_name',
          'contact_info.phone',
          'location.city',
          'location.state',
          'location.zip',
          'location_size.*',
          'table_shape.*'
        )
        .leftJoin('contact_info', 'requested_events.contact_id', '=', 'contact_info.contact_id')
        .leftJoin('location', 'requested_events.loc_id', '=', 'location.loc_id')
        .leftJoin('type', 'requested_events.type_id', '=', 'type.type_id')
        .leftJoin('table_shape', 'requested_events.table_shape', '=', 'table_shape.table_shape')
        .leftJoin('location_size', 'requested_events.loc_size', '=', 'location_size.loc_size')
        .where('requested_events.status', status)
        .orderBy('requested_events.estimated_date', 'desc'); // order by most recent date
    }

      res.render('admin_Views/events', { 
        events,
        status,
        title: 'Manage Events',
        navItems: [],
        pageType: "event"
      });
    } catch (error) {
      console.error('Error fetching events:', error.message, error.stack);
      res.status(500).send('An error occurred while fetching events.');
    }
  }else {
    res.redirect('/login');
  }
});


app.get('/editEvent/:eventId', async (req, res) => {
  if (authorized) { 
    const eventId = req.params.eventId; // Extract the eventId from the route parameter
    let status = await knex('requested_events')
      .select('requested_events.status')
      .where('requested_events.event_id', eventId)
        .first(); // get the status of the event
    status = status.status;

    const types = await knex('type').select('type_id','type.type_description')
    const locationSizes = await knex('location_size').select('loc_size','size_description') // Fetch size descriptions
    const tableShapes = await knex('table_shape').select('table_shape','shape_description')  // Fetch shape descriptions
    if (authorized) {
      try {
        // Query the database to get event details based on the eventId
        let event;
        
        if (status === 'finished') {
          // Fetch the event details from the executed_events table if status is 'finished'
          event = await await knex('executed_events')
            .select('*',
              'executed_events.*',
              'location.*',
              'type.type_description', // Add type_description
              'requested_events.organization',
              'requested_events.status'
            )
            .leftJoin('type', 'executed_events.type_id', '=', 'type.type_id') // Join with type table
            .leftJoin('requested_events', 'executed_events.event_id', '=', 'requested_events.event_id')
            .leftJoin('contact_info', 'requested_events.contact_id', '=', 'contact_info.contact_id')
            .leftJoin('location', 'requested_events.loc_id', '=', 'location.loc_id')
            .where('executed_events.event_id', eventId)
            .first();  // Use .first() to return a single row for the event
        } else {
          // Fetch the event details from the requested_events table for other statuses
          event = await knex('requested_events')
          .select(
            'requested_events.*',  // Select all columns from requested_events table
            'type.type_description',  // Select specific columns from type table
            'contact_info.first_name',
            'contact_info.last_name',
            'contact_info.phone',
            'contact_info.email',
            'location.city',
            'location.state',
            'location.zip',
          )
          .leftJoin('contact_info', 'requested_events.contact_id', '=', 'contact_info.contact_id')
          .leftJoin('location', 'requested_events.loc_id', '=', 'location.loc_id')
          .leftJoin('type', 'requested_events.type_id', '=', 'type.type_id')
            .where('requested_events.event_id', eventId)  // Filter by eventId
            .first();  // Use .first() to return a single row for the event
        }

        if (!event) {
          // If no event is found, send a 404 response
          return res.status(404).send('Event not found');
        }

        console.log(event);
        // Render the page with the fetched event data
        res.render('admin_Views/editEvent', {
          event: event,  // Pass the event data to the template
          status: status,
          types: types,
          locationSizes: locationSizes,
          tableShapes: tableShapes,
          title: 'Edit Event',  // Change this to the title you want
          pageType: 'editEvent',  // Adjust as needed
          navItems: [],  // Add navigation items if needed
          layout: 'layouts/adminLayout'  // Use the admin layout for this route
        });
      } catch (error) {
        console.error('Error fetching event:', error.message, error.stack);
        res.status(500).send('An error occurred while fetching the event.');
      }
    } else {
      // Redirect to login page if not authorized
      res.redirect('/login');
    }
  }else {
    res.redirect('/login');
  }
  
});

app.post('/editEvent/:eventId', (req, res) => {

  if (authorized) { 
    const event_id = req.params.eventId;
    const status = req.body.status || '';


    const body = req.body;

    // Log the raw request body

    if (status === 'finished') {

    }else {}

    // Extract form values
    const firstName = req.body.firstName || ''; 
    const lastName = req.body.lastName || '';
    const email = req.body.email || '';
    const phone = req.body.phone || ''; 
    const city = req.body.eventCity || ''; 
    const state = req.body.eventState || ''; 
    const organization = req.body.organization || ''; 
    const address = req.body.address || '';
    const eventCity = req.body.eventCity || '';
    const eventState = req.body.eventState || '';  
    const eventZip = req.body.eventZip || ''; // No parsing yet, just raw value
    const estDate = req.body.estimatedDate || new Date().toISOString().split('T')[0]; 
    const estStartTime = req.body.estimatedStartTime || '12:00:00';
    const estDuration = req.body.estimatedDuration || 0 ;
    const estNumAdults = req.body.estimatedNumAdults || 0 ; 
    const estNumYouth = req.body.estimatedNumYouth || 0 ; 
    const estNumChildren = req.body.estimatedNumChildren || 0 ;
    const eventType = req.body.eventType || null ; 
    const numMachines = req.body.numMachines || 0 ;
    const shareStory = req.body.shareStory === 'true'; 
    const storyDuration = req.body.storyMinutes || '0' ;
    const numTables = req.body.numTables || 0 ;
    const tableShape = req.body.tableShape || null ;
    const additionalNotes = req.body.additionalNotes || '';
    const loc_size = req.body.locationSize || 3 ; // Defaulting to 3

      // Additional fields for 'finished' events
      const actualStartDate = body.actualStartDate || new Date();
      const actualEndDate = body.actualEndDate || new Date();
      const actualStartTime = body.actualStartTime || '12:00:00';
      const actualDuration = body.actualDuration || 0 ;
      const actualNumPeople = body.actualNumPeople || 0 ;
      const pockets = body.pockets || 0 ;
      const collars = body.collars || 0 ;
      const envelopes = body.envelopes || 0 ;
      const vests = body.vests || 0 ;
      const itemsCompleted = body.itemsCompleted || 0 ;
    


    // Now, proceed with the database logic using the validated values
    knex.transaction(trx => {
      let loc_id, eventLoc_id, contact_id;

      // Step 1: Check if the zip code exists in the 'location' table (for personal info)
      return trx('location')
        .select('loc_id')
        .where('zip', eventZip)
        .first()
        .then(location => {
          if (location) {
            // Zip code exists, use the existing loc_id
            loc_id = location.loc_id;
          } else {
            // Zip doesn't exist, insert new location into location table
            return trx('location')
              .insert({
                city: city,
                state: state,
                zip: zip,
              })
              .returning('loc_id') // Get the newly inserted loc_id
              .then(newLocation => {
                loc_id = newLocation[0].loc_id; // Capture the new loc_id
              });
          }
        })
        .then(() => {
          // Step 2: Check if the event zip code exists in the 'location' table (for event location)
          return trx('location')
            .select('loc_id')
            .where('zip', eventZip)
            .first()
            .then(existingLocation => {
              if (existingLocation) {
                // Event zip exists, use the existing loc_id for the event
                eventLoc_id = existingLocation.loc_id;
              } else {
                // Event zip doesn't exist, insert new location for the event
                return trx('location')
                  .insert({
                    city: eventCity,
                    state: eventState,
                    zip: eventZip,
                  })
                  .returning('loc_id')
                  .then(newEventLocation => {
                    eventLoc_id = newEventLocation[0].loc_id; // Capture the new loc_id for the event
                  });
              }
            });
        })
        .then(() => {
          // Step 3: Check if the email exists in the 'contact_info' table
            return trx('contact_info')
              .select('contact_id')
              .where('email', email)  // Use the provided existing email
              .first()
              .then(existingContact => {
                if (existingContact) {
                  // If the contact exists, use the existing contact_id
                  contact_id = existingContact.contact_id;
                } else {
                  // If the contact doesn't exist, create a new contact
                  return trx('contact_info')
                    .insert({
                      first_name: firstName,
                      last_name: lastName,
                      phone: phone,
                      email: email,
                      loc_id: loc_id, // Insert the loc_id for personal info
                    })
                    .returning('contact_id') // Get the newly inserted contact_id
                    .then(newContact => {
                      contact_id = newContact[0].contact_id;  // Capture the new contact_id
                    });
                }
              });
        })
        .then(() => {
            // Handle empty strings and convert them to null for numeric fields
            const validNumAdults = !isNaN(parseInt(estNumAdults)) ? parseInt(estNumAdults) : null;
            const validNumYouth = !isNaN(parseInt(estNumYouth)) ? parseInt(estNumYouth) : null;
            const validNumChildren = !isNaN(parseInt(estNumChildren)) ? parseInt(estNumChildren) : null;
            const validNumMachines = !isNaN(parseInt(numMachines)) ? parseInt(numMachines) : null;
            const validStoryDuration = !isNaN(parseInt(storyDuration)) ? parseInt(storyDuration) : null;
            const validNumTables = !isNaN(parseInt(numTables)) ? parseInt(numTables) : null;
            

          // Step 4: Insert the event into requested_events table
          return trx('requested_events')
          .where('event_id', event_id)
            .update({
              estimated_date: estDate,
              street_address: address,
              estimated_start_time: estStartTime,
              estimated_duration: estDuration,
              type_id: eventType,
              loc_size: loc_size,
              estimated_num_adults: validNumAdults,
              estimated_num_youth: validNumYouth,
              estimated_num_children: validNumChildren,
              num_machines: validNumMachines,
              share_story: shareStory,
              story_minutes: validStoryDuration,
              num_tables: validNumTables,
              table_shape: tableShape,
              additional_notes: additionalNotes,
              organization: organization,
              status: status,
              contact_id: contact_id,  // Insert the contact_id from contact_info
              loc_id: eventLoc_id,  // Insert the loc_id for the event location
            });
        })
        .then(() => {
          // Step 5: Check if the status is 'finished' and insert into executed_events
          if (status === 'finished') {
            return trx('executed_events')
                .where('event_id', event_id)  // Check if the event already exists in executed_events
                .first()  // Get the first match
                .then(existingExecutedEvent => {
                    if (!existingExecutedEvent) {
                      return trx('executed_events')
                        .insert({
                          event_id: event_id,  // Insert the event_id into executed_events
                          actual_start_date: actualStartDate,  // You can add a timestamp column in your table
                          actual_start_time: actualStartTime,
                          actual_duration: actualDuration,
                          actual_num_people: actualNumPeople,
                          type_id: eventType,
                          pockets: pockets,
                          collars: collars,
                          envelopes: envelopes,
                          vests: vests,
                          items_completed: itemsCompleted,
                          actual_end_date: actualEndDate
                        });
                      }  else {
                        return trx('executed_events')
                        .where('event_id', event_id)
                        .update({
                          actual_start_date: actualStartDate,  // You can add a timestamp column in your table
                          actual_start_time: actualStartTime,
                          actual_duration: actualDuration,
                          actual_num_people: actualNumPeople,
                          type_id: eventType,
                          pockets: pockets,
                          collars: collars,
                          envelopes: envelopes,
                          vests: vests,
                          items_completed: itemsCompleted,
                          actual_end_date: actualEndDate
                        });
                      }
                })
          }
    })
        .then(() => {
          // Step 6: Commit the transaction and redirect to the edit event page
          if (status === 'finished') {
            res.redirect(`/editEvent/${event_id}`);  // Redirect to the edit event page
          } else {
            res.redirect('/events');  // Otherwise, redirect to the events list
          }
        })
        .catch(error => {
          console.error('Error Editing event:', error);
          res.status(500).send('Internal Server Error');
        });
    });
  }else {
    res.redirect('/login');
  }
});



// *** ------------------------------ End Events ------------- *** //

// *** ------------------------------ FAQ Routes ------------- *** //
// FAQs Page
app.get('/faqs', (req, res) => {
  if (authorized) { 
      res.render("admin_Views/FAQs", {
      title: 'Manage FAQs',
      pageType: 'FAQ',
      navItems: [],  // You can add navigation items here if needed
      layout: 'layouts/adminLayout'  // Use the admin layout for this route
    });
  }else {
    res.redirect('/login');
  }

});

// Trainings Page
app.get('/trainings', (req, res) => {
  if (authorized) {
    res.render("admin_Views/trainings", {
        title: 'Manage Trainings',
        pageType: 'trainings',
        navItems: [],  // You can add navigation items here if needed
        layout: 'layouts/adminLayout'  // Use the admin layout for this route
      });
  } else {
    res.redirect('/login');
  }
});
// *** --------------------------------- BEGIN ADD Routes --------------------------------***
app.post('/add-admin', (req, res) => {
  if (authorized) { 
    // Extract values from the request body
    const contact_id = req.body.add_entity_name;  // The selected contact ID from the dropdown
    const username = req.body.username || ''; // Username input
    const password = req.body.password || ''; // Password input

    // Validation (optional, but you might want to validate these fields)
    if (!contact_id || !username || !password) {
      return res.status(400).send('Missing required fields');
    }

    // Insert into the admins table
    knex('admins')
      .insert({
        contact_id: contact_id, // The contact_id selected from the dropdown
        username: username,
        password: password // You might want to hash the password before saving it
      })
      .then(() => {
        // Redirect to the admins page after successful insertion
        res.redirect('/admins');
      })
      .catch(error => {
        console.error('Error adding admin:', error);
        res.status(500).send('Internal Server Error');
      });
  }else {
    res.redirect('/login');
  }
  
});


app.post('/add-team_member', (req, res) => {
  if (authorized) { 
    // Extract form values from req.body
    const first_name = req.body.firstName || ''; // Default to empty string if not provided
    const last_name = req.body.lastName || ''; // Default to empty string if not provided
    const email = req.body.email || ''; // Checkbox returns true or undefined
    const phone = req.body.phone || null;
    const source = req.body.source || '';
    const sewing_level = parseInt(req.body.sewingLevel, 10) || null; // Convert level to Int
    const hours_willing = parseInt(req.body.hoursWilling, 10) || null; // Convert to integer

    // Insert the contact information into the contact_info table
    knex('contact_info')
        .insert({
            first_name: toTitleCase(first_name),   // Ensure first_name is uppercase
            last_name: toTitleCase(last_name),
            phone: phone,
            email: email
        })
        .returning('contact_id') // Return the contact_id of the newly inserted row
        .then(contactIds => {
          const contact_id = contactIds[0].contact_id; // Correct: Extract the contact_id from the object
            // Now insert into the team_members table using the generated contact_id
            return knex('team_members')
                .insert({
                    contact_id: contact_id, // Use the generated contact_id here
                    source_id: source,
                    sewing_level: sewing_level,
                    hours_willing: hours_willing
                });
        })
        .then(() => {
            res.redirect('/team_members'); // Redirect to the main page after successful insertion
        })
        .catch(error => {
            console.error('Error adding team member:', error);
            res.status(500).send('Internal Server Error');
        });
  }else {
    res.redirect('/login');
  }
  
});

// *** --------------------------------- END ADD Routes --------------------------------***


// *** --------------------------------- Begin DELETE Routes --------------------------------***

app.post('/delete-admin/:id', async (req, res) => {
  if (authorized) { 
  const id = req.params.id;
  knex('admins')
    .where('contact_id', id)
    .del() // Deletes the record with the specified ID
    .then(() => {
      res.redirect('/admins'); // Redirect to the planet list after deletion
    })
    .catch(error => {
      console.error('Error deleting Admin:', error);
      res.status(500).send('Internal Server Error');
    });
  }else {
    res.redirect('/login');
  }
});

app.post('/delete-team_member/:id', async (req, res) => {
  const id = req.params.id;
  if (authorized) { 
    knex('team_members')
    .where('contact_id', id)
    .del() // Deletes the record with the specified ID
    .then(() => {
      res.redirect('/team_members'); // Redirect to the planet list after deletion
    })
    .catch(error => {
      console.error('Error deleting Team Member:', error);
      res.status(500).send('Internal Server Error');
    });  
  }else {
    res.redirect('/login');
  }
});


app.post('/delete-event/:id', async (req, res) => {
  const id = req.params.id;
  if (authorized) { 
    knex('requested_events')
    .where('event_id', id)
    .del() // Deletes the record with the specified ID
    .then(() => {
      console.log('deleting event');
      res.redirect('/events'); // Redirect to the planet list after deletion
    })
    .catch(error => {
      console.error('Error deleting Event:', error);
      res.status(500).send('Internal Server Error');
    });
  }else {
    res.redirect('/login');
  }
  
});

// *** --------------------------------- End DELETE Routes --------------------------------***


// Begin Calendar Routes 
app.get('/api/approved-events', async (req, res) => {
  try {
      const result = await knex('requested_events').where('status', 'approved');
      res.json(result); // Send the events as JSON
  } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch approved events' });
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

// about
app.get('/about', (req, res) => {
  res.render('public_views/about', {
    layout: false });  // Renders external.ejs from public_views folder
});

// homelessness and cold  
app.get('/about-homelessness-and-the-cold', (req, res) => {
  res.render('public_views/about-homelessness-and-the-cold', {
    layout: false });  // Renders external.ejs from public_views folder
});


// homelessness and cold  
app.get('/our-tech', (req, res) => {
  res.render('public_views/our-tech', {
    layout: false });  // Renders external.ejs from public_views folder
});

// homelessness and cold  
app.get('/new-page-1', (req, res) => {
  res.render('public_views/new-page-1', {
    layout: false });  // Renders external.ejs from public_views folder
});

// homelessness and cold  
app.get('/vests-distributed-to-date', (req, res) => {
  res.render('public_views/vests-distributed-to-date', {
    layout: false });  // Renders external.ejs from public_views folder
});

// homelessness and cold  
app.get('/faqss', (req, res) => {
  res.render('public_views/faqss', {
    layout: false });  // Renders external.ejs from public_views folder
});

// homelessness and cold  
app.get('/contact', (req, res) => {
  res.render('public_views/contact', {
    layout: false });  // Renders external.ejs from public_views folder
});



// Schedule an Event
app.get('/event', (req, res) => {
  // Fetch location sizes and table shapes independently
  Promise.all([
    knex('location_size').select('loc_size','size_description'), // Fetch size descriptions
    knex('table_shape').select('table_shape','shape_description')  // Fetch shape descriptions
  ])
  .then(([locationSizes, tableShapes]) => {
    // Render the page without layout
    res.render('public_views/scheduleEvent', {
      locationSizes,
      tableShapes,
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
  // Extract form values
  const firstName = req.body.firstName || ''; 
  const lastName = req.body.lastName || '';
  const email = req.body.email || '';
  const existingEmail = req.body.existingEmail || '';  // New field for existing email
  const phone = req.body.phone || ''; 
  const city = req.body.city || ''; 
  const state = req.body.state || ''; 
  const zip = parseInt(req.body.zip, 10) || 84401; // Convert to integer
  const organization = req.body.organization || ''; 
  const street = req.body.street || '';
  const eventCity = req.body.eventCity || '';
  const eventState = req.body.eventState || '';  
  const eventZip = parseInt(req.body.eventZip, 10);
  const locationSize = req.body.locationSize || '';
  const eventDate = req.body.eventDate || new Date().toISOString().split('T')[0]; 
  const startTime = req.body.startTime || '12:00:00';
  const eventDuration = parseFloat(req.body.eventDuration) || 0;
  const numAdults = parseInt(req.body.numAdults, 10);
  const numYouth = parseInt(req.body.numYouth, 10);
  const numChildren = parseInt(req.body.numYouth, 10);
  const eventType = req.body.eventType || 'Both'; 
  const numMachines = parseInt(req.body.numMachines, 10) || 0;
  const shareStory = req.body.shareStory === 'true'; 
  const storyDuration = parseInt(req.body.storyDuration, 10) || 0;
  const numTables = parseInt(req.body.numTables, 10);
  const tableShape = req.body.tableShape || '';
  const additionalNotes = req.body.additionalNotes || '';

  // Start a transaction
  knex.transaction(trx => {
    let loc_id, eventLoc_id, contact_id;

    // Step 1: Check if the zip code exists in the 'location' table (for personal info)
    return trx('location')
      .select('loc_id')
      .where('zip', zip)
      .first()
      .then(location => {
        if (location) {
          // Zip code exists, use the existing loc_id
          loc_id = location.loc_id;
        } else {
          // Zip doesn't exist, insert new location into location table
          return trx('location')
            .insert({
              city: city,
              state: state,
              zip: zip,
            })
            .returning('loc_id') // Get the newly inserted loc_id
            .then(newLocation => {
              loc_id = newLocation[0].loc_id; // Capture the new loc_id
            });
        }
      })
      .then(() => {
        // Step 2: Check if the event zip code exists in the 'location' table (for event location)
        return trx('location')
          .select('loc_id')
          .where('zip', eventZip)
          .first()
          .then(existingLocation => {
            if (existingLocation) {
              // Event zip exists, use the existing loc_id for the event
              eventLoc_id = existingLocation.loc_id;
            } else {
              // Event zip doesn't exist, insert new location for the event
              return trx('location')
                .insert({
                  city: eventCity,
                  state: eventState,
                  zip: eventZip,
                })
                .returning('loc_id')
                .then(newEventLocation => {
                  eventLoc_id = newEventLocation[0].loc_id; // Capture the new loc_id for the event
                });
            }
          });
      })
      .then(() => {
        // Step 3: Check if the email exists in the 'contact_info' table
          return trx('contact_info')
            .select('contact_id')
            .where('email', existingEmail)  // Use the provided existing email
            .first()
            .then(existingContact => {
              if (existingContact) {
                // If the contact exists, use the existing contact_id
                contact_id = existingContact.contact_id;
              } else {
                // If the contact doesn't exist, create a new contact
                return trx('contact_info')
                  .insert({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    email: email,
                    loc_id: loc_id, // Insert the loc_id for personal info
                  })
                  .returning('contact_id') // Get the newly inserted contact_id
                  .then(newContact => {
                    contact_id = newContact[0].contact_id;  // Capture the new contact_id
                  });
              }
            });
      })
      .then(() => {
        // Step 4: Insert the event into requested_events table
        return trx('requested_events')
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
            contact_id: contact_id,  // Insert the contact_id from contact_info
            loc_id: eventLoc_id,  // Insert the loc_id for the event location
          });
      })
      .then(() => {
        // Commit the transaction and send success response
        res.redirect('/event?success=true');
      })
      .catch(error => {
        console.error('Error scheduling event:', error);
        res.status(500).send('Internal Server Error');
      });
  });
});

// Load the Join the Team Page
app.get('/joinTeam', (req, res) => {
  // Fetch location sizes and table shapes independently
  Promise.all([
    knex('sources').select('source_id','source_description'), // Fetch size descriptions
    knex('sewing_level').select('sewing_level','level_description')  // Fetch shape descriptions
  ])
  .then(([sources, sewingLevels]) => {
    // Render the page without layout
    res.render('public_views/joinTeam', {
      sources,
      sewingLevels,
      title: 'Join the Team',
      layout: false  // Explicitly disable layout
    });
  })
  .catch(error => {
    console.error('Error fetching sources and sewing levels:', error);
    res.status(500).send('Internal Server Error');
  });
});

// Add someone's submission to be a team member to the Database
app.post('/joinTeam', (req, res) => {
  // Extract form values
  const firstName = req.body.firstName || ''; 
  const lastName = req.body.lastName || '';
  const email = req.body.email || '';
  const existingEmail = req.body.existingEmail || '';
  const phone = req.body.phone || ''; 
  const city = req.body.city || ''; 
  const state = req.body.state || ''; 
  const zip = parseInt(req.body.zip, 10) || 84401;
  const source = parseInt(req.body.source, 10); 
  const sewingLevel = parseInt(req.body.sewingLevel, 10);
  const hoursWilling = parseInt(req.body.hoursWilling, 10);

  // Start a transaction
  knex.transaction(trx => {
    let loc_id, contact_id;

    // Step 1: Check if the zip code exists in the 'location' table (for personal info)
    return trx('location')
      .select('loc_id')
      .where('zip', zip)
      .first()
      .then(location => {
        if (location) {
          // Zip code exists, use the existing loc_id
          loc_id = location.loc_id;
        } else {
          // Zip doesn't exist, insert new location into location table
          return trx('location')
            .insert({
              city: city,
              state: state,
              zip: zip,
            })
            .returning('loc_id') // Get the newly inserted loc_id
            .then(newLocation => {
              loc_id = newLocation[0].loc_id; // Capture the new loc_id
            });
        }
      })
      .then(() => {
        // Step 2: Check if the email exists in the 'contact_info' table
          return trx('contact_info')
            .select('contact_id')
            .where('email', existingEmail)  // Use the provided existing email
            .first()
            .then(existingContact => {
              if (existingContact) {
                // If the contact exists, use the existing contact_id
                contact_id = existingContact.contact_id;
              } else {
                // If the contact doesn't exist, create a new contact
                return trx('contact_info')
                  .insert({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    email: email,
                    loc_id: loc_id, // Insert the loc_id for personal info
                  })
                  .returning('contact_id') // Get the newly inserted contact_id
                  .then(newContact => {
                    contact_id = newContact[0].contact_id;  // Capture the new contact_id
                  });
              }
            });
      })
      .then(() => {
        // Step 4: Insert the event into requested_events table
        return trx('team_members')
          .insert({
            contact_id: contact_id,  // Insert the contact_id from contact_info
            source_id: source,
            sewing_level: sewingLevel,
            hours_willing: hoursWilling,
          });
      })
      .then(() => {
        // Commit the transaction and send success response
        res.redirect('/joinTeam?success=true');
      })
      .catch(error => {
        console.error('Error signing up to be a team member:', error);
        res.status(500).send('Internal Server Error');
      });
  });
});






// port number, (parameters) => what you want it to do.

app.listen(PORT, () => console.log('Server started on port ' + PORT));

function toTitleCase(s) {
  return s.toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
}