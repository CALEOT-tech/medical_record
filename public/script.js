document.addEventListener('DOMContentLoaded', function() {
    // Show registration form and hide register button
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', function() {
            const registrationForm = document.getElementById('registrationForm');
            registrationForm.style.display = 'block';
            registerButton.style.display = 'none';
        });
    }

    const registerButtonadmin = document.getElementById('registerButtonadmin');
    if (registerButtonadmin) {
        registerButtonadmin.addEventListener('click', function() {
            window.location.href = 'register_student.html';
        });
    }

        
    // Handle viewing all students
    const viewAllStudentsButton = document.getElementById('viewAllStudentsButton');
    const viewAllStudentsModal = document.getElementById('viewAllStudentsModal');
    const closeViewAllStudents = document.getElementById('closeViewAllStudents');
    if (viewAllStudentsButton) {
        viewAllStudentsButton.addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:4665/students');
                if (!response.ok) {
                    throw new Error('Error fetching students');
                }
                const students = await response.json();
                const studentTableBody = document.getElementById('allStudentsTable').getElementsByTagName('tbody')[0];
                studentTableBody.innerHTML = ''; // Clear existing rows
                students.forEach(student => {
                    const row = studentTableBody.insertRow();
                    const editCell = row.insertCell(0);
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.className = 'edit-button';
                    editButton.addEventListener('click', () => {
                        document.getElementById('editMatricNo').value = student.matric_no;
                        document.getElementById('editFirstName').value = student.first_name;
                        document.getElementById('editLastName').value = student.last_name;
                        document.getElementById('editDepartment').value = student.department;
                        document.getElementById('editEmail').value = student.email;
                        document.getElementById('editMedicalQuestions').value = student.medical_questions;
                        document.getElementById('editStudentModal').style.display = 'block';
                    });
                    editCell.appendChild(editButton);
                    row.insertCell(1).textContent = student.matric_no;
                    row.insertCell(2).textContent = student.first_name;
                    row.insertCell(3).textContent = student.last_name;
                    row.insertCell(4).textContent = student.department;
                    row.insertCell(5).textContent = student.email;
                });
                viewAllStudentsModal.style.display = 'block';
            } catch (error) {
                console.error('Error fetching students:', error);
                alert('Failed to fetch students');
            }
        });
    }

       // Close the view all students modal
       if (closeViewAllStudents) {
        closeViewAllStudents.addEventListener('click', () => {
            viewAllStudentsModal.style.display = 'none';
        });
    }

    // Handle deleting a student
    const deleteStudentForm = document.getElementById('deleteStudentForm');
    if (deleteStudentForm) {
        deleteStudentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const matricNo = document.getElementById('deleteMatricNo').value;
            try {
                const response = await fetch(`http://localhost:4665/students/${matricNo}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    throw new Error('Error deleting student');
                }
                alert('Student deleted successfully');
                deleteStudentForm.reset();
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Failed to delete student');
            }
        });
    }


    // Close the modal when the close button is clicked
    const closeButton = document.getElementsByClassName("close")[0];
    if (closeButton) {
        closeButton.onclick = function() {
            const modal = document.getElementById('editStudentModal');
            modal.style.display = "none";
        };
    }

    // Handle edit form submission
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const matricNo = document.getElementById('editMatricNo').value;
            const firstName = document.getElementById('editFirstName').value;
            const lastName = document.getElementById('editLastName').value;
            const department = document.getElementById('editDepartment').value;
            const email = document.getElementById('editEmail').value;
            const medicalQuestions = document.getElementById('editMedicalQuestions').value;

            try {
                const response = await fetch(`/api/students/${matricNo}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ firstName, lastName, department, email, medicalQuestions })
                });

                if (!response.ok) {
                    throw new Error('Error updating student');
                }
                alert('Student updated successfully');
                const modal = document.getElementById('editStudentModal');
                modal.style.display = 'none';
            } catch (error) {
                console.error('Error updating student:', error);
                alert('Failed to update student');
            }
        });
    }

    // Handle search form submission
    const searchStudentForm = document.getElementById('searchStudentForm');
    if (searchStudentForm) {
        searchStudentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const matricNo = document.getElementById('searchMatricNo').value;

            try {
                const response = await fetch(`http://localhost:4665/search?matricNo=${matricNo}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const student = await response.json();

                document.getElementById('editMatricNo').value = student.matric_no;
                document.getElementById('editFirstName').value = student.first_name;
                document.getElementById('editLastName').value = student.last_name;
                document.getElementById('editDepartment').value = student.department;
                document.getElementById('editEmail').value = student.email;
                document.getElementById('editMedicalQuestions').value = student.medical_questions;

                // Show the edit modal
                const modal = document.getElementById('editStudentModal');
                modal.style.display = 'block';
            } catch (error) {
                console.error('Error fetching student:', error);
                alert('Student not found');
            }
        });
    }

    // Handle registration form submission
    const registerStudentForm = document.getElementById('registrationFormInner');
    if (registerStudentForm) {
        registerStudentForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const matricNo = document.getElementById('matricNo').value;
            const department = document.getElementById('department').value;
            const email = document.getElementById('email').value;
            const medicalQuestions = document.getElementById('medicalQuestions').value;

            try {
                const response = await fetch('http://localhost:4665/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ firstName, lastName, matricNo, department, email, medicalQuestions })
                });

                if (!response.ok) {
                    throw new Error('Error registering student');
                }
                alert('Student registered successfully');
                registerStudentForm.reset();
            } catch (error) {
                console.error('Error registering student:', error);
                alert('Failed to register student');
            }
        });
    }
});

  // Handle registration form submission for register_student.html
  const registerStudentFormAdmin = document.getElementById('registrationFormInneradmin');
  if (registerStudentFormAdmin) {
      registerStudentFormAdmin.addEventListener('submit', async (event) => {
          event.preventDefault();

          const firstName = document.getElementById('firstName').value;
          const lastName = document.getElementById('lastName').value;
          const matricNo = document.getElementById('matricNo').value;
          const department = document.getElementById('department').value;
          const email = document.getElementById('email').value;
          const medicalQuestions = document.getElementById('medicalQuestions').value;

          try {
              const response = await fetch('http://localhost:4665/register', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ firstName, lastName, matricNo, department, email, medicalQuestions })
              });

              if (!response.ok) {
                  throw new Error('Error registering student');
              }
              alert('Student registered successfully');
              registerStudentFormAdmin.reset();
          } catch (error) {
              console.error('Error registering student:', error);
              alert('Failed to register student');
          }
      });
  }