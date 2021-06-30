(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var WORKER_PATH = './recorderWorker.js';

var Recorder = function(source, cfg){
  var config = cfg || {};
  var bufferLen = config.bufferLen || 4096;
  this.context = source.context;
  this.node = (this.context.createScriptProcessor ||
               this.context.createJavaScriptNode).call(this.context,
                                                       bufferLen, 2, 2);
  var worker = new Worker(window.URL.createObjectURL(new Blob(['(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module \'"+o+"\'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){\nvar recLength = 0,\n  recBuffersL = [],\n  recBuffersR = [],\n  sampleRate;\n\n\nself.onmessage = function(e) {\n  switch(e.data.command){\n    case \'init\':\n      init(e.data.config);\n      break;\n    case \'record\':\n      record(e.data.buffer);\n      break;\n    case \'exportWAV\':\n      exportWAV(e.data.type);\n      break;\n    case \'getBuffer\':\n      getBuffer();\n      break;\n    case \'clear\':\n      clear();\n      break;\n  }\n};\n\nfunction init(config){\n  sampleRate = config.sampleRate;\n}\n\nfunction record(inputBuffer){\n  recBuffersL.push(inputBuffer[0]);\n  recBuffersR.push(inputBuffer[1]);\n  recLength += inputBuffer[0].length;\n}\n\nfunction exportWAV(type){\n  var bufferL = mergeBuffers(recBuffersL, recLength);\n  var bufferR = mergeBuffers(recBuffersR, recLength);\n  var interleaved = interleave(bufferL, bufferR);\n  var dataview = encodeWAV(interleaved);\n  var audioBlob = new Blob([dataview], { type: type });\n\n  self.postMessage(audioBlob);\n}\n\nfunction getBuffer() {\n  var buffers = [];\n  buffers.push( mergeBuffers(recBuffersL, recLength) );\n  buffers.push( mergeBuffers(recBuffersR, recLength) );\n  self.postMessage(buffers);\n}\n\nfunction clear(){\n  recLength = 0;\n  recBuffersL = [];\n  recBuffersR = [];\n}\n\nfunction mergeBuffers(recBuffers, recLength){\n  var result = new Float32Array(recLength);\n  var offset = 0;\n  for (var i = 0; i < recBuffers.length; i++){\n    result.set(recBuffers[i], offset);\n    offset += recBuffers[i].length;\n  }\n  return result;\n}\n\nfunction interleave(inputL, inputR){\n  var length = inputL.length + inputR.length;\n  var result = new Float32Array(length);\n\n  var index = 0,\n    inputIndex = 0;\n\n  while (index < length){\n    result[index++] = inputL[inputIndex];\n    result[index++] = inputR[inputIndex];\n    inputIndex++;\n  }\n  return result;\n}\n\nfunction floatTo16BitPCM(output, offset, input){\n  for (var i = 0; i < input.length; i++, offset+=2){\n    var s = Math.max(-1, Math.min(1, input[i]));\n    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);\n  }\n}\n\nfunction writeString(view, offset, string){\n  for (var i = 0; i < string.length; i++){\n    view.setUint8(offset + i, string.charCodeAt(i));\n  }\n}\n\nfunction encodeWAV(samples){\n  var buffer = new ArrayBuffer(44 + samples.length * 2);\n  var view = new DataView(buffer);\n\n  /* RIFF identifier */\n  writeString(view, 0, \'RIFF\');\n  /* RIFF chunk length */\n  view.setUint32(4, 36 + samples.length * 2, true);\n  /* RIFF type */\n  writeString(view, 8, \'WAVE\');\n  /* format chunk identifier */\n  writeString(view, 12, \'fmt \');\n  /* format chunk length */\n  view.setUint32(16, 16, true);\n  /* sample format (raw) */\n  view.setUint16(20, 1, true);\n  /* channel count */\n  view.setUint16(22, 2, true);\n  /* sample rate */\n  view.setUint32(24, sampleRate, true);\n  /* byte rate (sample rate * block align) */\n  view.setUint32(28, sampleRate * 4, true);\n  /* block align (channel count * bytes per sample) */\n  view.setUint16(32, 4, true);\n  /* bits per sample */\n  view.setUint16(34, 16, true);\n  /* data chunk identifier */\n  writeString(view, 36, \'data\');\n  /* data chunk length */\n  view.setUint32(40, samples.length * 2, true);\n\n  floatTo16BitPCM(view, 44, samples);\n\n  return view;\n}\n\n},{}]},{},[1])'],{type:"text/javascript"})));
  worker.onmessage = function(e){
    var blob = e.data;
    currCallback(blob);
  }

  worker.postMessage({
    command: 'init',
    config: {
      sampleRate: this.context.sampleRate
    }
  });
  var recording = false,
    currCallback;

  this.node.onaudioprocess = function(e){
    if (!recording) return;
    worker.postMessage({
      command: 'record',
      buffer: [
        e.inputBuffer.getChannelData(0),
        e.inputBuffer.getChannelData(1)
      ]
    });
  }

  this.configure = function(cfg){
    for (var prop in cfg){
      if (cfg.hasOwnProperty(prop)){
        config[prop] = cfg[prop];
      }
    }
  }

  this.record = function(){
    recording = true;
  }

  this.stop = function(){
    recording = false;
  }

  this.clear = function(){
    worker.postMessage({ command: 'clear' });
  }

  this.getBuffer = function(cb) {
    currCallback = cb || config.callback;
    worker.postMessage({ command: 'getBuffer' })
  }

  this.exportWAV = function(cb, type){
    currCallback = cb || config.callback;
    type = type || config.type || 'audio/wav';
    if (!currCallback) throw new Error('Callback not set');
    worker.postMessage({
      command: 'exportWAV',
      type: type
    });
  }

  source.connect(this.node);
  this.node.connect(this.context.destination);    //this should not be necessary
};

Recorder.forceDownload = function(blob, filename){
  var url = (window.URL || window.webkitURL).createObjectURL(blob);
  var link = window.document.createElement('a');
  link.href = url;
  link.download = filename || 'output.wav';
  var click = document.createEvent("Event");
  click.initEvent("click", true, true);
  link.dispatchEvent(click);
}

module.exports = Recorder;

},{}],2:[function(require,module,exports){
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
},{"./server_requests":3,"recorderjs":1}],3:[function(require,module,exports){
class VVRequests {
    /**Make enroll request, parse result and return status code, message */
    requestEnroll = (username) => {
        let code
        return window.fetch('/httpstream_demo/enroll', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"username": username})
        }).then( res => {
            code = res.status
            return res.json()
        }).then( res => {
            let seconds = 0
            if( res.secondsRecorded != undefined ){
                seconds = res.secondsRecorded
            }
            return { "code": code, "secondsRecorded": seconds }
        })
    }

    requestVerify = (username) => {
        let code
        return window.fetch('/httpstream_demo/verify', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"username": username})
        }).then( res => {
            code = res.status
            return res.json()
        }).then( res => {
            let seconds = 0
            let result = false
            if( res.secondsRecorded != undefined ){
                seconds = res.secondsRecorded
            }
            if( res.result != undefined ){
                result = res.result
            }
            return { "code": code, "secondsRecorded": seconds, "result": result }
        })
    }
    
    /** Creates stream and returns uuid */
    createStream = () => {
        return window.fetch("/httpstream_demo/create_stream", {
            method: 'POST',
            headers: {'accept': 'application/json', "Content-Type": "application/json"}
        }).then( res => res.json())
        .then(res => {return res.uuid})
    }

    uploadDataToStream = (data, uuid) => {
        window.fetch('/httpstream_demo/upload_data_to_stream', {
            method: 'POST',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"data": data, "uuid": uuid})
        }).catch(err => {
            console.log(err)
        })
    }
}

module.exports = VVRequests
},{}]},{},[2]);
