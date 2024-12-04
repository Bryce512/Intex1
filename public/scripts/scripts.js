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
// *** Handle Modal clicks and open
document.addEventListener('DOMContentLoaded', function() {
  // Ensure that the modal and overlay exist before adding the listeners
  const modal = document.getElementById('modal');
  const overlay = document.getElementById('overlay');
  const closeModalBtn = document.querySelector('.modal-close');

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

  // Attach row click events dynamically (This is the important part)
  const attachRowClickEvents = () => {
    const openModalBtns = document.querySelectorAll('.editable-row');
    openModalBtns.forEach(row => {
      row.addEventListener('click', function () {
        const adminId = row.getAttribute('data-id');
        const firstName = row.getAttribute('data-first-name');
        const lastName = row.getAttribute('data-last-name');
        const email = row.getAttribute('data-email');

        // Populate modal with data
        document.getElementById('entity-first-name').value = firstName;
        document.getElementById('entity-last-name').value = lastName;
        document.getElementById('entity-email').value = email;

        // Optionally set the form action
        const formAction = `/update-admin/${adminId}`;
        document.querySelector('form').setAttribute('action', formAction);

        openModal(); // Open the modal
      });
    });
  };

  // Initialize the row click events on page load
  attachRowClickEvents();

  // Reattach row click events when search results are rendered (if applicable)
  const searchResultsContainer = document.getElementById('searchResults');
  if (searchResultsContainer) {
    searchResultsContainer.addEventListener('DOMNodeInserted', () => {
      attachRowClickEvents();
    });
  }
});



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