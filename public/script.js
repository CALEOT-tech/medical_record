document.addEventListener('DOMContentLoaded', () => {
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
      registerButton.addEventListener('click', () => {
        const registrationForm = document.getElementById('registrationForm');
        registrationForm.style.display = 'block';
        registerButton.style.display = 'none';
      });
    }
  
    const registerButtonAdmin = document.getElementById('registerButtonadmin');
    if (registerButtonAdmin) {
      registerButtonAdmin.addEventListener('click', () => {
        window.location.href = 'register_student.html';
      });
    }
  
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
  
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
  
        try {
          const response = await fetch('https://medical-record-pq83.onrender.com/admin/login', { // Update URL
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Login failed');
            }
          
  
          const result = await response.json();
          window.location.href = 'https://medical-record-pq83.onrender.com/admin_dashboard.html';
        } catch (error) {
          console.error('Error during login:', error);
          alert(error.message);
        }
      });
    }

    // Handle viewing all students
    const viewAllStudentsButton = document.getElementById('viewAllStudentsButton');
    const viewAllStudentsModal = document.getElementById('viewAllStudentsModal');
    const closeViewAllStudents = document.getElementById('closeViewAllStudents');
    if (viewAllStudentsButton) {
        viewAllStudentsButton.addEventListener('click', async () => {
            try {
                const response = await fetch('https://medical-record-pq83.onrender.com/students');
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
                    editButton.addEventListener('click', () => {
                        document.getElementById('editMatricNo').value = student.matric_no;
                        document.getElementById('editFirstName').value = student.first_name;
                        document.getElementById('editLastName').value = student.last_name;
                        document.getElementById('editDepartment').value = student.department;
                        document.getElementById('editEmail').value = student.email;
                        document.getElementById('editmedications').value = student.medications;
                        document.getElementById('editpreviousTreatments').value = student.previousTreatments;
                        document.getElementById('edithealthConditions').value = student.healthConditions;
                        document.getElementById('editMedicalQuestions').value = student.medical_questions;
                        document.getElementById('editStudentModal').style.display = 'block';
                    });
                    editCell.appendChild(editButton);
                    row.insertCell(1).textContent = student.matric_no;
                    row.insertCell(2).textContent = student.first_name;
                    row.insertCell(3).textContent = student.last_name;
                    row.insertCell(4).textContent = student.department;
                    row.insertCell(5).textContent = student.email;
                    row.insertCell(6).textContent = student.medications;
                    row.insertCell(7).textContent = student.previousTreatments;
                    row.insertCell(8).textContent = student.healthConditions;
                    row.insertCell(9).textContent = student.medical_questions;
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
  
  
  //Handle deleting a student
    const deleteStudentForm = document.getElementById('deleteStudentForm');
    if (deleteStudentForm) {
      deleteStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const matricNo = document.getElementById('deleteMatricNo').value;
        try {
          const response = await fetch(`https://medical-record-pq83.onrender.com/students/${matricNo}`, { // Update URL
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
  //Handle edit form submission
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
      editStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
  
        const matricNo = document.getElementById('editMatricNo').value;
        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;
        const department = document.getElementById('editDepartment').value;
        const email = document.getElementById('editEmail').value;
        const medications = document.getElementById('editmedications').value;
        const previousTreatments = document.getElementById('editpreviousTreatments').value;
        const healthConditions = document.getElementById('edithealthConditions').value;
        const medicalQuestions = document.getElementById('editMedicalQuestions').value;
  
  
        try {
          const response = await fetch(`https://medical-record-pq83.onrender.com/api/students/${matricNo}`, { // Update URL
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, department, email, medications, previousTreatments, healthConditions, medicalQuestions })
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
  //Handle search form submission
    const searchStudentForm = document.getElementById('searchStudentForm');
    if (searchStudentForm) {
      searchStudentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const matricNo = document.getElementById('searchMatricNo').value;
  
        try {
          const response = await fetch(`https://medical-record-pq83.onrender.com/search?matricNo=${matricNo}`); // Update URL
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const student = await response.json();
  
          document.getElementById('editMatricNo').value = student.matric_no;
          document.getElementById('editFirstName').value = student.first_name;
          document.getElementById('editLastName').value = student.last_name;
          document.getElementById('editDepartment').value = student.department;
          document.getElementById('editEmail').value = student.email;
          document.getElementById('editmedications').value;
          document.getElementById('editpreviousTreatments').value;
          document.getElementById('edithealthConditions').value;
          document.getElementById('editMedicalQuestions').value = student.medical_questions;
  
          const modal = document.getElementById('editStudentModal');
          modal.style.display = 'block';
        } catch (error) {
          console.error('Error fetching student:', error);
          alert('Student not found');
        }
      });
    }
  
     // Handle registration form submission for index.html
     const registerStudentForm = document.getElementById('registrationFormInner');
     if (registerStudentForm) {
         registerStudentForm.addEventListener('submit', async (event) => {
             event.preventDefault();
 
             const firstName = document.getElementById('firstName').value;
             const lastName = document.getElementById('lastName').value;
             const matricNo = document.getElementById('matricNo').value;
             const department = document.getElementById('department').value;
             const email = document.getElementById('email').value;
             const medications = document.getElementById('medications').value;
             const previousTreatments = document.getElementById('previousTreatments').value;
             const healthConditions = document.getElementById('healthConditions').value;
             const medicalQuestions = document.getElementById('medicalQuestions').value;
 
             try {
                 const response = await fetch('https://medical-record-pq83.onrender.com/register', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json'
                     },
                     body: JSON.stringify({ firstName, lastName, matricNo, department, email,medications, previousTreatments, healthConditions, medicalQuestions })
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
             const medications = document.getElementById('editmedications').value;
             const previousTreatments = document.getElementById('editpreviousTreatments').value;
             const healthConditions = document.getElementById('edithealthConditions').value;
             const medicalQuestions = document.getElementById('medicalQuestions').value;
 
             try {
                 const response = await fetch('https://medical-record-pq83.onrender.com/register', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json'
                     },
                     body: JSON.stringify({ firstName, lastName, matricNo, department, email, medicalQuestions, medications, previousTreatments, healthConditions })
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
    });