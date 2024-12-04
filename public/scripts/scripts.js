//  *** Log Out handler
document.getElementById('logoutBtn').addEventListener('click', function() {
  // Redirect to logout route
  window.location.href = '/logout';
});

// // *** Add button Handler
// document.getElementById('addBtn').addEventListener('click', function() {
//   // run different queries based on page
//   if (entity === 'user') {
    
//   }
//   else if (entity === 'events') {
    
//   }
//   else if (entity === 'volunteers') {
    
//   }
// });

// *** Handle Modal clicks and open
document.addEventListener('DOMContentLoaded', function() {
  // Ensure that the close button exists before adding the listener
  const closeModalBtn = document.querySelector('.modal-close');
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('modal1');

  // Function to close the modal
  const closeModal = function () {
    modal.classList.remove('visible');
    overlay.classList.remove('visible');
  };

  // Close the modal when the cancel button is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
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
  })
});

const openModalBtns = document.querySelectorAll('.editable-row'); // Update this selector to match your rows

// Open modal when a row is clicked
openModalBtns.forEach(row => {
  row.addEventListener('click', function () {
    const userId = row.getAttribute('data-id');
    const firstName = row.getAttribute('data-first-name');
    const lastName = row.getAttribute('data-last-name');
    const email = row.getAttribute('data-email');

    // Populate modal with data
    document.getElementById('entity-first-name').value = firstName;
    document.getElementById('entity-last-name').value = lastName;
    document.getElementById('entity-email').value = email;

    // Optionally set the form action
    const formAction = `/update-user/${userId}`;
    document.querySelector('form').setAttribute('action', formAction);

    openModal(); // Open the modal
  });
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

