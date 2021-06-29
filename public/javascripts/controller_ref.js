const MicrophoneStream = require("microphone-stream").default
const toWav = require("audiobuffer-to-wav")
const WavEncoder = require("wav-encoder")
const fs = require('fs');

const toggleError = document.getElementById("toggle-error")

const toggleEnrol = document.getElementById("toggle-enrol");
const enrolmentBox = document.getElementById("enroll-box")
const enrolButton = document.getElementById("enrol-button");
const cancelEnrolButton = document.getElementById("cancel-enrol-button")
const enrolProgressBar = document.getElementById("enrol-progress-bar")
const secondsEnrol = document.getElementById("seconds-left-enrol")
const duplicateIDWarning = document.getElementById("id-duplicate-warning")

const toggleVerify = document.getElementById("toggle-verify");
const verifyBox = document.getElementById("verify-box")
const verifyButton = document.getElementById("verify-button")
const endVerifyButton = document.getElementById("end-verify-button")
const verifyProgressBar = document.getElementById("verify-progress-bar")
const verifyStatusMessage = document.getElementById("verify-status-message")
const usernameNotEnrolled = document.getElementById("id-not-enrolled")

let isRecording = false;
let intervalID;
let mediaRecorder;
let micStream;
let chunks = [];
let pass = 0;
// test download audio
setTimeout(function(){
    console.log(chunks)
    let blob = new Blob(chunks, {type:"audio/wav", sampleRate: 16000})
    let url = URL.createObjectURL(blob)
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none";
    a.href = url;
    a.download = "test.wav";
    a.click(); 
    window.URL.revokeObjectURL(url);
}, 9000)

//========= Enrol ==========//
enrolButton.onclick = async function onEnrollButtonClick(){
    isRecording = true;
    window.fetch('/httpstream_demo/start_recording', {
        method: 'POST'
    }).then((res) => {
        repeatEnrolRequest()
        intervalID = setInterval(repeatEnrolRequest, 1000)
    }).catch((e) => {
        console.log(e)
    })

    // await startRecording("enroll")
    // intervalID = setInterval(repeatEnrolRequest, 1000)
}

let startRecording = (task) => {
    console.log(navigator.mediaDevices)
    if (navigator.mediaDevices) {
        console.log('getUserMedia supported.');
      
        var constraints = { audio: { sampleSize: 16, channelCount: 1, sampleRate: 16000 } , video: false };
      
        navigator.mediaDevices.getUserMedia(constraints)
        .then(async function(stream) {
            let audioCtx = new AudioContext({sampleRate: 16000})
            micStream = new MicrophoneStream({context: audioCtx, bufferSize: 4096});
            
            micStream.setStream(stream);
            console.log(stream.getAudioTracks()[0].getSettings())
            // console.log(stream.getAudioTracks()[0].getConstraints())

            createStream().then( uuid => {
                // fetch uuid and assign callback to upload when data is available
                micStream.on('data', (chunk) => {
                    // console.log(chunk)
                    // console.log(toWav(chunk))

                    let uint8 = new Uint8Array(toWav(chunk))

                    window.fetch('/httpstream_demo/upload_data_to_stream', {
                        method: 'POST',
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({"data": Array.from(uint8), "uuid": uuid})
                    }).then(response => response.status)
                    .catch(err => {
                        console.log(err)
                    })
                })

                micStream.on('format', function(format){
                    console.log(format)
                })

                // const source = audioCtx.createMediaStreamSource(stream)
                // const processor = audioCtx.createScriptProcessor(4096, 1, 1)
                // source.connect(processor)
                // processor.connect(audioCtx.destination)
                // processor.onaudioprocess = function(e) {
                //     // console.log(e.inputBuffer.getChannelData(0))
                //     WavEncoder.encode({
                //         sampleRate: 16000,
                //         channelData: [e.inputBuffer.getChannelData(0)]
                //     }).then((buf) =>{
                //         console.log(buf)
                //         chunks.push(buf)
                //         let uint8 = new Uint8Array(buf)
                //         window.fetch('/httpstream_demo/upload_data_to_stream', {
                //             method: 'POST',
                //             headers: {"Content-Type": "application/json"},
                //             body: JSON.stringify({"data": Array.from(uint8), "uuid": uuid})
                //         }).then(response => response.status)
                //         .catch(err => {
                //             console.log(err)
                //         })
                //     })
                // }
                
                if(task == "enroll"){
                    repeatEnrolRequest()
                    intervalID = setInterval(repeatEnrolRequest, 1000)
                }else{
                    repeatVerifyRequest()
                    intervalID = setInterval(repeatVerifyRequest, 500)
                }
            })
        })
      }
}

