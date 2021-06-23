import fetch from 'node-fetch'

export default class VVRequests {
    _base_path = 'http://192.168.0.26:8000/api/v2/'
    current_stream = "1"
    token = "dd4eccff7c83a817e80bd9668d34b6835f512ad1"
    status = 404
    recording = false
    remaining_seconds = 15

    constructor() {
        // this.create = this.create.bind(this);
    }

    createStream = ()=>{
        let http_path =  this._base_path + "stream/http"
        return fetch(http_path, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                'frequency': 16000
            })
        }).then(response => response.json())
        .then(data =>{
            this.current_stream = data['uuid']
            return data['uuid']
        })
    }

    uploadDataToStream = (chunk, uuid) => {
        let http_path =  this._base_path + "stream/http/data/" + uuid
        // console.log(http_path)
        fetch(http_path, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                "Content-Type": "application/json",
                "Authorization": "Token " + this.token
            },
            body: chunk
        }).then(response => response)
        .catch(err => {
            console.log(err)
        })
    }

    requestEnroll = (username) => {
        let http_path = this._base_path + 'enroll'
        let obj = this

        return fetch(http_path, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                "Content-Type": "application/json",
                "Authorization": "Token " + obj.token
            },
            body: JSON.stringify({
                "stream_uuid": obj.current_stream,
                "external_id": username
            })
        })

        // repeat every 0.5 sec
        // setTimeout(function(){
        //     fetch(http_path, {
        //         method: 'POST',
        //         headers: {
        //             'accept': 'application/json',
        //             "Content-Type": "application/json",
        //             "Authorization": "Token " + obj.token
        //         },
        //         body: JSON.stringify({
        //             "stream_uuid": obj.current_stream,
        //             "external_id": username
        //         })
        //     }).then(response => {
        //         console.log(response.status)
        //         if(response.status != 201 && obj.isRecording == true){
        //             return response.json()
        //         }else{
        //             obj.remaining_seconds = 0
        //             obj.recording = false
        //         }
        //     }).then(data => {
        //         let regex = /\d+/g;
        //         console.log(data.detail.match(regex)[0])
        //         obj.remaining_seconds = data.detail.match(regex)[0]
        //         if(data != null){
        //             obj.requestEnroll(username)
        //         }
        //     }).catch(err => {
        //         console.log(err)
        //     })
        // }, 500)
    }

    requestVerify = (username) => {
        let http_path =  this._base_path + "stream/http"
        let obj = this;
        return fetch(http_path, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                "Content-Type": "application/json",
                "Authorization": "Token " + obj.token
            },
            body: JSON.stringify({
                "stream_uuid": obj.current_stream,
                "external_id": username
            })
        })
    }
}

// export default VVRequests