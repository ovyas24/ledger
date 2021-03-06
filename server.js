const express = require('express')
const app = express()
const port = process.env.PORT||3000
let ejs = require('ejs');
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/ledger",{ useNewUrlParser: true , useUnifiedTopology: true},()=>{
    console.log("mongoose connected");
});

const Schema = mongoose.Schema;
const ClientSchema = new Schema({
    name:String,
})

const LedgerData = new Schema({
    userID:String,
    date:Date,
    paticulars:{type:String,default:"Not Set"},
    cbfolio:{type:Number,default:0},
    debit:{type:Number,default:0},
    credit:{type:Number,default:0},
    drcr:{type:Number,default:0},
    balance:{type:Number,default:0},
})

const Client = new mongoose.model("Client",ClientSchema)
const Ledger = new mongoose.model("Ledger",LedgerData)

app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs");

app.get('/',(req,res)=>{
    let show = false;
    Client.find((err,clients)=>{
        console.log("Client Added");
        if(clients.length>0) show=true;
        res.render("index",{show:show,clients:clients})
    })
})

app.get("/ledger/:id",(req,res)=>{
    const id = req.params.id;
    var show = false;
    Client.find({_id:id},(er,re)=>{
        if(er) console.log(er);
        if(re.length < 1 ) res.redirect("/404")
        else{
            Ledger.find({userID:id},(err,details)=>{
                const data = details
                if(data.length>0) show = true
                res.render("ledger" ,{show:show,data:data,id:id});
            })
        }
    })
})

app.post("/ledger/:id",(req,res)=>{
    const id = req.params.id;
    var { date,paticulars,cbfolio,debit,credit,drcr } = req.body;
    var balance= 0;
    var details = new Ledger({
        userID:id,
        date:date,
        paticulars,
        cbfolio,
        debit,
        credit,
        drcr,
        balance
    })
    if(paticulars==undefined){
        paticulars="Not Set"
    } 
    else if(cbfolio==undefined){
        cbfolio=0
    }
    else if(debit==undefined){
        debit=0
    } 
    else if(credit==undefined){
        credit=0
    }
    else if(drcr==undefined){
        drcr=0
    }

    Ledger.find({userID:id},(err,ledger)=>{
        if(ledger.length>0){
            details.balance = ledger[ledger.length-1].balance + (credit - debit);
        }else{
            details.balance = credit - debit;
        }

        details.save((err)=>{
            if(err) return res.send(err)
            console.log("Saving ldeger");
            res.redirect("/ledger/"+id);
        })
    })
})

app.post("/newTerm/:id",(req,res)=>{
    const paticulars = "1st April (Opening Balance)";
    var balance = 0;
    const id = req.params.id;
    Ledger.find({userID:id},(err,result)=>{
        balance = result[result.length-1].balance
        const data= new Ledger({
            userID:id,
            date:Date.now(),
            paticulars,
            balance,
        })
        data.save((err)=>{
            if(err) console.log(err);
            console.log("New Term Started");
            res.redirect("/ledger/"+id)
        })
    })
})


app.post("/rm-client/:id",(req,res)=>{
    console.log("in post");
    const id = req.params.id;
    Ledger.deleteMany({userID:id},(err,result)=>{
        if(err) console.log(err);
        console.log(result);
        Client.deleteOne({_id:id},(er,re)=>{
            if(er) console.log(er);
            console.log(re);
            res.redirect("/");
        })
    })
})

app.post("/add-client",(req,res)=>{
    const { name } = req.body;
    console.log(name);
    const client = new Client({
        name:name,
    })

    console.log(client);

    client.save((err)=>{
        console.log("trying to save");
        if(!err){
            console.log("success");
            res.redirect("/");
        }else{
            console.log(err);
        }
    })
})

app.post("/delete/:id",(req,res)=>{
    const id = req.params.id;
    const userID = req.body.del;
    Ledger.deleteOne({_id:id},(err,result)=>{
        console.log(result);
        res.redirect("/ledger/"+userID)
    })
})

app.get("*",(req,res)=>{
    res.render("404")
})


app.listen(port,(req,res)=> {
    console.log(`App running at port ${port}`)
})