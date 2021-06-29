const MicrophoneStream = require("microphone-stream").default
const toWav = require("audiobuffer-to-wav")
const WavEncoder = require("wav-encoder")
const fs = require('fs');
const Recorder = require('recorderjs')
// const WebAudioRecorder = require('web-audio-recorder-js')
require('web-audio-recorder-js')

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
const verifyStatusMessage = document.getElementById("verify-status-message")
const usernameNotEnrolled = document.getElementById("id-not-enrolled")

let isRecording = false;
let intervalID;
let audioIntervalID;
let recordingDuration = 1000;
let gumstream;
let rec
let cur_uuid

//========= Enrol ==========//
enrolButton.onclick = async function onEnrollButtonClick(){
    let username = document.getElementById("input-enroll-username").value
    if(username == "" || username == undefined){
        flashMessage(duplicateIDWarning, "아이디를 입력해주세요", true, 2000)
    }
    isRecording = true;
    await startRecording("enroll")
}

let startRecording = (task) => {
    if (navigator.mediaDevices) {
        var constraints = { audio: { sampleSize: 16, channelCount: 1, sampleRate: 16000 } , video: false };
      
        navigator.mediaDevices.getUserMedia(constraints)
        .then(async function(stream) {
            let audioCtx = new AudioContext({sampleRate: 16000})
            
            gumstream = stream
            input = audioCtx.createMediaStreamSource(stream);
            rec = new Recorder(input,{numChannels:1})

            createStream().then( uuid => {
                cur_uuid = uuid
                rec.record()
                audioIntervalID = setInterval(uploadIntervalRecording, recordingDuration)
                
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

let uploadIntervalRecording = () => {
    rec.exportWAV(uploadWavToStream)
    rec.clear()
}

let uploadWavToStream = (blob) => {
    blob.arrayBuffer().then( buf =>{
        console.log(buf)
        let int16 = new Int16Array(buf)
        let arr = Array.from(int16)

        let mid = Math.ceil(arr.length/2)
        let firstHalf = arr.slice(0, mid)
        let secondHalf = arr.slice(-mid)

        window.fetch('/httpstream_demo/upload_data_to_stream', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"data": firstHalf, "uuid": cur_uuid})
            // body: fd
        }).then(response => response.status)
        .catch(err => {
            console.log(err)
        })
        window.fetch('/httpstream_demo/upload_data_to_stream', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"data": secondHalf, "uuid": cur_uuid})
        }).then(response => response.status)
        .catch(err => {
            console.log(err)
        })
    })
	rec.clear()
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
        // clearInterval(audioIntervalID)
        // clearInterval(intervalID)
        stopRecording()
    })
}

cancelEnrolButton.onclick = function onCancelEnroll(){
    // change buttons
    cancelEnrolButton.classList.add("d-none")
    enrolButton.classList.remove("d-none")
    // stop repeating enrol request 
    stopRecording()

    rec.exportWAV(function(blob){
        let url = URL.createObjectURL(blob)
        let a = document.createElement("a")
        document.body.appendChild(a)
        a.style = "display: none";
        a.href = url;
        a.download = "test.wav";
        a.click(); 
        window.URL.revokeObjectURL(url);
    })
}

//========= Verify ==========//

verifyButton.onclick = function onVerify(){
    let username = document.getElementById("input-verify-username").value
    if(username == "" || username == undefined){
        flashMessage(usernameNotEnrolled, "아이디를 입력해주세요", true, 2000)
        return
    }
    isRecording = true;
    startRecording("verify")
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
            // isRecording = false
            // clearInterval(intervalID)
            // clearInterval(audioIntervalID)
            stopRecording()
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
        // clearInterval(intervalID)
        stopRecording()
    })
}

endVerifyButton.onclick = function endVerify(){
    verifyStatusMessage.innerText = "인증 시작 버튼을 눌러주세요"
    verifyStatusMessage.style.setProperty("color", "black")
    endVerifyButton.classList.add("d-none")
    verifyButton.classList.remove("d-none")
    stopRecording()
}

//============= Toggle =============//

toggleEnrol.onclick = function onEnrolToggle(){
    if(isRecording){
        flashMessage(toggleError, "인증 진행중입니다. 종료후 이용해주세요", true, 2000)
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
        flashMessage(toggleError, "등록 진행중입니다. 종료후 이용해주세요", true, 2000)
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

let flashMessage = ( container, message, isWarning, duration=10000 ) => {
    container.innerText = message
    if(!isWarning) secondsEnrol.classList.add("text-success")
    setTimeout(function(){
        container.innerText = ""
        container.classList.remove("text-success")
    }, duration)
}

let stopRecording = () => {
    clearInterval(intervalID)
    clearInterval(audioIntervalID)
    isRecording = false
    if(rec){
        rec.stop()
    }
    console.log(gumstream.getAudioTracks()[0])

    gumstream.getAudioTracks()[0].stop();
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