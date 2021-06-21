import express from 'express'
import VVRequests from '../services/vv_requests.js'
import RecorderService from '../services/audio_service.js'
import User from '../models/user.js'
const router = express.Router()
const recorderService = new RecorderService()
const vv_request = new VVRequests()

router.get('/', (req, res) => {
    res.render('index', { action: "/httpstream_demo/enroll", user: new User()})
    // console.log(req.body.inputusername)
    // const vv_requests = new VVRequests()
    // const recorderService = new RecorderService()
    // vv_requests.createStream().then(uuid => {
    //     console.log(uuid)
    //     recorderService.startRecording(uuid)
    //     vv_requests.isRecording = true
    //     // vv_requests.requestEnroll(uuid, "1234")
    //     vv_requests.requestVerify(uuid, "1234")
    //     recorderService.stopRecording()
    //     vv_requests.isRecording = false
    // }).then( uuid => {
    //     console.log("====================")  
    // })
})

router.post('/enroll', (req, res) => {
    // console.log(req.body.username)
    vv_request.requestEnroll(req.body.username)
})

router.post('/verify', (req, res) => {
    vv_request.requestVerify("1234")
})

router.post('/start_recording', (req, res) => {
    // start recorder, start stream, upload stream
    vv_request.createStream().then(uuid => {
        recorderService.startRecording(uuid)
        vv_requests.isRecording = true
    })
})

router.post('/stop_recording', (req, res) => {
    // stop recorder
    recorderService.stopRecording();
    vv_requests.isRecording = false;
})

export {router as httpStreamRoutes}