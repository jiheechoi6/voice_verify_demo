import express from 'express'
import VVRequests from '../services/vv_requests.js'
import RecorderService from '../services/audio_service.js'
// import User from '../models/user.js'
import multer from 'multer'
const router = express.Router()
const recorderService = new RecorderService()
const vv_request = new VVRequests()

let upload = multer()

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
    })
})

// let mid = upload.fields([{
//     name: 'data', maxCount: 1}, {
//     name: '', maxCount: 1
//   }])
router.post('/upload_data_to_stream', (req, res) => {
    // console.log(req.body.data)
    // let int8 = Uint8Array.from(req.body.data);
    // let int16 = new Int16Array(int8.buffer)
    // let int16test = new Int16Array(int8.buffer, int8.byteOffset, int8.byteLength/int16.BYTES_PER_ELEMENT)
    // let buf = Buffer.from(int16)
    // let lebuf = Buffer.alloc(int16.length)
    // console.log(int8)
    // console.log(int16)
    // console.log(int16test)
    // console.log(buf)
    // console.log(req.body.uuid)

    let buf = Buffer.from(new Int16Array(req.body.data))
    console.log(buf)
    // console.log(req.body.uuid)

    // for(let i=0; i<int16.length-1; i++){
    //     lebuf.writeInt16LE(int16[i], i)
    // }
    // console.log(lebuf)
    vv_request.uploadDataToStream(buf, req.body.uuid)
    //TODO: customize status
    res.sendStatus(200)
})

router.post('/start_recording', (req, res) => {
    // start recorder, start stream, upload stream
    vv_request.createStream().then(uuid => {
        recorderService.startRecording(uuid)
        // vv_requests.isRecording = true;
        res.sendStatus(200)
    }).catch((e)=>{
        console.log(e)
        res.status(400).send(e)
    })
})

router.post('/stop_recording', (req, res) => {
    // stop recorder
    try{
        console.log("stopping recording")
        recorderService.stopRecording();
        vv_request.isRecording = false;
        res.sendStatus(200)
        res.end()
    }catch(e){
        console.log(e)
        res.sendStatus(500)
    }
})

export {router as httpStreamRoutes}