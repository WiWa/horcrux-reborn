var express = require('express'),
    multer = require('multer'),
    fs = require('fs'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    session = require('express-session')
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    GoogleStrategy = require('passport-google').LocalStrategy
// var config = require('./config.js'), //config file contains all tokens and other private info
//    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var app = module.exports = express()
app.use(express.static('public'));

/*
app.use(logger('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(session({secret: 'hypernova', saveUninitialized: true, resave: true}));
app.use(passport.initialize());
app.use(passport.session());
*/
// Session-persisted message middleware
/*
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});
*/
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

/*app.get('/login',
  passport.authenticate('local',{ successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true  }));
*/
/*
passport.use(new GoogleStrategy({
    returnURL: __dirname + 'auth/google/return',
    realm: __dirname
  },
  function(identifier, profile, done) {
    User.findOrCreate({ openId: identifier }, function(err, user) {
      done(err, user);
    });
  }
));
*/

app.get('/login', function(req, res){
  res.sendFile(__dirname + '/login.html')
})
// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return',
  passport.authenticate('google', { successRedirect: '/',
                                    failureRedirect: '/login' }));


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