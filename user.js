
const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const cors = require("cors");
//const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser')
const app = express();
const corsOptions = {};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
  host: 'nb1009spk.com',
  user: 'nbspkcom',
  password: 'O6eeeM40x9',
  database: 'nbspkcom_jtukta2020'
});
db.connect();
router.get('/', (req, res) => {
  res.send('API Ok')
});
router.post('/registration', cors(corsOptions), (req, res) => {
  let loginname = req.body.firstname + " " + req.body.lastname;
  let allmember = "SELECT COUNT(members.username) as member FROM members";
  db.query(allmember, (err, row) => {
    let = rows = row[0].member + 1;
    let digi = rows.toString().padStart(3, "0");
    let pass = req.body.password;
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(req.body.password.trim(), salt, function (err, hash) {
        console.log(hash)
        let sql = `INSERT INTO  members (username,password,loginname,hash,salt,member_id,email,phone,zipcode,address,provinces,amphures,districts) values ('${req.body.username}','${pass}','${loginname}','${hash}','','JTUKTA${digi}','${req.body.email}','${req.body.phone}','${req.body.zipcode}','${req.body.address}','${req.body.provinces}','${req.body.amphures}','${req.body.districts}')`
        db.query(sql, (err, results) => { // สั่ง Query คำสั่ง sql
          console.log(results) // แสดงผล บน Console 
          if (err) {
            res.json({ results: 'error' })
          } else {
            res.json({ results: 'success' })
          }
        })
      });
    })
  })
})
router.post('/userlogin', cors(corsOptions), (req, res) => {
  let sql = `SELECT * From   members WHERE username = '${req.body.User_ID}'`
  let obj = {}
  console.log(req.body);
  // values ('541335','" + req.body.password + "','" + req.body.email + "','" + hash + "','" + salt + "')"
  db.query(sql, (err, results) => {
    console.log(results.length)
    if (err)
      console.log(err)
    if (results.length === 0) {
      console.log('email empty')
      res.json({ 'results': 'error' })
    } else {
      obj = results[0]
      //  console.log(obj.hash)
      bcrypt.compare(req.body.Pass_ID, obj.hash, function (err, rs) {
        // console.log(rs);
        if (rs === true) {
          res.json({ 'results': 'success', 'datarow': obj })
        } else {
          res.json({ 'results': 'error' })
        }
      });
    }

  })
})
router.post('/ckeckzipcode', cors(corsOptions), (req, res) => {
  var zipcode = req.body.zipcode;
  let sql = `SELECT districts.id as id, districts.zip_code as zipcode , districts.name_th as name, districts.name_en as enname, districts.amphure_id as amphureid FROM districts WHERE   districts.zip_code='${zipcode}'`
  let sql2 = `SELECT DISTINCT (amphures.name_th) as amphures ,amphures.id FROM districts Right Join amphures ON districts.amphure_id = amphures.id WHERE districts.zip_code = '${zipcode}'`
  let sql3 = `SELECT DISTINCT (provinces.name_th) as provinces FROM districts Left Join amphures ON districts.amphure_id = amphures.id Left Join provinces ON amphures.province_id = provinces.id WHERE districts.zip_code = '${zipcode}'`
  let obj = {}
  db.query(sql, (err, rs1) => {
    if (err)
      console.log(err)
    if (rs1.length === 0) {
      console.log('email empty')
      res.json({ 'results': 'email empty' })
    } else {
      // obj = results;
      db.query(sql2, (err, rs2) => {
        db.query(sql3, (err, rs3) => {
          obj = {
          }
          // res.json({ rs1})             
          res.json({ 'results': 'success', 'datarow': rs1, 'amphures': rs2, 'provinces': rs3 })
        })
      })
    }
  })
})
router.post('/exchangerate', cors(corsOptions), (req, res) => {
  let sql = `INSERT INTO exchangerate (rate,updateby) values ('${req.body.exchangerate}','${req.body.updateby}')`
  db.query(sql, (err, results) => { // สั่ง Query คำสั่ง sql
    console.log(results) // แสดงผล บน Console 
    if (err) {
      res.json({ results: 'error' })
    } else {
      res.json({ results: 'success' })
    }
  })
})
router.get('/exchangerate', function (req, res) {
  let sql = "SELECT  exchangerate.exchangedate, exchangerate.rate, exchangerate.updateby FROM exchangerate ORDER BY exchangerate.exchangedate desc LIMIT 0, 1"
  db.query(sql, (err, results) => {
    console.log(results);
    if (err) {
      res.json({ 'results': 'error' })
    } else {
      res.json({ 'results': 'success', 'datarow': results })
    }
  })
})
router.get('/memberservice', function (req, res) {
  let keyword = req.query;

  let skeyword = keyword.s;
  //console.log(skeyword)
  let sql = `SELECT members.loginname , members.member_id as mid ,concat(members.loginname ,"@", members.member_id )as name FROM members `
  db.query(sql, (err, results) => {
    //console.log(results);
    if (err) {
      res.json({ 'results': 'error', 'Error': 'notFound' })
    } else {
      // console.log(results.length)
      if (results.length === 0) {
        res.json({ 'results': 'notFound' })
      } else {
        res.json(results)
      }
    }
  })
})
router.post('/loadDataservice', function (req, res) {
  let status = req.body.setstatus;
  let mid = req.body.member_id;
  let membertype = req.body.membertype;
  let sql;
  if(membertype !='admin'){
    sql = `SELECT *  FROM warehouse WHERE  setstatus <> 'closed' AND member ='${mid}'` ;
  }else{
     sql = `SELECT *  FROM warehouse WHERE  setstatus <> 'closed' ` ;
  }
  db.query(sql, (err, results) => {
    console.log(results)
    if (err) {
      res.json({ 'results': 'error', 'Error': 'notFound' })
    } else {
    
      if (results.length === 0) {
        res.json({ 'results': 'notFound' })
      } else {
        res.json(results)
      }
    }
  })
})
router.post('/savetransfer', cors(corsOptions), (req, res) => {
  let ts = Date.now();
  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  let datestam = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
  let sql = `INSERT INTO warehouse (orderNo,tagNo,weight,wide,wlong,high,cubic,price,rate,inwarehouse,outwarehouse,warehouse,loginname,member,datecreate,setstatus) 
  values ('${req.body.orderNo}','${req.body.tagNo}',${req.body.weight},${req.body.wide},
  ${req.body.long},${req.body.high},${req.body.cubic},${req.body.price},${req.body.rate},
  '${req.body.inwarehouse}','${req.body.outwarehouse}','${req.body.inthaiwarehouse}','${req.body.loginname}','${req.body.member}','${datestam}','open')`;
  db.query(sql, (err, results) => { // สั่ง Query คำสั่ง sql
    console.log(results) // แสดงผล บน Console 
    if (err) {
      res.json({ 'results': 'error' + err })
    } else {
      res.json({ 'results': 'success' })
    }
  })
})
router.post('/updateDataservice', cors(corsOptions), (req, res) => {
  let sql =`UPDATE warehouse SET  inwarehouse ='${req.body.inwarehouse}',outwarehouse='${req.body.outwarehouse}',setstatus='${req.body.setstatus}',warehouse='${req.body.warehouse}' WHERE transId=${req.body.transId}`
  db.query(sql, (err, results) => {
    if (err) {
      res.json({ 'results': 'error' + err })
    } else {
      res.json({ 'results': 'success' })
    }
  })
})
router.get('/getids',(req,res)=>{
  let ts = Date.now();
  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let newDay =date.toString().padStart(2, "0");
  let month = date_ob.getMonth() + 1;
  let newMonth=month.toString().padStart(2, "0");
  let year = date_ob.getFullYear();
  let newYear= year.toString().padStart(2, "0");
  let ids;
  let sql =`SELECT * FROM genIds WHERE tYear ='${newYear}' AND tMonth='${newMonth}' AND tDay='${newDay}'`
  db.query(sql, (err, results) => {
   
    if(results.length==0){
    let  sql2=`INSERT INTO genIds (tYear,tMonth,tDay,tNum) values ('${newYear}','${newMonth}','${newDay}',1)`
    db.query(sql2, (err, res2) => {
      if (err) {
        res.json({ 'results': 'error' + err })
      } else {
         ids=newYear+newMonth+newDay+'001';
        res.json({'ids':ids})
      }
    })
    }else{
        let genered = results[0].tNum;
        let saveNum = genered+1;
        console.log(saveNum)
        let sql2 =`UPDATE genIds SET tNum = ${saveNum} WHERE tYear ='${newYear}' AND tMonth='${newMonth}' AND tDay='${newDay}' `
        db.query(sql2, (err, res2) => {
          if (err) {
            res.json({ 'results': 'error' + err })
          } else {
            let newg= saveNum.toString().padStart(3, "0");
             ids=newYear+newMonth+newDay+newg;
            res.json({'ids':ids})
          }
        })
    }  
  })
})
router.get('/pricing', function (req, res) {
  let sql = "SELECT * FROM vpricing"
  db.query(sql, (err, results) => {
   console.log(results);
    if (err) {
      res.json({ 'results': 'error' })
    } else {
      res.json({ 'results': 'success', 'datarow': results })
    }
  })
})
router.post('/shippingcost', cors(corsOptions), (req, res) => {
 var tt= req.body.transportType
 var pt= req.body.productType
  let sql =`SELECT
  priceLog,
  TransportName,
  ProductName,
  cubic,
  weight,
  TransportType,
  ProductType
  FROM
  vpricing
  where TransportType = ${tt} AND ProductType = ${pt}`;
  db.query(sql, (err, results) => {
    if (err) {
      res.json({ 'results': 'error'})
    } else {
      res.json(results)
    }
  })
})
router.post('/updateshippingcost', cors(corsOptions), (req, res) => {
  var tt= req.body.transportType
  var pt= req.body.productType
  var cubicprice= req.body.cubicprice
  var weightprice= req.body.weightprice
   
   let sql =`UPDATE Priceing SET cubic = ${cubicprice} ,weight=${weightprice}
   where TransportType = ${tt} AND ProductType = ${pt}`;
   db.query(sql, (err, results) => {
     if (err) {
       res.json({ 'results': 'error'})
     } else {
       res.json({ 'results': 'success'})
     }
   })
 })
router.get('/members', function (req, res) {
  let sql = "SELECT members.member_id as id, members.loginname as name, members.address as address FROM members"
  db.query(sql, (err, results) => {
    if (err) {
      res.json({ 'results': 'error' })
    } else {
      res.json(results)
    }
  })
})
module.exports = router;      
