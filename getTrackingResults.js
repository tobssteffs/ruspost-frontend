(async function homePage() {
    const trackingBtn = document.getElementById('tracking-search-btn')
    console.log('btn', trackingBtn)
    const trackingResults = document.getElementById('tracking-search-results')
    console.log('resultdiv', trackingResults)
    
    trackingBtn.addEventListener("click", async (event) => {
        event.preventDefault()
        trackingResults.innerHTML = '... loading ...'
        
        const trackingInput = document.getElementById('tracking-search-input')
        console.log('inputfield', trackingInput)

        const localBaseUrl = 'http://localhost:5000/api/tracking/'
        const remoteBaseUrl = 'https://ruspost.herokuapp.com/api/tracking/'
        const baseUrl = typeof Webflow === 'undefined' ? localBaseUrl : remoteBaseUrl
        const requestUrl = baseUrl + trackingInput.value
        const response = await fetch(requestUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        })
        console.log('res', response)
        const resJson = await response.json()
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
