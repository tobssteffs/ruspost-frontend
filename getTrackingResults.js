(async function homePage() {
  const trackingForm = document.getElementById('tracking-form');
  const trackingContainerTemplate = document.getElementById('tracking-container-template');
  const formFailContainer = document.getElementById('tracking-form-fail-container');
  let trackingItemTemplate = trackingContainerTemplate.querySelector('#tracking-item-template');
  trackingItemTemplate = trackingItemTemplate.cloneNode(true);
  const trackingItems = trackingContainerTemplate.querySelector('#tracking-items');
  const loaderContainer = document.getElementById('loader-container');
  const trackingInput = document.getElementById('tracking-search-input');
  const trackingButton = document.getElementById('tracking-search-btn');
  const userLanguageCode = getLanguageCode();
  const getSafeDefault = '';

  trackingForm.addEventListener("submit", async (event) => {
    try {
      event.preventDefault();
      trackingForm.checkValidity();
      trackingButton.disabled = true;

      // resets in case there was already a tracking number searched for
      formFailContainer.style.display = 'none';
      trackingContainerTemplate.style.display = 'none';
      trackingItems.innerHTML = '';

      loaderContainer.style.display = 'flex';

      console.log('Start request');
      const url = getRequestUrl();
      const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
      });
      const data = await response.json();

      const trackingOperations = data.tracking_operations;
      if (Array.isArray(trackingOperations) && trackingOperations.length) {
        /** Handle Russian Post Tracking API operation details:
        *
        * https://tracking.pochta.ru/support/dictionaries/operation_codes
        *
        * From the docs:
        * Note: for some operations, which require the attribute,
        * API of shipment tracking may return attribute value of 0.
        * The Client should interprete such attribute value as the absence of information on the attribute.
        * This rule has only one exception: operation 8 (processing), which has attribute 0 (Sorting) as normal.
        */

        // Get language code for retrieval of the API response's attribute keys.
        const apiLanguageCode = userLanguageCode === 'ru' ? 'RU' : 'EN';
        // Get general API information
        // TODO: Stop depending on the order of the operations somehow.
        // Get the general information from the very first operation.
        const lastTrackingOperationsIndex = trackingOperations.length - 1;
        const lastOperation = trackingOperations[lastTrackingOperationsIndex];
        const mostRecentOperation = trackingOperations[0];

        const deliveryToCountry = getSafeTriple(lastOperation, 'address_parameters', 'MailDirect', `Name${apiLanguageCode}`);
        const deliveryToAddress = getUserFriendlyAddress(getSafeTriple(lastOperation, 'address_parameters', 'DestinationAddress', 'Description'));
        const deliveryFromCountry = getSafeTriple(lastOperation, 'address_parameters', 'CountryFrom', `Name${apiLanguageCode}`)
        const deliveryFromAddress = getUserFriendlyAddress(getSafeTriple(lastOperation, 'address_parameters', 'OperationAddress', 'Description'));
        // Current operation is located in the very beginning of the array, since the sort order is reversed.
        const currentLocationCountry = getSafeTriple(mostRecentOperation, 'address_parameters', 'CountryOper', `Name${apiLanguageCode}`);
        // Set general info
        trackingContainerTemplate.querySelector('#tracking-detail-headline').innerText = `${data.headline} ${deliveryFromCountry} - ${deliveryToCountry}`;
        trackingContainerTemplate.querySelector('#tracking-detail-subheadline').innerText = trackingInput.value;
        trackingContainerTemplate.querySelector('#origin-location').innerText = `${[deliveryFromCountry, deliveryFromAddress].filter(val => val).join(', ')}`;
        trackingContainerTemplate.querySelector('#destination-location').innerText = `${[deliveryToCountry, deliveryToAddress].filter(val => val).join(', ')}`;
        trackingContainerTemplate.querySelector('#current-location').innerText = `${currentLocationCountry}`;

        // set tracking items
        for (const operation of trackingOperations) {
          // As of the specification, OperType and OperAttr ought to be always present.
          const operationTypeId = operation['operation_parameters']['OperType']['Id'];
          const operationTypeName = operation['operation_parameters']['OperType']['Name'];
          const operationAttrId = operation['operation_parameters']['OperAttr']['Id'];
          const operationAttrName = operation['operation_parameters']['OperAttr']['Name'];
          // Still, the name of OperAttr can be missing. Only set tracking item if the operation type name is available.
          if (!operationAttrName) { continue; }
          const operationCountry = getSafeDouble(operation['address_parameters'], 'CountryOper', `Name${apiLanguageCode}`);
          const operationAddress = getUserFriendlyAddress(getSafeDouble(operation['address_parameters'], 'OperationAddress', 'Description'));
          const formattedDateTime = getFormattedDate(getSafeSingle(operation['operation_parameters'], 'OperDate'));

          const newTrackingItem = trackingItemTemplate.cloneNode(deep=true);
          newTrackingItem.removeAttribute('id');
          newTrackingItem.querySelector('#tracking-item-icon').src = getIconUrl(operationTypeId);

          newTrackingItem.querySelector('#tracking-item-headline').innerText = operationAttrName;
          newTrackingItem.querySelector('#tracking-item-operation-location').innerText = `${[operationCountry, operationAddress].filter(val => val).join(', ')}`;
          newTrackingItem.querySelector('#tracking-item-operation-time').innerText = formattedDateTime;

          trackingItems.appendChild(newTrackingItem);
        }

        loaderContainer.style.display = 'none';
        trackingContainerTemplate.style.display = 'block';
      } else if (data.error) {
        console.error('error', data.error);
        const formFailMessage = document.getElementById('tracking-form-fail-message');

        formFailMessage.innerText = data.error;
        loaderContainer.style.display = 'none';
        formFailContainer.style.display = 'block';
      }
      loaderContainer.style.display = 'none';
    } catch (e) {
      console.error('unexpected error');
      console.error(e);
      const formFailMessage = document.getElementById('tracking-form-fail-message');

      formFailMessage.innerText = translations['unexpectedError'][userLanguageCode];
      loaderContainer.style.display = 'none';
      formFailContainer.style.display = 'block';
    } finally {
      trackingButton.disabled = false;
    }
  })

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
    const localBaseUrl = 'http://localhost:5000/api/tracking';
    const remoteBaseUrl = 'https://ruspost-eu.herokuapp.com/api/tracking';
    const isLocalEnv = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const baseUrl = isLocalEnv ? localBaseUrl : remoteBaseUrl;
    return baseUrl + `?tracking_id=${trackingInput.value}&lang_code=${userLanguageCode}`;
  }

  /**
  * Handle the different types of icons to be shown.
  */
  const checkIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb787fedb3f051ba17f7ccc_tick.svg';
  const prohibitionIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb24af8dc26867ddea1a367_prohibition.svg';
  const packageIconUrl = 'https://uploads-ssl.webflow.com/5ef2311c8f2d5d28a241aa82/5f0ddd58de790955cac7b116_part2.PNG';
  const operationTypeIdToIconUrlMapping = {
    1: checkIconUrl,
    2: checkIconUrl,
    12: prohibitionIconUrl,
  }
  function getIconUrl(operTypeId) {
    return operationTypeIdToIconUrlMapping[operTypeId] ? operationTypeIdToIconUrlMapping[operTypeId] : packageIconUrl;
  }
  function getFormattedDate(date) {
    if (date === getSafeDefault || !date) return getSafeDefault
    let operationDate = new Date(date);
    const day = ('0' + operationDate.getDate()).slice(-2)
    const month = ('0' + (operationDate.getMonth() + 1)).slice(-2)
    const formattedDate = `${day}.${month}.${operationDate.getFullYear()}`;
    return `${formattedDate}, ${operationDate.toTimeString().substr(0,5)}`;
  }

  function getUserFriendlyAddress(addr) {
    // Default if addr is blank or
    if (addr === getSafeDefault || !addr) return getSafeDefault;

    let friendlyAddr = removeDigits(addr);
    friendlyAddr = removeAllCAPS(friendlyAddr);
    friendlyAddr = removeNonLetterDanglingChars(friendlyAddr);
    friendlyAddr = removeShortWords(friendlyAddr);
    return friendlyAddr;
  }
  // Numbers shouldn't be part of the address.
  function removeDigits(addr) {
    const newAddr = addr.replace(/[0-9]/g, '');
    return newAddr;
  }
  // Short words like Cp or cex don't help the user.
  function removeShortWords(addr) {
    return addr.split(' ').filter(word => word.length > 3).join(' ');
  }
  // All capital letter words seem to be internal organization abbreviations.
  function removeAllCAPS(addr) {
    // \u0410-\u042F is unicode for the first and last capital letters in the cyrillic alphabet.
    // \u0401 is russian Ё
    const newAddr = addr.replace(/[A-Z\u0410-\u042F\u0401]+[-`' A-Z\u0410-\u042F\u0401]/g, '');
    return newAddr;
  }
  // Sometimes after the removals some dangling special chars are present.
  function removeNonLetterDanglingChars(addr) {
    const newAddr = addr.split('');
    for (var i = newAddr.length - 1; i >= 0; i--) {
      // \u0430-\u044f is unicode for the first and last small letters in the cyrillic alphabet.
      // \u0451 is russian ё
      if (newAddr[i].match(/[a-z\u0430-\u044f\u0451]/i)) {
        break;
      } else {
        newAddr.pop();
      }
    }
    return newAddr.join('');
  }

  /**
  * Avoid errors when item keys are accessed that do not exist.
  */
  function getSafeTriple(item, key1, key2, key3) {
    try {
        const value = item[key1][key2][key3];
        return value ? value : getSafeDefault;
    } catch(e) {
        return getSafeDefault;
    }
  }
  function getSafeDouble(item, key1, key2) {
    try {
        const value = item[key1][key2];
        return value ? value : getSafeDefault;
    } catch(e) {
        return getSafeDefault;
    }
  }
  function getSafeSingle(item, key1) {
    try {
        const value = item[key1];
        return value ? value : getSafeDefault;
    } catch(e) {
        return getSafeDefault;
    }
  }

  /**
   * Some translations are just javascript specific and are not to be gotten
   * form the API.
  */
  const translations = {
    'unexpectedError': {
      'de': 'Unerwarteter Fehler, bitte versuchen Sie es noch einmal, deaktivieren Sie Ihren Adblocker oder wenden sich an den Support.',
      'en': 'Unexpected Error, please try again or contact the support.',
      'ru': 'Неожиданная ошибка, пожалуйста попробуйте ещё раз или обратитесь в поддержку.'
    }
  }
})()
