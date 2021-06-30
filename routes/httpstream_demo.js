import express from 'express'
import VVRequests from '../services/vv_requests.js'
// import User from '../models/user.js'
const router = express.Router()
const vv_request = new VVRequests()

router.get('/', (req, res) => {
    res.sendFile('/Users/christinechoi/solugate/voice_verify_demo/public/views/index.html')
})

router.post('/enroll', (req, res) => {
    vv_request.requestEnroll(req.body.username).then(response => {
        console.log(response.status)
        if(response.status == 201){
            res.sendStatus(201)
            res.end()
        }else if(response.status == 411){
            return response.json()
        }else if(response.status == 409){
            res.status(409).send({message: "User with this username already exists"})
            res.end()
        }else{
            res.status(response.status).send({message: "Internal Server Error"})
        }
    }).then(data => {
        if(data){
            var regex = /[+-]?\d+(\.\d+)?/g;
            let seconds_recorded = data.detail.match(regex).map((v)=> {return parseFloat((v))})[0]
            res.status(411).send({secondsRecorded: seconds_recorded})
        }
    }).catch(err => {
        console.log(err)
        res.status(500).send(err)
    })
})

router.post('/verify', (req, res) => {
    vv_request.requestVerify(req.body.username)
    .then(response => {
        console.log(response.status)
        if(response.status == 200){  // return result
            res.status(200)
            return response.json()
        }else if(response.status == 404){  // id not registered
            res.status(404).send({message: "User with this username was not found"})
            res.end()
        }else if(response.status == 411){  // not enough voiceprint
            res.status(411)
            return response.json();
        }else{
            res.status(500).send({message: "Internal Server Error"})
            res.end()
        }
    }).then( data => { // reaches only for status code 411
        if(data){
            console.log(data)
            if(data.detail){
                let regex = /[+-]?\d+(\.\d+)?/g;
                let seconds_recorded = data.detail.match(regex).map((v)=> {return parseFloat((v))})[0]
                res.send({secondsRecorded: seconds_recorded})
            }else{
                res.send({result : data.result})
            }
        }
    }).catch(err => {
        console.log(err)
    })
})

router.post('/create_stream', (req, res) => {
    vv_request.createStream().then( uuid => {
        res.status(200).send({uuid:uuid})
    }).catch(err => {
        res.status(500).send({message: "Internal Server Errors"})
    })
})

router.post('/upload_data_to_stream', (req, res) => {
    let buf = Buffer.from(new Int16Array(req.body.data))

    vv_request.uploadDataToStream(buf, req.body.uuid)
    //TODO: customize status
    res.sendStatus(200)
})

export {router as httpStreamRoutes}