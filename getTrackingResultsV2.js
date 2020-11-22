(async function homePage() {
    // preset tracking ID for testing
    document.getElementById('tracking-search-input').value = 'RA644000005RU'

    const trackingForm = document.getElementById('tracking-form')
    console.log(trackingForm)
    const trackingContainerTemplate = document.getElementById('tracking-container-template')
    const formFailContainer = document.getElementById('tracking-form-fail-container')

    let trackingItemTemplate = trackingContainerTemplate.querySelector('#tracking-item-template')
    trackingItemTemplate = trackingItemTemplate.cloneNode(true)
    console.log('cloned tracking item', trackingItemTemplate)

    const trackingItems = trackingContainerTemplate.querySelector('#tracking-items')

    const loaderContainer = document.getElementById('loader-container')
    const checkIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb787fedb3f051ba17f7ccc_tick.svg'
    const prohibitionIconUrl = 'https://assets.website-files.com/5ef2311c8f2d5d28a241aa82/5fb24af8dc26867ddea1a367_prohibition.svg'
    const packageIconUrl = 'https://uploads-ssl.webflow.com/5ef2311c8f2d5d28a241aa82/5f0ddd58de790955cac7b116_part2.PNG'
    
    trackingForm.addEventListener("submit", async (event) => {
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

        loaderContainer.style.display = 'none'
        
        if (resJson.data) {
            /** Handle Russian Post Tracking API operation details:

             https://tracking.pochta.ru/support/dictionaries/operation_codes

             From the docs:
             Note: for some operations, which require the attribute,
             API of shipment tracking may return attribute value of 0.
             The Client should interprete such attribute value as the absence of information on the attribute.
             This rule has only one exception: operation 8 (processing), which has attribute 0 (Sorting) as normal.
            */

            trackingContainerTemplate.querySelector('#tracking-detail-headline').innerText = 'Delivery from Berlin to Moscow'

            const newTrackingItem = trackingItemTemplate.cloneNode(deep=true)

            newTrackingItem.removeAttribute('id')
            newTrackingItem.querySelector('#tracking-item-icon').src = prohibitionIconUrl
            newTrackingItem.querySelector('#tracking-item-headline').innerText = 'Arrived at the Post office'
            newTrackingItem.querySelector('#tracking-item-operation-location').innerText = '644001, Omsk'
            newTrackingItem.querySelector('#tracking-item-operation-time').innerText = '24th of March 2015, 10:00'

            trackingItems.appendChild(newTrackingItem)

            trackingContainerTemplate.style.display = 'block'
            
            console.log('modified trackingitem', newTrackingItem)
            console.log('success')
        } else if (resJson.error) {
            console.log('error json', resJson.error)
            const formFailMessage = document.getElementById('tracking-form-fail-message')

            formFailMessage.innerText = resJson.error
            formFailContainer.style.display = 'block'
        }
    })

    function getIconUrl(operTypeId) {
      return 'afd'
    }
})()
