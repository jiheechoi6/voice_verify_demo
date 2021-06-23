import express from 'express'
import VVRequests from '../services/vv_requests.js'
import RecorderService from '../services/audio_service.js'
import User from '../models/user.js'
const router = express.Router()
const recorderService = new RecorderService()
const vv_request = new VVRequests()

router.get('/', (req, res) => {
    res.sendFile('/Users/christinechoi/solugate/voice_verify_demo/public/views/index.html')
})

router.post('/enroll', (req, res) => {
    vv_request.requestEnroll(req.body.username).then(response => {
        console.log(response.status)
        if(response.status == 201){
            res.statusSend(201)
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
            // let regex = /\d+/g;
            // let remaining_seconds = data.detail.match(regex)[0];
            var regex = /[+-]?\d+(\.\d+)?/g;
            let seconds_recorded = data.detail.match(regex).map((v)=> {return parseFloat((v))})[0]
            res.status(411).send({secondsRecorded: seconds_recorded})
        }
    }).catch(err => {
        console.log(err)
        express.status(500).send(e)
    })
})

router.post('/verify', (req, res) => {
    vv_request.requestVerify("1234")
    .then(response => {
        if(response.status == 200){  // return result
            res.status(200).send(response.result)
        }else if(response.status == 404){  // id not registered
            res.status(504).send({message: "User with this username was not found"})
        }else if(response.status == 411){  // not enough voiceprint
            return response.json();
        }else{
            res.status(500).send({message: "Internal Server Error"})
        }
    }).then( data => { // reaches only for status code 411
        let regex = /\d+/g;
        let remaining_seconds = data.detail.match(regex)[0]
        res.status(411).send({seconds: remaining_seconds})
    }).catch(err => {
        console.log(err)
    })
})

router.post('/start_recording', (req, res) => {
    // start recorder, start stream, upload stream
    vv_request.createStream().then(uuid => {
        recorderService.startRecording(uuid)  // start recording and 
        vv_requests.isRecording = true;
        res.statusSend(200)
    }).catch((e)=>{
        res.status(400).send(e)
    })
})

router.post('/stop_recording', (req, res) => {
    // stop recorder
    recorderService.stopRecording();
    vv_requests.isRecording = false;
})

export {router as httpStreamRoutes}