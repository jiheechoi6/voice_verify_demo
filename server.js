import express from 'express'
import mongoose from 'mongoose'
import {httpStreamRoutes} from './routes/httpstream_demo.js'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
// let privateKey  = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
let privateKey  = fs.readFileSync('./sslcert/cert.key');
// let certificate = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');
let certificate = fs.readFileSync('./sslcert/cert.pem');
let credentials = {key: privateKey, cert: certificate};

const app = express()

mongoose.connect('mongodb://localhost/users', {
    useNewUrlParser: true, useUnifiedTopology: true
})

app.use(express.static(path.join(path.resolve(path.dirname("")), '/public')))
app.use('/lib/', express.static(path.join(path.resolve(path.dirname("")), 'node_modules/node-fetch/lib')));
app.use(express.urlencoded({limit: '50mb'}));
app.use(express.json({limit: '50mb'}))

app.use('/httpstream_demo', httpStreamRoutes)

let httpServer = http.createServer(app)
let httpsServer = https.createServer(credentials, app);

// httpServer.listen(4000,"192.168.0.176")
httpsServer.listen(3000, "192.168.0.176")

