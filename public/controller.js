// import fetch from 'node-fetch'
// const httpStreamRoutes = require('../routes/httpstream_demo.js')
import httpStreamRoutes from '../routes/httpstream_demo.js'
// import http from 'http'

onEnrollButtonClick = () => {
    console.log(document.getElementById("inputusername").innerText)
    // fetch('/enroll', {
    //     method: 'PUT'
    // })
    htftpStreamRoutes.put("/enroll")
}

// onEnrollButtonClick()