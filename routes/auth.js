const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
// const Prop = mongoose.model("Prop");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, EMAIL } = require('../config/prod');
const requireLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer');
const console = require('console');
const AWS = require("aws-sdk"); 
const prod = require('../config/prod');  
const AWSAccessKeyId = process.env.AWSAccessKeyId;
const AWSSecretKey = process.env.AWSSecretKey;
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3({
  accessKeyId: AWSAccessKeyId,
  secretAccessKey: AWSSecretKey,
});
// const fileUpload = require('express-fileupload');
// const cloudinary = require("cloudinary").v2;
// const sendgridTransport = require('nodemailer-sendgrid-transport')
// const {SENDGRID_API,EMAIL} = require('../config/prod')
// const { EMAIL } = require('../config/prod');


// const transporter = nodemailer.createTransport(sendgridTransport({
//     auth:{
//         api_key:SENDGRID_API
//     }
// }))    


// //UPLOAD THE FILE   
// cloudinary.config({
//     cloud_name: 'dp9jvbiat',
//     api_key: '319956962321696',
//     api_secret: 'c7EHBHKCaFENnGvQf5ojlZOzEbU'
// })
// app.use(
//     fileUpload({
//         useTempFiles: true
//     })

// )



// router.post('/upload', (req, res) => {
//     const { img } = req.body
//     console.log(req.body);
//     if (!photo) {
//         return res.status(422).json({ error: "please add all the fields" })
//     }
//     User.findOne({ photo: photo })
//         .then((savedUser) => {
//             if (savedUser) {
//                 return res.status(422).json({ error: "photo already exists with that email" })
//             }

//             const user = new User({
//                 photo

//             })

//             user.save()
//                 .then(user => {
//                     res.json({ message: "saved successfully" })
//                 })
//                 .catch(err => {
//                     console.log(err)
//                 })
//         })

// })
//     .catch(err => {
//         console.log(err)
//     })

// router.post('/uploadimage', (req, res) => {
//     console.log(req.body);
//     const file = req.files.img;
//     cloudinary.uploader.upload(file.tempFilepath, (err, result) => {
//         console.log(result);
//         // Prop = new Prop({
//         //     imagePath: result.url
//         // });
//         // Prop.save();
//     })
// });

router.get('/all_signup_user_list', async(req, res) => {
    try {
        const sdata = await User.find();
        res.send(sdata);
    } catch (error) {
        res.send(error)
    }
});
//FIND BY ID 

router.get('/all_signup_user_list/:id', requireLogin, async(req, res) => {
    try {
        const _id = req.params.id;
        const sdata = await User.findById(_id);
        res.send(sdata);
    } catch (error) {
        res.send(error)
    }
});
//DELETE BY ID

router.delete('/all_signup_user_list/:id', requireLogin, async(req, res) => {
    try {
        const _id = req.params.id;
        const sdata = await User.findByIdAndDelete(_id);
        res.send("deleted successfully ");
    } catch (error) {
        res.send(error)
    }
});

// UPDATED BY ID 
router.patch('/all_signup_user_list/:id', requireLogin, async(req, res) => {
    try {
        const _id = req.params.id;
        const sdata = await User.findByIdAndUpdate(_id, req.body, {
            new: true
        });
        res.send(sdata);
    } catch (error) {
        res.send(error)
    }
}); 
router.post('/signup', (req, res) => {
    const { name, email, password, } = req.body
    console.log(req.body);
    if (!email || !password || !name) {
        return res.status(422).json({ error: "please add all the fields" })
    }
    User.findOne({ email: email })
        .then((savedUser) => {
            if (savedUser) {
                return res.status(422).json({ error: "user already exists with that email" })
            }
            bcrypt.hash(password, 12)
                .then(hashedpassword => {
                    const user = new User({
                        email,
                        password: hashedpassword,
                        name

                    })

                    user.save()
                        .then(user => {
                            // transporter.sendMail({
                            //     to:user.email,
                            //     from:"no-reply@insta.com",
                            //     subject:"signup success",
                            //     html:"<h1>welcome to instagram</h1>"
                            // })
                            res.json({ message: "saved successfully" })
                        })
                        .catch(err => {
                            console.log(err)
                        })
                })

        })
        .catch(err => {
            console.log(err)
        })
})


