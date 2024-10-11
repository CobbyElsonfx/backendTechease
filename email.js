// Example Form Submission Handler
const handleSubmit = async (formData) => {
    try {
      // Assuming formData contains email and courseName
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          courseName: formData.courseName,
        }),
      });
  
      const data = await response.json();
      if (data.success) {
        // Show success modal or message
        console.log(data.message);
      } else {
        console.error('Error:', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  