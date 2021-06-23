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

let isRecording = false;
let isEnrolling = true;
let intervalID;

enrolButton.onclick = function onEnrollButtonClick(){
    isRecording = true;
    window.fetch('/httpstream_demo/start_recording', {
        method: 'POST'
    }).then((res) => {
        repeatEnrolRequest()
        intervalID = setInterval(repeatEnrolRequest, 1000)
    }).catch((e) => {
        console.log(e)
    })
}

let repeatEnrolRequest = () => {
    let username = document.getElementById("inputusername").value
    // repeat every second
    window.fetch('/httpstream_demo/enroll', {
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"username": username})
    }).then(res => {
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
        if(res.status != 411)   clearInterval(intervalID)
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

toggleEnrol.onclick = function onEnrolToggle(){
    // update buttons
    toggleVerify.classList.remove('active')
    toggleEnrol.classList.add('active')
    // switch to enrol screen
    enrolmentBox.classList.remove('d-none')
    verifyBox.classList.add('d-none')
}

toggleVerify.onclick = function onVerifyToggle(){
    // update buttons
    toggleEnrol.classList.remove('active')
    toggleVerify.classList.add('active')
    // switch to verification screen
    verifyBox.classList.remove('d-none')
    enrolmentBox.classList.add('d-none')
}


//==================== Helper methods =====================//

let flashMessage = ( container, message, isWarning ) => {
    container.innerText = message
    if(!isWarning) secondsEnrol.classList.add("text-success")
    setTimeout(function(){
        secondsEnrol.innerText = ""
        secondsEnrol.classList.remove("text-success")
    }, 3000)
}