// creates stream and returns uuid
let createStream = () => {
    return window.fetch("/httpstream_demo/create_stream", {
        method: 'POST',
        headers: {'accept': 'application/json', "Content-Type": "application/json"}
    }).then( res => res.json())
    .then(res => {return res.uuid})
}

let uploadOnDataAvailable = (mediaRecorder, uuid) => {
    mediaRecorder.ondataavailable = async function(e) {
        let buf = await e.data.arrayBuffer()
        let int8 = new Uint8Array(buf)
        let arr = Array.from(int8)

        chunks.push(e.data)

        var reader = new FileReader();
        reader.readAsDataURL(e.data); 
        reader.onloadend = function() {
            window.fetch('/httpstream_demo/upload_data_to_stream', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                // headers: {"Content-Type": "application/octet-stream"},
                body: JSON.stringify({"data": arr, "uuid": uuid})
            }).then(response => response.status)
            .catch(err => {
                console.log(err)
            })
        }

        // window.fetch('/httpstream_demo/upload_data_to_stream', {
        //     method: 'POST',
        //     headers: {"Content-Type": "application/json"},
        //     // headers: {"Content-Type": "application/octet-stream"},
        //     body: JSON.stringify({"data": e.data, "uuid": uuid})
        // }).then(response => response.status)
        // .catch(err => {
        //     console.log(err)
        // })
    }
}

let repeatEnrolRequest = () => {
    let username = document.getElementById("input-enroll-username").value
    // repeat every second
    window.fetch('/httpstream_demo/enroll', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username})
    }).then(res => {
        console.log(res.status)
        if(res.status == 411){  // voiceprint not enough. consider it as ongoing process
            enrolButton.classList.add("d-none")
            cancelEnrolButton.classList.remove("d-none")
            return res.json()
        }else if(res.status == 201){  // enroll successful. stop
            cancelEnrolButton.classList.add("d-none")
            enrolButton.classList.remove("d-none")
            // reset progress bar
            enrolProgressBar.style.setProperty("width", "0")  
            // change progress message to success message
            flashMessage(secondsEnrol, username + "님의 성문이 등록되었습니다!", false)
        }else if(res.status == 409){
            flashMessage(duplicateIDWarning, "해당 아이디의 유저가 이미 존재합니다", true)
        }else{
            console.log("something went wrong internally")
        }
        if(res.status != 411){
            isRecording = false
            clearInterval(intervalID)
            stopRecording()
        }
    }).then(res => {  
        if(res){  // reached only when voiceprint is not enough
            // update progress bar
            let percent = parseFloat(res.secondsRecorded)/15*100
            enrolProgressBar.style.setProperty("width", percent+"%")
            // update progress message
            secondsEnrol.innerText = "총 "+res.secondsRecorded+"초의 성문이 녹음되었습니다. 최소 15초가 필요합니다:)."
        }
    }).catch(e =>{
        // activate enrol button
        enrolButton.classList.remove("d-none")
        cancelEnrolButton.classList.add("d-none")
        clearInterval(intervalID)
    })
}

cancelEnrolButton.onclick = function onCancelEnroll(){
    // change buttons
    cancelEnrolButton.classList.add("d-none")
    enrolButton.classList.remove("d-none")
    // stop repeating enrol request 
    clearInterval(intervalID)
}

//========= Verify ==========//

