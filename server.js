const express = require("express")
const app = express()
const cors = require("cors");
const bodyParser = require('body-parser')
const shortid = require('shortid');
const PORT = process.env.PORT || 4100
var user = require('./user');
var EventSource = require('eventsource')
//var assert = require('assert')
//const login = require("facebook-chat-api");
var firebase = require('firebase');
//const axios = require('axios');
firebase.initializeApp({
    apiKey: "AIzaSyB05Qiit4m_pMwPlG3S1iwLCkwF_lMY8qU",
    authDomain: "gzonbook.firebaseapp.com",
    databaseURL: "https://gzonbook.firebaseio.com",
    projectId: "gzonbook",
    storageBucket: "gzonbook.appspot.com",
    messagingSenderId: "828622594542",
    appId: "1:828622594542:web:a8c12b9aff947623f2eeff",
    measurementId: "G-JWRNR0QMVW"
});
var db = firebase.firestore();
//const fetch = require("node-fetch");
var whitelist = ['*.*']
var corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/user', user);

// app.get("/webhook",function(req,res){
//     if(req.query["hub.verify_token"]=="GzonApiliveComment")
//     {
//         res.send(req.query["hub.challenge"]);
//     }
//  });

app.get('/webhook', (req, res) => {

    console.log('webhook');
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "GzonApiliveComment"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});
 app.post("/webhook" , function(req,res){
  // console.log(req);
    var msg_events=req.body;
    console.log(msg_events)
    if(msg_events.object=='page'){
        msg_events.entry[0].changes.forEach(element => {
            if(element.field=='live_videos'){
                var val = element.value;
                console.log(val)
            } else if(element.field=='feed'){
               var val = element.value;
               console.log(val)
            }

        });
    }else if(msg_events.object=='user'){
        
        console.log(msg_events)
       msg_events.entry[0].changed_fields.forEach(element => {
           console.log("มีอะไรหน่อยไหม")
           console.log(element)         
       })

    }
 });

app.get("/", (req, res) => {
   res.json({ result: "ok", "data": "ok" })  
})
app.post("/livecomment", (req, res) => {
    let postedata = req.body;
  //  console.log(postedata);
    // var accessToken = postedata.tokenid;//"190398225498500|P3T7lrIwOBwc9fZbn6ZQI91InLA";
    var videoId = postedata.videoId;
    // var FId = postedata.id;
    var pageid = postedata.page;
    var msg = JSON.parse(postedata.fbmsg)
     var name = msg.from.name;
     var idname = msg.from.id;
     var productId = msg.message;
    // console.log(productId)
     const product = db.collection(`Products/${pageid}/liveproducts`).where("productId", "==", productId).get();
    product.then(doc => {
        doc.docs.map(dc => {
           // console.log(dc.exists)
            if (dc.exists) {
               var unitid = dc.data().unit;
               var docId  = dc.data().docId;
               var instock =unitid-1;
                 if(unitid !==0){
                   //  console.log('insert')
                     var insert ={
                            "CreateAt": firebase.firestore.FieldValue.serverTimestamp(),
                            "FbId": postedata.id,
                            "message": productId,
                            "nodeId": msg.id,
                            "name": name,
                            "fbuserid":idname,
                            "page": pageid,
                            "videoId": videoId
                        }
                const addcomments = db.collection(`Livecomment/${pageid}/live/${videoId}/comment`);
                addcomments.doc().set(insert).then(ok =>{
                    db.collection(`Products/${pageid}/liveproducts`).doc(docId).update({"unit":instock});
                })
                
                // client.sendText("100056755632948", 'Hello World').then(() => {
                //     console.log('sent');
                //   });
                  
                 }           
            }
        })
    })
})
app.post("/addnewproduct", (req, res) => {
    let postedata = req.body;  
    getdocument(postedata).then(val =>{
        if(val===true){
            var cooldata = cool(postedata);
            cooldata.then(val => {
                //  console.log(val);
                if (val) {
                    res.json({ 'results': 'success', "datarow": val })
                } else {
                    res.json({ 'results': 'error' })
                }
            })
        }else{
            res.json({ 'results': 'error' })
        }
    })
})
async function getdocument(postedata) {
    var productID=postedata.productId;
    var page =postedata.page;
    const snapshot  = await  db.collection(`Products/${page}/liveproducts/`).where("productId","==",productID).get();
    return snapshot.empty;
}
async function cool(postedata) {
    var docid = shortid.generate();
    var user = postedata.user;
    var page = postedata.page;
    postedata.CreateAt = firebase.firestore.FieldValue.serverTimestamp();
    postedata.status = "open";
    postedata.docId = docid;
    const docRef = db.collection(`Products/${page}/liveproducts/`);
    return await docRef.doc(docid).set(postedata).then(async (val) => {
        const docRef2 = await db.doc(`Products/${page}/liveproducts/${docid}`).get()
        return docRef2.data()
    })
}
//   app.get("/webhook", function(req, res) {
//    console.log('==>' +req.query["hub.verify_token"])
//    console.log('==>2' +VALIDATION_TOKEN)
//     if (req.query["hub.verify_token"] === VALIDATION_TOKEN) {
//         console.log("Validating webhook");
//         console.log(req.query['hub.challenge']);
//         res.status(200).send(req.query['hub.challenge']);
//        // res.send(req.query["hub.challenge"]);
//     } else {
//         console.error("Failed validation. Make sure the validation tokens match.");
//        // res.sendStatus(403);  
//         res.send("Error, wrong validation token");
//     }
// });


app.listen(PORT, () => {
    console.log(`Serer is running. ${PORT}`)
})
