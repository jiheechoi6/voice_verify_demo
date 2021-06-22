const enrolmentBox = document.getElementById("enroll-box")
const verifyBox = document.getElementById("verify-box")
const enrolButton = document.getElementById("enrol-button");
const cancelEnrolButton = document.getElementById("cancel-enrol-button")
const toggleEnrol = document.getElementById("toggle-enrol");
const toggleVerify = document.getElementById("toggle-verify");
let isRecording = false;
let isEnrolling = true;

enrolButton.onclick = function onEnrollButtonClick(){
    isRecording = true;
    // repeat every second
    setTimeout(window.fetch('/httpstream_demo/enroll', {
        method: 'POST',
        body: {"username": document.getElementById("inputusername").value}
    }).then(res => {
        if(res.status == 309){  // voiceprint not enough. consider it as ongoing process
            alert("hi")
            enrolButton.classList.add("d-none")
            cancelEnrolButton.classList.remove("d-none")
            
            onEnrollButtonClick()
        }else if(res.status == 200){  // enroll successful. stop
            cancelEnrolButton.classList.add("d-none")
            enrolButton.classList.remove("d-none")
        }else if(res.status == 411){  // not enough voiceprint
            
        }else{
            console.log("something went wrong internally")
        }
        return res.json()
    }).then(res => console.log(res)), 1000)
}

toggleEnrol.onclick = function onEnrolToggle(){
    enrolmentBox.classList.remove('d-none')
    verifyBox.classList.add('d-none')
}

toggleVerify.onclick = function onVerifyToggle(){
    console.log(verifyBox)
    verifyBox.classList.remove('d-none')
    enrolmentBox.classList.add('d-none')
}