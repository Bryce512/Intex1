//  *** Log Out handler
document.getElementById('logoutBtn').addEventListener('click', function() {
  // Redirect to logout route
  window.location.href = '/logout';
});

// *** Delete row 
function deleteEntity(deleteAction) {
  // Optional: Confirm before deletion
  const confirmDelete = confirm("Are you sure you want to delete this item?");
  
  if (confirmDelete) {
    // Redirect to the delete URL (or use AJAX for a more seamless experience)
    window.location.href = deleteAction; // This will take the user to the delete route
  }
}


// *** Handle Modal clicks and open
document.addEventListener('DOMContentLoaded', function() {
  // Ensure that the modal and overlay exist before adding the listeners
  const modal = document.getElementById('modal');
  const modal1 = document.getElementById('AddModal');
  const overlay = document.getElementById('overlay');
  const closeModalBtn = document.querySelector('.modal-close');
  const closeAdminModalBtn = document.querySelector('.adminModalClose');
  const addButton = document.getElementById('addButton'); // Reference the Add button
  const deleteButton = document.getElementById('deleteBtn');


  // Function to close the modal
  const closeModal = function () {
    if (modal1){
      modal1.classList.remove('visible');
    } else if (pageType === 'editEvent'){
      window.location.href = '/events';
    }else {
      modal.classList.remove('visible');
      overlay.classList.remove('visible');
      deleteButton.style.display = 'none'; // Hide the delete button when closing modal
    }

  };

  // Open modal function
  const openModal = function () {
    modal.classList.add('visible');
    overlay.classList.add('visible');
  };

  const closeAdminModal = function () {
    modal.classList.remove('visible');
    modal1.classList.remove('visible');
    overlay.classList.remove('visible');
    deleteButton.style.display = 'none'; // Hide the delete button when closing modal
  }

  
  // Close the modal when the cancel button is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if(closeAdminModalBtn) {
    closeAdminModalBtn.addEventListener('click', closeAdminModal);
  }

  // Close modal when clicking the overlay
  if (overlay) {
    overlay.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeAdminModal);

  }


  // Open the modal when the Add button is clicked (reset the form)
  if (addButton) {
    addButton.addEventListener('click', function() {
      if (pageType == "admin") {
        openAddAdminModal()
      } else if (pageType == "team_member") {
        window.location.href = '/joinTeam';
      } else if (pageType == "event") {
        window.location.href = '/event'
      }
      else {
        addModal(); // Reset fields before opening the modal
        openModal(); // Open the modal
      }
    });
  }

// Open Add Admin Modal
    const openAddAdminModal = () => {
      // Show modal
      modal1.classList.add('visible');
      overlay.classList.add('visible');
    };


  // Reset the modal form fields to default (for "Add" functionality)
  const addModal = function () {
    // Select modal elements
    const titleElement = document.getElementById('modalTitle');  // Make sure the ID matches
    const form = document.querySelector('form');
    let title = '';
    let formAction = '';

    
if (pageType === "event") {
        // Populate modal with data
        document.getElementById('entity-first-name').value = '';
        document.getElementById('entity-last-name').value = '';
        document.getElementById('entity-email').value = '';

      // Optionally set the form action
      formAction = `/add-event`;
      title = "Add Event";
    }

    // Set the dynamic title in the modal
      // Ensure the titleElement exists before modifying it
      if (titleElement) {
        titleElement.textContent = title; // Update the title of the modal
      }

    // Set the form action dynamically
    form.setAttribute('action', formAction);
    // Open the modal
    openModal();    
  };

  // Attach row click events dynamically (This is the important part)
  const editModal = () => {
    let title = '';
    const openModalBtns = document.querySelectorAll('.editable-row');
    const titleElement = document.getElementById('modalTitle');  // Make sure the ID matches
    let deleteAction = '';


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

          title = "Edit Admin";
        } else if (entity == "team_member"){
            // pull data from row
            const firstName = row.getAttribute('data-first-name');
            const lastName = row.getAttribute('data-last-name');
            const email = row.getAttribute('data-email');
            const location = row.getAttribute('data-loc');
            const phone = row.getAttribute('data-phone');
            const source = row.getAttribute('data-source');
            const sewing_level = row.getAttribute('data-sewing-level');
            const hours_willing = row.getAttribute('data-hours-willing');

            // Populate modal with data
            document.getElementById('entity-first-name').value = firstName;
            document.getElementById('entity-last-name').value = lastName;
            document.getElementById('entity-email').value = email;
            document.getElementById('entity-loc').value = location;
            document.getElementById('entity-phone').value = phone;
            document.getElementById('entity-source').value = source;
            document.getElementById('entity-sewing-level').value = sewing_level;
            document.getElementById('entity-hours-willing').value = hours_willing;

            title = "Edit Team Member";
        }

        // *** Finalize data before submitting to modal
        deleteAction = `/delete-${entity}/${Id}`;
        const formAction = `/update-${entity}/${Id}`;
        titleElement.textContent = title; // Update the title of the modal

        document.querySelector('form').setAttribute('action', formAction);
        document.getElementById('deleteForm').setAttribute('action', deleteAction);


        // Check if deleteAction exists and display the delete button accordingly
        if (deleteAction) {
          // Show the delete button and set its data-delete-action attribute
          deleteButton.style.display = 'inline-block';
          deleteButton.onclick = function() {
            // Validation: Confirm if the user wants to delete
            const confirmDelete = confirm('Are you sure you want to delete this item?');

            if (confirmDelete) {
              // Perform the delete action when the button is clicked
              document.getElementById('deleteForm').submit();
            }
          };
        }

        if (pageType === "event") {
          window.location.href = `/editEvent/${Id}`;
        } else {
          openModal(); // Open the modal
        }
      
      });
    });
  };

  // Initialize the row click events on page load
  editModal();
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

// *** color change selected Event Filter
document.addEventListener('DOMContentLoaded', function () {
  const currentUrl = window.location.href; // Full URL, including query and hash
  const navLinks = document.querySelectorAll('.eventBtnContainer a');
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href'); // The href of the link
    if ((currentUrl ===('http://localhost:3000' + linkHref)) || (currentUrl ===('https://tsp.brycewhitworth.com' + linkHref))) {
      link.classList.add('active');  // Add active class if URL matches
    } else {
      link.classList.remove('active');  // Remove active class if URL doesn't match
    }
  });
});

// *** SEARCH BAR
// Search function triggered by input in the search box
async function liveSearch(query) {
  console.log("executing search query: " + query)
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
      const lastName = row.getAttribute('data-last-name').toLowerCase();
      const organization = row.getAttribute('data-organization').toLowerCase();
      const date = row.getAttribute('data-date');

      // Check if the query matches the first or last name
      if (firstName.includes(queryLower) || lastName.includes(queryLower) || organization.includes(queryLower)) {
        row.style.display = '';  // Show matching row
      } else {
        row.style.display = 'none';  // Hide non-matching row
      }
    }}
);
}