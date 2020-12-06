(async function homePage() {
    // preset tracking ID for testing
    const trackingSearchValue = document.getElementById('tracking-search-input').value = 'RA644000005RU'

    const trackingForm = document.getElementById('tracking-form')
    console.log(trackingForm)
    const trackingContainerTemplate = document.getElementById('tracking-container-template')
    const formFailContainer = document.getElementById('tracking-form-fail-container')

    let trackingItemTemplate = trackingContainerTemplate.querySelector('#tracking-item-template')
    trackingItemTemplate = trackingItemTemplate.cloneNode(true)
    console.log('cloned tracking item', trackingItemTemplate)

    const trackingItems = trackingContainerTemplate.querySelector('#tracking-items')

    const loaderContainer = document.getElementById('loader-container')
    
    trackingForm.addEventListener("submit", async (event) => {
      try {
          event.preventDefault()
          trackingForm.checkValidity()

          // resets in case there was already a tracking number searched for
          formFailContainer.style.display = 'none'
          trackingContainerTemplate.style.display = 'none'
          trackingItems.innerHTML = ''

          loaderContainer.style.display = 'flex'

          const trackingInput = document.getElementById('tracking-search-input')

          const localBaseUrl = 'http://localhost:5000/api/tracking/'
          const remoteBaseUrl = 'https://ruspost.herokuapp.com/api/tracking/'
          const isLocalEnv = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          const baseUrl = isLocalEnv ? localBaseUrl : remoteBaseUrl
          const requestUrl = baseUrl + trackingInput.value
          console.log('start request')
          const response = await fetch(requestUrl, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache',
              redirect: 'follow',
              referrerPolicy: 'no-referrer',
          })
          const resJson = await response.json()
          console.log('res', response)
          console.log('json',resJson)

          const trackingOperations = resJson.tracking_operations
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

              const deliveryToCountry = trackingOperations[0]['address_parameters']['MailDirect']['NameEN']
              const deliveryToAddress = trackingOperations[0]['address_parameters']['DestinationAddress']['Description']
              const deliveryFromCountry = trackingOperations[0]['address_parameters']['CountryOper']['NameEN']
              const deliveryFromAddress = trackingOperations[0]['address_parameters']['OperationAddress']['Description']
              const currentLocationCountry = trackingOperations[trackingOperations.length - 1]['address_parameters']['CountryOper']['NameEN']
              // set general info
              trackingContainerTemplate.querySelector('#tracking-detail-headline').innerText = `Delivery from ${deliveryFromCountry} to ${deliveryToCountry}`
              trackingContainerTemplate.querySelector('#tracking-detail-subheadline').innerText = trackingSearchValue
              trackingContainerTemplate.querySelector('#tracking-detail-bottom-from-info').innerText = `From: ${[deliveryFromCountry, deliveryFromAddress].filter(val => val).join(', ')}`
              trackingContainerTemplate.querySelector('#tracking-detail-bottom-to-info').innerText = `To: ${[deliveryToCountry, deliveryToAddress].filter(val => val).join(', ')}`
              trackingContainerTemplate.querySelector('#tracking-detail-bottom-location-info').innerText = `Current location: ${currentLocationCountry}`

              // set tracking items
              let lastWasMinimalInfo = false
              for (const operation of trackingOperations) {
                const newTrackingItem = trackingItemTemplate.cloneNode(deep=true)

                console.log(operation)

                const operationCountry = operation['address_parameters']['CountryOper']['NameEN']
                const operationAddress = operation['address_parameters']['OperationAddress']['Description']
                const formattedDateTime = getFormattedDate(operation['operation_parameters']['OperDate'])
                const operationName = operation['operation_parameters']['OperAttr']['Name']
                const operationTypeId = operation['operation_parameters']['OperType']['Id']
                const operationTypeName = operation['operation_parameters']['OperType']['Name']

                newTrackingItem.removeAttribute('id')
                newTrackingItem.querySelector('#tracking-item-icon').src = getIconUrl(operationTypeId)
                let headline, newLastMinimal;
                [headline, newLastMinimal] = getTrackingItemHeadline(operationTypeId, lastWasMinimalInfo, operationTypeName, operationName)
                if (headline && !lastWasMinimalInfo && lastWasMinimalInfo !== newLastMinimal) {
                  lastWasMinimalInfo = newLastMinimal
                  newTrackingItem.querySelector('#tracking-item-headline').innerText = headline
                } else if (headline && !newLastMinimal) {
                  lastWasMinimalInfo = newLastMinimal
                  newTrackingItem.querySelector('#tracking-item-headline').innerText = headline
                } else {
                  lastWasMinimalInfo = newLastMinimal
                  continue
                }
                newTrackingItem.querySelector('#tracking-item-operation-location').innerText = `${[operationCountry, operationAddress].filter(val => val).join(', ')}`
                newTrackingItem.querySelector('#tracking-item-operation-time').innerText = formattedDateTime + " - code: " + operationTypeId

                trackingItems.appendChild(newTrackingItem)
              }

              loaderContainer.style.display = 'none'
              trackingContainerTemplate.style.display = 'block'

              console.log('success')
          } else if (resJson.error) {
              console.error('error json', resJson.error)
              const formFailMessage = document.getElementById('tracking-form-fail-message')

              formFailMessage.innerText = resJson.error
              loaderContainer.style.display = 'none'
              formFailContainer.style.display = 'block'
          }
          loaderContainer.style.display = 'none'
      } catch (e) {
          console.error('unexpected error')
          console.error(e)
          const formFailMessage = document.getElementById('tracking-form-fail-message')

          formFailMessage.innerText = 'Unerwarteter Fehler, bitte versuchen Sie es noch einmal, deaktivieren Sie Ihren Adblocker oder wenden sich an den Support.'
          loaderContainer.style.display = 'none'
          formFailContainer.style.display = 'block'
      }
    })

    /**
    * Handle the different types of icons to be shown.
    */
    const checkIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb787fedb3f051ba17f7ccc_tick.svg'
    const prohibitionIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb24af8dc26867ddea1a367_prohibition.svg'
    const packageIconUrl = 'https://uploads-ssl.webflow.com/5ef2311c8f2d5d28a241aa82/5f0ddd58de790955cac7b116_part2.PNG'
    const operationTypeIdToIconUrlMapping = {
      1: checkIconUrl,
      2: checkIconUrl,
      12: prohibitionIconUrl,
    }
    function getIconUrl(operTypeId) {
      return operationTypeIdToIconUrlMapping[operTypeId] ? operationTypeIdToIconUrlMapping[operTypeId] : packageIconUrl
    }
    function getFormattedDate(date) {
      let operationDate = new Date(date)
      const day = (operationDate.getDate() < 10? '0' : '') + operationDate.getDate()
      const month = (operationDate.getMonth() < 10? '0' : '') + operationDate.getMonth()
      const formattedDate = `${day}.${month}.${operationDate.getFullYear()}`
      return `${formattedDate}, ${operationDate.toTimeString().substr(0,5)}`
    }

    const minimalInfoCodesFilter = {
      8: 'In transit to the next station',
      9: 'In transit to the next station',
      10: 'In transit to the next station',
      11: 'In transit to the next station',
      14: 'In transit to the next station'
    }
    function getTrackingItemHeadline(operTypeId, lastMinimal, operTypeName, operName) {
      if (minimalInfoCodesFilter[operTypeId]) {
        if (lastMinimal) {
          return [undefined, true]
        } else {
          return [minimalInfoCodesFilter[operTypeId], true]
        }
      } else {
        let name = operName ? operName : operTypeName
        return [name, false]
      }
    }
})()
