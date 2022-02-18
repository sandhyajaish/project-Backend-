const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types
const propSchema = new mongoose.Schema({
    imgpath: String
})

mongoose.model("Prop", propSchema)