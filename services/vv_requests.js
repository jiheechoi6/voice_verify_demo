import fetch from 'node-fetch'

export default class VVRequests {
    _base_path = 'http://192.168.0.28:8000/api/v2/'
    current_stream = "1"
    token = "dd4eccff7c83a817e80bd9668d34b6835f512ad1"
    status = 404
    recording = false
    remaining_seconds = 15
    isStreamCreated = false

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
        console.log(chunk)
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
        console.log(username)
        console.log(obj.current_stream)

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

    requestVerify = (username) => {
        let http_path =  this._base_path + "verify"
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