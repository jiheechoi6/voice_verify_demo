import express from 'express'
import mongoose from 'mongoose'
import {httpStreamRoutes} from './public/routes/httpstream_demo.js'
import path from 'path'

const app = express()
mongoose.connect('mongodb://localhost/users', {
    useNewUrlParser: true, useUnifiedTopology: true
})
console.log("=====================")
console.log(path.join(path.resolve(path.dirname("")), '/public'))
app.use(express.static(path.join(path.resolve(path.dirname("")), '/public')))

app.set('views', './public/views')
app.set('view engine', 'ejs')

app.use(express.urlencoded({extended: false}))
app.use('/httpstream_demo', httpStreamRoutes)

app.listen(4000)

