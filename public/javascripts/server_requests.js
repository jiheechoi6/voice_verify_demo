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
            if(code == 201){
                return {code: code, secondsRecorded: 0}
            }
            return res.json()
        }).then( res => {
            let seconds = 0
            if( res.hasOwnProperty('secondsRecorded')){
                seconds = res.secondsRecorded
            }
            return { code: code, secondsRecorded: seconds }
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
            if( res.hasOwnProperty('result') ){
                result = res.result
            }
            return { code: code, secondsRecorded: seconds, result: result }
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

    getAllUsers = () => {
        return window.fetch('/httpstream_demo/users', {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        }).then( res => res.json())
    }

    deleteUser = (username) => {
        return window.fetch('/httpstream_demo/user', {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"username": username})
        }).then( res => res.status)
    }
}

module.exports = VVRequests