// import Recorder from 'recorderjs'
// import getusermedia from 'getusermedia'
// import webaudioapi from 'web-audio-api'
import {SpeechRecorder, getDevices} from 'speech-recorder'
import fs from 'fs'
import AudioRecorder from 'node-audiorecorder'
import VVRequests from './vv_requests.js'
import FormData from 'form-data'
import getUserMedia from 'get-user-media-promise'
import  MicrophoneStream from 'microphone-stream'
//** */
import fetch from 'node-fetch'
const MicStream = MicrophoneStream.default
let micStream

export default class RecorderService {
    audioRecorder = null;
    isRecording = false;
    startRecording(uuid){
        const vvrequests = new VVRequests()
        const options = {
            program: `rec`,     // Which program to use, either `arecord`, `rec`, or `sox`.
            device: null,       // Recording device to use, e.g. `hw:1,0`
            
            bits: 16,           // Sample size. (only for `rec` and `sox`)
            channels: 1,        // Channel count.
            encoding: `signed-integer`,  // Encoding type. (only for `rec` and `sox`)
            format: `S16_LE`,   // Encoding type. (only for `arecord`)
            rate: 16000,        // Sample rate.
            type: `wav`,        // Format type.
            
            // Following options only available when using `rec` or `sox`.
            silence: 200,         // Duration of silence in seconds before it stops recording.
            thresholdStart: 0.5,  // [Silence threshold to start recording.
            thresholdStop: 0.5,   // Silence threshold to stop recording.
            keepSilence: true   // Keep the silence in the recording.
        };
        const logger = console;
        this.audioRecorder = new AudioRecorder(options, logger);
        this.audioRecorder.start().stream().on('data', function(chunk) {
            console.log("Working")
            vvrequests.uploadDataToStream(chunk, uuid)
        });
        // this.isRecording = true;
        // console.log(MicStream)
        // micStream = new MicStream();

        // getUserMedia({ video: false, audio: true })
        // .then(function(stream) {
        //     micStream.setStream(stream);
        //     }).catch(function(error) {
        //         console.log(error);
        //     });
        // // get Buffers (Essentially a Uint8Array DataView of the same Float32 values)
        // micStream.on('data', function(chunk) {
        //     // const raw = MicrophoneStream.toRaw(chunk)
        //     // console.log(chunk)
        //     vvrequests.uploadDataToStream(chunk, uuid)
        // });
    }

    stopRecording(){
        let obj = this;
        setTimeout(function(){
            obj.audioRecorder.stop();
            obj.isRecording = false;
        }, 5000)
    }
}
