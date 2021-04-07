(async function homePage() {
  const emailForm = document.getElementById('email-form');
  const submitButton = document.getElementById('submit-contact-form');
  const languageCode = getLanguageCode();

  emailForm.addEventListener('submit', async (event) => {
    try {
      event.preventDefault();
      emailForm.checkValidity();
      submitButton.disabled = true;

      console.log('Start request');
      submitButton.value = translations['btnSendingForm'][languageCode];
      const url = getRequestUrl();
      const formData = getSerializedFormDataJson();
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
      submitButton.value = translations['btnFormSent'][languageCode];

      displayFeedback(resJson);
    } catch (e) {
      const errorContainer = document.getElementById('error-message-container');
      errorContainer.firstElementChild.innerHTML = translations['unexpectedError'][languageCode];
      submitButton.value = translations['btnSendingFailed'][languageCode];
      errorContainer.style.display = 'block';
    } finally {
      submitButton.style.display = 'none';
    }
  });

  function getLanguageCode() {
    // The website is structured with directories for languages in the first
    // part of the URL path.
    const languageDirectory = window.location.pathname.split('/').filter(pathPart => pathPart)[0];
    // If no directory is given, then most probably we are at the
    // homepage, which uses the default language German.
    if (!languageDirectory) {
      return 'de';
    }
    // If the resulting path part isn't included in the supported languages codes
    // then most likely we are doing the request from local development.
    if (!['en', 'de', 'ru'].includes(languageDirectory)) {
      return 'en';
    }

    return languageDirectory;
  }

  function getRequestUrl() {
    const localBaseUrl = 'http://localhost:5000/api/contact_form';
    const remoteBaseUrl = 'https://ruspost-eu.herokuapp.com/api/contact_form';
    const isLocalEnv = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const baseUrl = isLocalEnv ? localBaseUrl : remoteBaseUrl;
    return baseUrl;
  }

  function getSerializedFormDataJson() {
    const formData = new FormData(emailForm);

    // Add language code.
    formData.append('lang-code', languageCode)

    if (formData.get('issue-type') === null) {
      // Add issue-type manually to determine a target address since it's not
      // provided in the form but we still need a recipient.
      formData.append('issue-type', 'sales@');
    }

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

  // Some translations are just javascript specific and are not to be gotten
  // form the API.
  const translations = {
    'btnSendingForm': {
      'de': 'Wird versendet...',
      'en': 'Sending form...',
      'ru': 'Высылается...'
    },
    'btnFormSent': {
      'de': 'Versandt!',
      'en': 'Sent!',
      'ru': 'Выслано!'
    },
    'btnSendingFailed': {
      'de': 'Nochmal versuchen',
      'en': 'Try again',
      'ru': 'Выслать ещё раз'
    },
    'unexpectedError': {
      'de': 'Unerwarteter Fehler, bitte versuchen Sie es noch einmal, deaktivieren Sie Ihren Adblocker oder wenden sich an den Support.',
      'en': 'Unexpected Error, please try again or contact the support.',
      'ru': 'Неожиданная ошибка, пожалуйста попробуйте ещё раз или обратитесь в поддержку.'
    }
  }
})()