router.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(422).json({ error: "please add email or password" });
    }
    User.findOne({ email: email })
        .then(savedUser => {
            if (!savedUser) {
                return res.status(422).json({ error: "Invalid Email or password" })
            }
            bcrypt.compare(password, savedUser.password)
                .then(doMatch => {
                    if (doMatch) {
                        // res.json({message:"successfully signed in"})
                        const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET)
                        const { _id, name, email } = savedUser
                        res.json({ token, user: { _id, name, email } })
                    } else {
                        return res.status(422).json({ error: "Invalid Email or password" })
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        })
})


router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(422).json({ error: "User dont exists with that email" })
                }
                user.resetToken = token
                user.expireToken = Date.now() + 3600000
                var transporter = nodemailer.createTransport({
                    service: 'gmail.com',
                    auth: {
                        user: EMAIL,
                        pass: 'ssism@123'
                    }
                });

                var mailOptions = {
                    from: EMAIL,
                    to: user.email,
                    subject: "password reset",
                    html: `
                     <p>You requested for password reset</p>
                    <h5 style="color:blue;font-size:15px;"  >click in this
                     <a href="${EMAIL}/reset/${token}">link</a>  
                     to reset password</h5>
                    `

                };
                user.save().then((result) => {
                    //  transporter.sendMail({
                    //      to:user.email,
                    //      from:"sandhyajaiswal947@gmail.com",  
                    //      subject:"password reset",
                    //      html:`
                    //      <p>You requested for password reset</p>
                    //      <h5>click in this <a href="${EMAIL}/reset/${token}">link</a> to reset password</h5>
                    //      `
                    //  })    
                    transporter.sendMail(mailOptions);
                    res.json({ message: "check your email", token })
                })

            })
    })
})


router.post('/new-password', (req, res) => {
    const newPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(422).json({ error: "Try again session expired" })
            }
            bcrypt.hash(newPassword, 12).then(hashedpassword => {
                user.password = hashedpassword
                user.resetToken = undefined
                user.expireToken = undefined
                user.save().then((saveduser) => {
                    res.json({
                        message: "password updated success",
                    })
                })
            })
        }).catch(err => {
            console.log(err)
        })
}) 

router.post('/images-uploading',async (req,res)=>{ 
    const id=req.body;
    const img1=req.body;
    // const img2=req.body;
    // const img3=req.body;
    // console.log(id,img1,img2,img3);
    console.log(id,img1);
    
    let base64 = img1;
    const type = base64.toString().split(";")[0].toString().split("/")[1];
    // base64 = base64.split(",")[1]; 
    base64=base64.toString().split(",");
    console.log(base64);
    console.log("hello");
    // res.send("success");

    const base64Dat = new Buffer.from(base64, "base64");
    const document_name = `${"doc/"}${id}/${img1}_${id}`;
    console.log(type);
    console.log(document_name);
    
    try{  

    const params = {
      Bucket: 'my-buket1',
      Key: document_name,
      // type is not required
      Body: base64Dat,
      ACL: "public-read",
      ContentEncoding: "base64",
      // required
     ContentType: `image/${type}`,
      // required. Notice the back ticks
    };
    let { Location } = await s3.upload(params).promise();
    // const {Location}=s3.upload(params).then(data => console.log(data))
    // .catch(err => console.error(err))
    console.log(Location);
    console.log("hello world");
    // res.send("upload photo successfully");
    }
    catch (error) {
        console.log(error);
        // logger.error(JSON.stringify(error, null, 4));
        // res.status(500).json({ error, msg: "error" });
        return;
      }

});


module.exports = router;