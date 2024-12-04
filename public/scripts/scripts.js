document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modals
  var elems = document.querySelectorAll('.modal');
  M.Modal.init(elems);

  // Handle row click event
  var rows = document.querySelectorAll('.editable-row');
  rows.forEach(row => {
    row.addEventListener('click', function() {
      // Get the data from the clicked row
      var id = row.getAttribute('data-id');
      var entity = row.getAttribute('data-entity');  // user, volunteer, event, etc.

      // Dynamically populate modal fields based on the entity type
      if (entity === 'user') {
        var firstName = row.getAttribute('data-first-name');
        var lastName = row.getAttribute('data-last-name');
        var email = row.getAttribute('data-email');

        // Populate modal with data
        document.getElementById('entity-first-name').value = firstName;
        document.getElementById('entity-last-name').value = lastName;
        document.getElementById('entity-email').value = email;
      } 

      else if (entity === 'volunteer') {
        // Get all data attributes
        var firstName = row.getAttribute('data-first-name');
        var lastName = row.getAttribute('data-last-name');
        var email = row.getAttribute('data-email');
        var phone = row.getAttribute('data-phone');
        var sewingLevel = row.getAttribute('data-sewing-level');
        var hoursWilling = row.getAttribute('data-hours-willing');
        var id = row.getAttribute('data-id');

        // Populate modal with volunteer data
        document.getElementById('entity-first-name').value = firstName;
        document.getElementById('entity-last-name').value = lastName;
        document.getElementById('entity-email').value = email;
        document.getElementById('entity-phone').value = phone;
        document.getElementById('entity-sewing-level').value = sewingLevel;
        document.getElementById('entity-hours-willing').value = hoursWilling;

        // Update form action with the correct ID
        document.querySelector('form').action = `/update-volunteer/${id}`;

        // Refresh Materialize inputs
        M.updateTextFields();
      } 

      else if (entity === 'event') {
        var eventName = row.getAttribute('data-name');
        var eventDate = row.getAttribute('data-date');
        
        // Populate modal with event data
        document.getElementById('entity-name').value = eventName;
        document.getElementById('entity-date').value = eventDate;
      }

      // Set the form action dynamically
      var formAction = '/update-' + entity + '/' + id;
      document.querySelector('#modal1 form').setAttribute('action', formAction);

      // Open the modal
      var modal = M.Modal.getInstance(document.getElementById('modal1'));
      modal.open();
    });
  });

  // Add event listeners for row hover
  document.querySelectorAll('.editable-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.classList.add('hover');
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('hover');
    });
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

