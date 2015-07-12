var express = require('express'),
    multer = require('multer'),
    fs = require('fs'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    mkdirp = require('mkdirp'),
    hbs = require('hbs')
// var config = require('./config.js'), //config file contains all tokens and other private info
//    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var app = express()



module.exports = {
  return_user: function (user){
  }
}

app.set('view engine', 'html');
app.engine('html', hbs.__express);


app.use(express.static('public'));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret: 'darkmeme'}))


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


var sess
// Handling routes.
app.get('/',function(req,res){
  sess = req.session
  console.log('wtf')
  //clusterpoint.api_call(doc)
  //res.sendFile(__dirname + "/index.html");
  if (sess.user_id){
    console.log('user is in sessions')
    res.redirect('/profile/'+sess.user_id)
  }
  else {
    console.log('user needs login')
    res.redirect('/login')
  }
});

app.get('/profile/:id', function(req,res){
  var d = req.session.user_data
  res.render('profile',{id: d.id, name: d.name, email: d.email})
})

app.get('/login', function(req, res){
  //res.sendFile(__dirname + '/login.html')
  res.render('login')
})
// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.post('/auth/google', function(req, res){
  sess = req.session
  sess.user_id = req.body.id
  var profile = req.body
  clusterpoint.api_call('login', profile, sess, res)
  //res.end('done');
  
});

app.get('/testing', function(req, res){
  var user_dir = './uploads'
  try{
    var files = fs.readdirSync(user_dir)
    console.log("User files found: ", files)
    res.render("index")
  }
  catch(err){
    console.log("no directory found for user, creating...")
    mkdirp(user_dir, function(error) { 
        // path was created unless there was error
        if(error){console.log(error)}
    });
    res.end('errorino')
  }
})

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