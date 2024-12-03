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
      var name = row.getAttribute('data-name');
      var email = row.getAttribute('data-email');

      // Populate the modal form with the selected row's data
      document.getElementById('entity-name').value = name;
      document.getElementById('entity-email').value = email;

      // Set the form action dynamically
      var formAction = '/update-' + row.closest('table').dataset.entity + '/' + id;
      document.querySelector('form').setAttribute('action', formAction);

      // Open the modal
      var modal = M.Modal.getInstance(document.getElementById('modal1'));
      modal.open();
    });
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

