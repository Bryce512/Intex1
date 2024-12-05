//  *** Log Out handler
document.getElementById('logoutBtn').addEventListener('click', function() {
  // Redirect to logout route
  window.location.href = '/logout';
});

// // *** Add button Handler
// document.getElementById('addBtn').addEventListener('click', function() {
//   // run different queries based on page
//   if (entity === 'admin') {
    
//   }
//   else if (entity === 'events') {
    
//   }
//   else if (entity === 'team_members') {
    
//   }
// });


// *** Handle Modal clicks and open
document.addEventListener('DOMContentLoaded', function() {
  // Ensure that the modal and overlay exist before adding the listeners
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('overlay');
  const closeModalBtn = document.querySelector('.modal-close');
  const addButton = document.getElementById('addButton'); // Reference the Add button


  // Function to close the modal
  const closeModal = function () {
    modal.classList.remove('visible');
    overlay.classList.remove('visible');
  };

  // Open modal function
  const openModal = function () {
    modal.classList.add('visible');
    overlay.classList.add('visible');
  };

  // Open the modal when the Add button is clicked (reset the form)
  if (addButton) {
    addButton.addEventListener('click', function() {
      resetBeforeAdd(); // Reset fields before opening the modal
      openModal(); // Open the modal
    });
  }

  // Close the modal when the cancel button is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking the overlay
  if (overlay) {
    overlay.addEventListener('click', closeModal);
  }

  // Close modal when pressing the Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === "Escape" && modal.classList.contains('visible')) {
      closeModal();
    }
  });

  // Reset the modal form fields to default (for "Add" functionality)
  const resetBeforeAdd = function () {
    // Select modal elements
    const titleElement = document.getElementById('modalTitle');  // Make sure the ID matches
    const form = document.querySelector('form');
    let title = '';
    let formAction = '';

    if (pageType === "admin"){
      // Populate modal with data
      document.getElementById('entity-first-name').value = '';
      document.getElementById('entity-last-name').value = '';
      document.getElementById('entity-email').value = '';
      document.getElementById('entity-password').value = '';
      document.getElementById('entity-username').value = '';


      // Optionally set the form action
      formAction = `/add-admin`;
      title = "Add Admin";
    } 
    else if (pageType === "team_member"){
        // Populate modal with data
        document.getElementById('entity-first-name').value = '';
        document.getElementById('entity-last-name').value = '';
        document.getElementById('entity-email').value = '';
        document.getElementById('entity-phone').value = '';
        document.getElementById('entity-sewing-level').value = '';
        document.getElementById('entity-hours-willing').value = '';
        console.log("reset page");

      // Optionally set the form action
      formAction = `/add-event`;
      title = "Add Team Member";
      console.log(title);

    } 
    else if (pageType === "event") {
        // Populate modal with data
        document.getElementById('entity-first-name').value = '';
        document.getElementById('entity-last-name').value = '';
        document.getElementById('entity-email').value = '';

      // Optionally set the form action
      formAction = `/add-event`;
      title = "Add Event";
    }else{
      console.log('failed to make it into loop');
    }

    // Set the dynamic title in the modal
      // Ensure the titleElement exists before modifying it
      if (titleElement) {
        titleElement.textContent = title; // Update the title of the modal
        console.log(pageType);
      }

    // Set the form action dynamically
    form.setAttribute('action', formAction);
    
    // Open the modal
    openModal();    
  };

  // Attach row click events dynamically (This is the important part)
  const attachRowClickEvents = () => {
    const openModalBtns = document.querySelectorAll('.editable-row');
    openModalBtns.forEach(row => {
      row.addEventListener('click', function () {
        const Id = row.getAttribute('data-id');
        const entity = row.getAttribute('data-entity');
        
        if (entity == "admin"){
          // pull data from row
          const firstName = row.getAttribute('data-first-name');
          const lastName = row.getAttribute('data-last-name');
          const email = row.getAttribute('data-email');
          const password = row.getAttribute('data-password');
          const username = row.getAttribute('data-username');

          // Populate modal with data
          document.getElementById('entity-first-name').value = firstName;
          document.getElementById('entity-last-name').value = lastName;
          document.getElementById('entity-email').value = email;
          document.getElementById('entity-password').value = password;
          document.getElementById('entity-username').value = username;


          // Optionally set the form action
          const formAction = `/update-${entity}/${Id}`;
          document.querySelector('form').setAttribute('action', formAction);

          openModal(); // Open the modal

        } else if (entity == "team_member"){
            // pull data from row
            const firstName = row.getAttribute('data-first-name');
            const lastName = row.getAttribute('data-last-name');
            const email = row.getAttribute('data-email');
            const phone = row.getAttribute('data-phone');
            const sewing_level = row.getAttribute('data-sewing-level');
            const hours_willing = row.getAttribute('data-hours-willing');

            // Populate modal with data
            document.getElementById('entity-first-name').value = firstName;
            document.getElementById('entity-last-name').value = lastName;
            document.getElementById('entity-email').value = email;
            document.getElementById('entity-phone').value = phone;
            document.getElementById('entity-sewing-level').value = sewing_level;
            document.getElementById('entity-hours-willing').value = hours_willing;

          // Optionally set the form action
          const formAction = `/update-${entity}/${Id}`;
          document.querySelector('form').setAttribute('action', formAction);
          openModal(); // Open the modal
        } else if (entity == "event") {
            // pull data from row
            const firstName = row.getAttribute('data-first-name');
            const lastName = row.getAttribute('data-last-name');
            const email = row.getAttribute('data-email');

            // Populate modal with data
            document.getElementById('entity-first-name').value = firstName;
            document.getElementById('entity-last-name').value = lastName;
            document.getElementById('entity-email').value = email;

          // Optionally set the form action
          const formAction = `/update-${entity}/${Id}`;
          document.querySelector('form').setAttribute('action', formAction);
          openModal(); // Open the modal
        }
        
      });
    });
  };

  // Initialize the row click events on page load
  attachRowClickEvents();
});

