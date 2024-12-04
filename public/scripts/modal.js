// document.addEventListener('DOMContentLoaded', function() {
//   console.log('DOM fully loaded and parsed');

//   // Delegate click events on dynamically added rows
//   document.getElementById('searchResults').addEventListener('click', function(event) {
//     const row = event.target.closest('.editable-row');
    
//     // Only trigger if an editable row is clicked
//     if (row) {
//       console.log('Editable row clicked:', row);
//       // Get the data from the clicked row
//       var id = row.getAttribute('data-id');
//       var entity = row.getAttribute('data-entity');  // admin, team_member, event, etc.

//       // Dynamically populate modal fields based on the entity type
//       if (entity === 'admin') {
//         var firstName = row.getAttribute('data-first-name');
//         var lastName = row.getAttribute('data-last-name');
//         var email = row.getAttribute('data-email');

//         // Populate modal with data
//         document.getElementById('entity-first-name').value = firstName;
//         document.getElementById('entity-last-name').value = lastName;
//         document.getElementById('entity-email').value = email;
//       } 

//       else if (entity === 'team_member') {
//         // Get all data attributes
//         var firstName = row.getAttribute('data-first-name');
//         var lastName = row.getAttribute('data-last-name');
//         var email = row.getAttribute('data-email');
//         var phone = row.getAttribute('data-phone');
//         var sewingLevel = row.getAttribute('data-sewing-level');
//         var hoursWilling = row.getAttribute('data-hours-willing');
//         var id = row.getAttribute('data-id');

//         // Populate modal with team_member data
//         document.getElementById('entity-first-name').value = firstName;
//         document.getElementById('entity-last-name').value = lastName;
//         document.getElementById('entity-email').value = email;
//         document.getElementById('entity-phone').value = phone;
//         document.getElementById('entity-sewing-level').value = sewingLevel;
//         document.getElementById('entity-hours-willing').value = hoursWilling;

//         // Update form action with the correct ID
//         document.querySelector('form').action = `/update-team_member/${id}`;

//         // Refresh Materialize inputs
//         M.updateTextFields();
//       } 

//       else if (entity === 'event') {
//         var eventName = row.getAttribute('data-name');
//         var eventDate = row.getAttribute('data-date');
        
//         // Populate modal with event data
//         document.getElementById('entity-name').value = eventName;
//         document.getElementById('entity-date').value = eventDate;
//       }

//       // Set the form action dynamically
//       var formAction = '/update-' + entity + '/' + id;
//       document.querySelector('#modal1 form').setAttribute('action', formAction);

//       // Open the modal
//       var modal = M.Modal.getInstance(document.getElementById('modal1'));
//       if (modal) {
//         console.log('Modal found!');
//       } else {
//         console.log('Modal element not found');
//       }
//       modal.open();
//     }
//   });
//   });