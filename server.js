import express from 'express'
import mongoose from 'mongoose'
import {httpStreamRoutes} from './routes/httpstream_demo.js'
import path from 'path'
import bodyParser from 'body-parser'

const app = express()
mongoose.connect('mongodb://localhost/users', {
    useNewUrlParser: true, useUnifiedTopology: true
})
console.log(path.join(path.resolve(path.dirname("")), 'node_modules/node-fetch/lib'))
app.use(express.static(path.join(path.resolve(path.dirname("")), '/public')))
app.use('/lib/', express.static(path.join(path.resolve(path.dirname("")), 'node_modules/node-fetch/lib')));

// app.set('views', './public/views')
// app.set('view engine', 'html')

// app.use(express.urlencoded({extended: false}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use('/httpstream_demo', httpStreamRoutes)

app.listen(4000)