verifyButton.onclick = function onVerify(){
    isRecording = true;
    window.fetch('/httpstream_demo/start_recording', {
        method: 'POST'
    }).then((res) => {
        repeatVerifyRequest()
        intervalID = setInterval(repeatVerifyRequest, 500)
    }).catch((e) => {
        console.log(e)
    })
}

let repeatVerifyRequest = () => {
    let username = document.getElementById("input-verify-username").value
    // repeat every second
    window.fetch('/httpstream_demo/verify', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username})
    }).then(res => {
        if(res.status == 411){  // voiceprint not enough. consider it as ongoing process
            verifyButton.classList.add("d-none")
            endVerifyButton.classList.remove("d-none")
            return res.json()
        }else if(res.status == 200){  // verification successful
            return res.json() // return for parsing result
        }else if(res.status == 404){
            flashMessage(usernameNotEnrolled, "등록된 해당 아이디의 유저가 없습니다", true)
        }else{
            console.log("something went wrong internally")
        }
        if(res.status != 411 && res.status != 200){
            isRecording = false
            clearInterval(intervalID)
        }
    }).then(res => {  
        if(res){  // reached when voiceprint is not enough or if verification was successful
            if(res.secondsRecorded != undefined){  // voiceprint not enough
                verifyStatusMessage.innerText = "총 "+res.secondsRecorded+"초의 성문이 녹음되었습니다. 최소 3초가 필요합니다:)"
            }else{  // result returned
                let result = res.result
                displayVerifyResult(verifyStatusMessage, result)
            }
        }
    }).catch(e =>{
        // activate verify button
        verifyButton.classList.remove("d-none")
        endVerifyButton.classList.add("d-none")
        clearInterval(intervalID)
    })
}

endVerifyButton.onclick = function endVerify(){
    verifyStatusMessage.innerText = "인증 시작 버튼을 눌러주세요"
    endVerifyButton.classList.add("d-none")
    verifyButton.classList.remove("d-none")
    clearInterval(intervalID)
    isRecording = false
    window.fetch('/httpstream_demo/stop_recording', { method: 'POST'})
}

//============= Toggle =============//

toggleEnrol.onclick = function onEnrolToggle(){
    if(isRecording){
        flashMessage(toggleError, "인증 진행중입니다. 종료후 이용해주세요", true)
        return
    }

    // update buttons
    toggleVerify.classList.remove('active')
    toggleEnrol.classList.add('active')
    // switch to enrol screen
    enrolmentBox.classList.remove('d-none')
    verifyBox.classList.add('d-none')
}

toggleVerify.onclick = function onVerifyToggle(){
    if(isRecording){
        flashMessage(toggleError, "등록 진행중입니다. 종료후 이용해주세요", true)
        return
    }
    // update buttons
    toggleEnrol.classList.remove('active')
    toggleVerify.classList.add('active')
    // switch to verification screen
    verifyBox.classList.remove('d-none')
    enrolmentBox.classList.add('d-none')
}

//==================== Submit on enter for username input ================//
document.getElementById("input-enroll-username").addEventListener("keyup", function(event) {
    // console.log(event.key)
    if(event.key != "Enter"){
        return
    }
    event.preventDefault();

    enrolButton.click();
})



//=========================================================//
//==================== Helper methods =====================//
//=========================================================//

let flashMessage = ( container, message, isWarning ) => {
    container.innerText = message
    if(!isWarning) secondsEnrol.classList.add("text-success")
    setTimeout(function(){
        container.innerText = ""
        container.classList.remove("text-success")
    }, 10000)
}

let stopRecording = () => {
    mediaRecorder.stop()
}

let displayVerifyResult = (container, result) => {
    if(result == "verified"){
        container.innerText = "VERIFIED"
        // container.classList.add("text-success")
        container.style.setProperty("color", "green")
    }else if(result == "not_verified"){
        container.innerText = "NOT VERIFIED"
        container.classList.add("text-danger")
    }else{
        container.innerText = "NOT SURE"
        container.classList.add("text-warning")
    }
}