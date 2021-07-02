import express from 'express'
import VVRequests from '../services/vv_requests.js'
import User from '../models/user.js'
const router = express.Router()
const vv_request = new VVRequests()

router.get('/', (req, res) => {
    res.sendFile('/Users/christinechoi/solugate/voice_verify_demo/public/views/index.html')
})

router.post('/enroll', async (req, res) => {
    let username = req.body.username
    vv_request.requestEnroll(username).then( async (response) => {
        if(response.status == 201){
            try{
                const user = new User({
                    username: username,
                    createdAt: Date()
                })
                await user.save()
            }catch(e){
                if(e.code != 11000){ // if not duplicate username warning
                    res.sendStatus(500)
                }
            }

            res.sendStatus(201).send({message: "Enrollment was successful"})
            res.end()
        }else if(response.status == 411){
            return response.json()
        }else if(response.status == 409){
            res.status(409).send({message: "User with this username already exists"})
            res.end()
        }else{
            res.status(response.status).send({message: "Internal Server Error"})
            res.end()
        }
    }).then(data => {
        if(data){
            console.log(data)
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
            // console.log(data)
            if(data.detail){
                let regex = /[+-]?\d+(\.\d+)?/g;
                let seconds_recorded = data.detail.match(regex).map((v)=> {return parseFloat((v))})[0]
                res.send({secondsRecorded: seconds_recorded})
            }else{
                console.log(data.result)
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
    let int16 = new Int16Array(req.body.data)
    // int16 = new Int16Array([1,2,3,4])
    let buf = Buffer.from(new Int16Array(int16))
    // let buf = Buffer.from(req.body.data)
    // console.log(typeof(req.body.data))
    // console.log(req.body.data)
    // console.log(int16)

    vv_request.uploadDataToStream(buf, req.body.uuid)
    //TODO: customize status
    res.sendStatus(200)
})

router.get('/users', async (req, res) => {
    const users = await User.find().sort({createdAt: 'desc'})
    // console.log(users)
    res.status(200).send({ users: users})
})

router.delete('/user', async (req, res) => {
    vv_request.requestDeleteUser(req.body.username).then( async (status) => {
        if(status == 404){
            res.status(404).send({message: "No such user"})
        }else{
            console.log("===============")
            let delRes = await User.remove({username: req.body.username})
            // console.log(delRes.deletedCount)
            res.status(204).send({message: "User was successfully deleted"})
        }
    })
})

// router.get('/test/addusers', (req, res) => {
//     const user = new User({
//         username: "test",
//         createdAt: Date()
//     })
//     await user.save()
//     const user = new User({
//         username: "test1",
//         createdAt: Date()
//     })
//     await user.save()
// })

export {router as httpStreamRoutes}