const Recorder = require('recorderjs')
const ServerRequests = require('./server_requests')

const toggleError = document.getElementById("toggle-error")
const toggleEnrol = document.getElementById("toggle-enrol");
const enrolmentBox = document.getElementById("enroll-box")
const enrolButton = document.getElementById("enrol-button");
const cancelEnrolButton = document.getElementById("cancel-enrol-button")
const enrolProgressBar = document.getElementById("enrol-progress-bar")
const secondsEnrol = document.getElementById("seconds-left-enrol")
const duplicateIDWarning = document.getElementById("id-duplicate-warning")
const enrollUsernameInput = document.getElementById("input-enroll-username")

const toggleVerify = document.getElementById("toggle-verify");
const verifyBox = document.getElementById("verify-box")
const verifyButton = document.getElementById("verify-button")
const endVerifyButton = document.getElementById("end-verify-button")
const verifyStatusMessage = document.getElementById("verify-status-message")
const usernameNotEnrolled = document.getElementById("id-not-enrolled")

const REC_DURATION = 1000;
const serverRequests = new ServerRequests()

let isEnrolling = false;
let isVerifying = false;
let intervalID;
let audioIntervalID;
let gumstream;
let rec
let cur_uuid

//========= Enroll ==========//
enrolButton.onclick = async function onEnrollButtonClick(){
    let username = enrollUsernameInput.value
    // check if username input is empty
    if(username == "" || username == undefined){
        flashMessage(duplicateIDWarning, "아이디를 입력해주세요", true, 2000)
        return
    }
    isEnrolling = true;

   startProcess("enroll")
}

/** task = {"enroll", "verify"} */
let startProcess = (task) => {
    try{
        serverRequests.createStream().then(uuid => {
            cur_uuid = uuid
        })
        startRecording()
        audioIntervalID = setInterval(uploadIntervalRecording, REC_DURATION)  // start repeat upload data
        if(task == "enroll"){
            repeatEnrollRequest()  // start repeat enroll request
        }else{
            repeatVerifyRequest()
        }
    }catch(err){
        // activate enrol/ve button
        enrolButton.classList.remove("d-none")
        cancelEnrolButton.classList.add("d-none")
        verifyButton.classList.remove("d-none")
        endVerifyButton.classList.add("d-none")
        stopRecording()
    }
} 

let repeatEnrollRequest = () => {
    let username = document.getElementById("input-enroll-username").value
    intervalID = setInterval(function(){
        serverRequests.requestEnroll(username).then( result => {
            handleEnrollRequestResult(result.code, result.secondsRecorded)
        })
    }, 1000)
}

/**manipulate DOM according to enrolment result*/
let handleEnrollRequestResult = (statusCode, secondsRecorded) => {
    if(statusCode == 411){  // voiceprint not enough. consider it as ongoing process
        // update buttons
        enrolButton.classList.add("d-none")
        cancelEnrolButton.classList.remove("d-none")
        // update progress bar
        let percent = parseFloat(secondsRecorded)/15*100
        enrolProgressBar.style.setProperty("width", percent+"%")
        // update progress message
        secondsEnrol.innerText = "총 "+secondsRecorded+"초의 성문이 녹음되었습니다. 최소 15초가 필요합니다:)."
    }else if(statusCode == 201){  // enroll successful. stop
        cancelEnrolButton.classList.add("d-none")
        enrolButton.classList.remove("d-none")
        // reset progress bar
        enrolProgressBar.style.setProperty("width", "0")  
        // change progress message to success message
        flashMessage(secondsEnrol, username + "님의 성문이 등록되었습니다!", false)
    }else if(statusCode == 409){
        flashMessage(duplicateIDWarning, "해당 아이디의 유저가 이미 존재합니다", true)
    }else{
        console.log("something went wrong internally")
    }
    if(statusCode != 411){
        stopRecording()
    }
}

cancelEnrolButton.onclick = function onCancelEnroll(){
    // change buttons
    cancelEnrolButton.classList.add("d-none")
    enrolButton.classList.remove("d-none")
    // stop repeating enrol request 
    stopRecording()
}

//========= Verify ==========//

verifyButton.onclick = function onVerify(){
    let username = document.getElementById("input-verify-username").value
    if(username == "" || username == undefined){
        flashMessage(usernameNotEnrolled, "아이디를 입력해주세요", true, 2000)
        return
    }
    isVerifying = true;
    
    startProcess("verify")
}

let handleVerifyRequestResult = (code, secondsRecorded, result) => {
    if(code == 411){  // voiceprint not enough. consider it as ongoing process
        verifyButton.classList.add("d-none")
        endVerifyButton.classList.remove("d-none")
        verifyStatusMessage.innerText = "총 "+secondsRecorded+"초의 성문이 녹음되었습니다. 최소 3초가 필요합니다:)"
    }else if(code == 200){  // verification successful
        displayVerifyResult(verifyStatusMessage, result)
    }else if(code == 404){
        flashMessage(usernameNotEnrolled, "등록된 해당 아이디의 유저가 없습니다", true)
    }else{
        console.log("something went wrong internally")
    }
    if(code != 411 && code != 200){
        stopRecording()
    }
}

let repeatVerifyRequest = () => {
    console.log("reached")
    let username = document.getElementById("input-verify-username").value
    intervalID = setInterval(function(){
        serverRequests.requestVerify(username).then( res => {
            console.log(res)
            handleVerifyRequestResult(res.code, res.secondsRecorded, res.result)
        })
    }, 1000)
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
    if(isVerifying){
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
    if(isEnrolling){
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


//==================== Recorder Helper methods =================//
/**
 * @param {string} task - {"enroll", "verify"}
 */
 let startRecording = (task) => {
    if (navigator.mediaDevices) {
        var constraints = { audio: { sampleSize: 16, channelCount: 1, sampleRate: 16000 } , video: false };
      
        navigator.mediaDevices.getUserMedia(constraints)
        .then(async function(stream) {
            let audioCtx = new AudioContext({sampleRate: 16000})
            
            gumstream = stream
            input = audioCtx.createMediaStreamSource(stream);
            rec = new Recorder(input,{numChannels:1})

            rec.record()
        })
      }
}

let stopRecording = () => {
    clearInterval(intervalID)
    clearInterval(audioIntervalID)
    isEnrolling = false
    isVerifying = false
    if(rec){
        rec.stop()
    }
    gumstream.getAudioTracks()[0].stop();
}

let uploadIntervalRecording = () => {
    rec.exportWAV(uploadWavToStream)
    rec.clear()
}

let uploadWavToStream = (blob) => {
    // let url = URL.createObjectURL(blob)
    // let a = document.createElement("a")
    // document.body.appendChild(a)
    // a.style = "display: none";
    // a.href = url;
    // a.download = "test.wav";
    // a.click(); 

    blob.arrayBuffer().then( buf =>{
        let int16 = new Int16Array(buf)
        let arr = Array.from(int16)

        let mid = Math.ceil(arr.length/2)
        let firstHalf = arr.slice(0, mid)
        let secondHalf = arr.slice(-mid)

        serverRequests.uploadDataToStream(firstHalf, cur_uuid)
        serverRequests.uploadDataToStream(secondHalf, cur_uuid)
    })
}

//==================== General DOM Helper Methods ====================//

let flashMessage = ( container, message, isWarning, duration=10000 ) => {
    container.innerText = message
    if(!isWarning) secondsEnrol.classList.add("text-success")
    setTimeout(function(){
        container.innerText = ""
        container.classList.remove("text-success")
    }, duration)
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