import express from 'express'
import mongoose from 'mongoose'
import {httpStreamRoutes} from './routes/httpstream_demo.js'
import path from 'path'
import bodyParser from 'body-parser'
import fs from 'fs'
import https from 'https'
import http from 'http'
import multer from 'multer'
import uint8 from 'uint8'
// let privateKey  = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
let privateKey  = fs.readFileSync('./sslcert/cert.key');
// let certificate = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');
let certificate = fs.readFileSync('./sslcert/cert.pem');
let credentials = {key: privateKey, cert: certificate};
let upload = multer()

const app = express()

// mongoose.connect('mongodb://localhost/users', {
//     useNewUrlParser: true, useUnifiedTopology: true
// })

app.use(express.static(path.join(path.resolve(path.dirname("")), '/public')))
app.use('/lib/', express.static(path.join(path.resolve(path.dirname("")), 'node_modules/node-fetch/lib')));

app.use(upload.any());
app.use(express.urlencoded({extended: false}))
// app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(bodyParser.raw({type: "application/octet-stream"}));
app.use('/httpstream_demo', httpStreamRoutes)

let httpServer = http.createServer(app)
let httpsServer = https.createServer(credentials, app);

// httpServer.listen(4000,"192.168.0.176")
httpsServer.listen(3000, "192.168.0.176")

