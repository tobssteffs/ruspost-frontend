(async function homePage() {
    const trackingForm = document.getElementById('tracking-form')
    const trackingResults = document.getElementById('tracking-search-results')
    
    trackingForm.addEventListener("submit", async (event) => {
        event.preventDefault()
        trackingForm.checkValidity()
        trackingResults.innerHTML = '... loading ...'
        
        const trackingInput = document.getElementById('tracking-search-input')

        const localBaseUrl = 'http://localhost:5000/api/tracking/'
        const remoteBaseUrl = 'https://ruspost.herokuapp.com/api/tracking/'
        const isLocalEnv = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        const baseUrl = isLocalEnv ? localBaseUrl : remoteBaseUrl
        const requestUrl = baseUrl + trackingInput.value
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

        trackingResults.innerHTML = ''
        
        trackingResults.appendChild(document.createTextNode('Ihre Tracking ID: '))
        trackingResults.appendChild(document.createTextNode(trackingInput.value || '-'))
        trackingResults.appendChild(document.createTextNode(' Hat folgende Resultate ergeben:'))
        
        const responseMessage = document.createElement('p')
        responseMessage.innerText = resJson.data || resJson.error
        trackingResults.appendChild(responseMessage)
    })
})()
