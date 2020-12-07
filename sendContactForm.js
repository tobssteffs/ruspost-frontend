(async function homePage() {
  const emailForm = document.getElementById('email-form');
  const submitButton = document.getElementById('submit-contact-form');

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    emailForm.checkValidity();

    console.log('Start request');
    submitButton.value = 'Wird gesendet...';
    const url = getRequestUrl();
    const formData = getSerializedJson(emailForm);
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      headers: {
        'Content-Type': 'application/json'
      },
      body: formData,
    });
    const resJson = await response.json();
    console.log(resJson);
    submitButton.value = 'Versandt!';

    displayFeedback(resJson);
  });

  function getRequestUrl() {
    const localBaseUrl = 'http://localhost:5000/api/contact_form';
    const remoteBaseUrl = 'https://ruspost.herokuapp.com/api/contact_form';
    const isLocalEnv = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const baseUrl = isLocalEnv ? localBaseUrl : remoteBaseUrl;
    return baseUrl;
  }

  function getFormData() {
    return new FormData(emailForm);
  }

  function getSerializedJson() {
    const formData = getFormData();
    var object = {};
    formData.forEach(function(value, key){
        object[key] = value;
    });
    return JSON.stringify(object);
  }

  function displayFeedback(response) {
    if (response['error']) {
      // some kind of a backend error occured
      const errorContainer = document.getElementById('error-message-container');
      errorContainer.firstElementChild.innerHTML = response['error'];
      errorContainer.style.display = 'block';
    } else if (response['mail_sent'] && response['status_code'] === 200) {
      // email has been sent out fine
      const successContainer = document.getElementById('success-message-container');
      successContainer.firstElementChild.innerHTML = response['message'];
      successContainer.style.display = 'block';
    } else {
      // error sending the email occurred
      const errorContainer = document.getElementById('error-message-container');
      errorContainer.firstElementChild.innerHTML = response['message'];
      errorContainer.style.display = 'block';
    }
  }
})()