// *** END Modal JS


// *** Handle change row colors on hover
// Add event listeners for row hover


document.querySelectorAll('.editable-row').forEach(row => {
  row.addEventListener('mouseenter', () => {
    row.classList.add('hover');
  });
  row.addEventListener('mouseleave', () => {
    row.classList.remove('hover');
  });
});


// *** color Selected Page in ADMIN Side Nav
document.addEventListener('DOMContentLoaded', function() {
  // Get the current URL path
  const path = window.location.pathname;

  // Select all the nav links
  const navLinks = document.querySelectorAll('.custom-sidenav a');

  // Loop through the links and check if the href matches the current path
  navLinks.forEach(link => {
    // Ensure that the link's href starts with the same path
    if (link.getAttribute('href') === path) {
      link.classList.add('active');  // Add the 'active' class
    } else {
      link.classList.remove('active');  // Ensure it's removed for other links
    }
  });
});

// *** SEARCH BAR
// Search function triggered by input in the search box
async function liveSearch(query) {
  if (!query) {
    // If there's no query, reset the table to show all rows
    const allRows = document.querySelectorAll('#mainTable .editable-row');
    allRows.forEach(row => row.style.display = '');  // Show all rows
    return;
  }

  // Convert the query to lower case for case-insensitive comparison
  const queryLower = query.toLowerCase();
  
  // Get all the rows in the main table
  const rows = document.querySelectorAll('#mainTable .editable-row');

  rows.forEach(row => {
    const entity = row.getAttribute('data-entity').toLowerCase();

    if (entity == 'admin' || entity == 'team_member') {
      const firstName = row.getAttribute('data-first-name').toLowerCase(); // Get first name
      const lastName = row.getAttribute('data-last-name').toLowerCase();   // Get last name

      // Check if the query matches the first or last name
      if (firstName.includes(queryLower) || lastName.includes(queryLower)) {
        row.style.display = '';  // Show matching row
      } else {
        row.style.display = 'none';  // Hide non-matching row
      }
    } else if (entity == 'events') {
      const firstName = row.getAttribute('data-first-name').toLowerCase(); // Get first name

      // Check if the query matches the first or last name
      if (firstName.includes(queryLower) || lastName.includes(queryLower)) {
        row.style.display = '';  // Show matching row
      } else {
        row.style.display = 'none';  // Hide non-matching row
      }
    }}
);
}