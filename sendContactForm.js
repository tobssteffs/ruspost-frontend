(async function homePage() {
  const emailForm = document.getElementById('email-form');

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    emailForm.checkValidity();

    const url = getRequestUrl();

    const formData = getSerializedJson(emailForm);
  });

  function getRequestUrl() {
    const localBaseUrl = 'http://localhost:5000/api/contact_form/';
    const remoteBaseUrl = 'https://ruspost.herokuapp.com/api/contact_form/';
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
})()
