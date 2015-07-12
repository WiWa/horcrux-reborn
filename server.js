var express = require('express'),
    multer = require('multer'),
    fs = require('fs')

var app = module.exports = express()
var clusterpoint = require('./clusterpoint.js').clusterpoint
var done = false

// Configure Express to use multer
app.use(multer({ dest: './uploads/' ,
  onFileUploadStart: function (file, form) {
    console.log(file.originalname + ' Upload is starting ...')
  },
  onFileUploadComplete: function (file) {
    // Name the file sensibly.
    var rename_path = "uploads/" + file.originalname
    fs.rename(file.path, rename_path)
    file.path = rename_path

    console.log(file.originalname + ' uploaded to  ' + file.path)
    
    done=true 
  }
}))


// Handling routes.
app.get('/',function(req,res){
  
  // Insert
  var uniq_id_is_timestamp = Date.now()
  var doc = {
    id: uniq_id_is_timestamp,
    name: 'ayy',
    testlol: true

  }
  //clusterpoint.api_call(doc)
  res.sendFile(__dirname + "/index.html");
});

app.post('/dload', function(req, res){
    //var filename = req.
    //fs.readFile('/uploads/')
    //var t = Object.getOwnPropertyNames(req)
    //console.log(t)
    //console.log(req.headers, req.body, req.query)

    //// http://blog.ragingflame.co.za/2013/5/31/using-nodejs-to-join-audio-files
    var files = fs.readdirSync('./uploads')
    var whole = fs.createWriteStream('./reddit.py')
    
    var names = []
    files.forEach(function(file){
      names.push(file)
    })
    names.sort()

    while(names.length){
      var currentFile = './uploads/' + names.shift()
      var stream = fs.createReadStream(currentFile)
      stream.pipe(whole,{end:false})
      stream.on('end', function(){
        console.log(currentFile + ' appended.')
      })
    }

    res.end("okay")
    //res.sendfile(appFound.path)

})


app.post('/upload',function(req,res){
  if(done==true){
    res.end("File uploaded.");
  }
})

app.post('/blobCatcher', function(req, res){
  res.end("Blob Caught")
})


// Run the server
app.listen(3000, function(){
  console.log('horcrux server working on port 3000')
})

//