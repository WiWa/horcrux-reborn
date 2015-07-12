var express = require('express'),
    multer = require('multer'),
    fs = require('fs'),
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
  changeDest: function(dest, req, res) {
    var newDestination = dest + req.session.user_id;
    //console.log(req)
    var stat = null;
    try {
        stat = fs.statSync(newDestination);
    } catch (err) {
        fs.mkdirSync(newDestination);
    }
    if (stat && !stat.isDirectory()) {
        throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
    }
    return newDestination
  } ,
  onFileUploadStart: function (file, req) {
    console.log(file.originalname + ' Upload is starting ...')
    //console.log(form)
    req.session.user_data.temp_files = req.session.user_data.temp_files || []
    req.session.user_data.temp_files.push(file.originalname)
    console.log(req.session.user_data.temp_files)
  },
  onFileUploadComplete: function (file) {
    // Name the file sensibly.

    var extracted_path = file.path.substring(0, file.path.lastIndexOf("/")) + "/"
    var rename_path = extracted_path + file.originalname
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
  sess.user_data = req.body
  console.log(req.body)
  console.log("FROM AUTH: ", sess.user_data, req.body)
  sess.user_data.files = []
  clusterpoint.api_call('login', sess.user_data, sess, res)
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
app.get('/profile/:id', function(req,res){
  var d = req.session.user_data
  console.log("FROM PROFILE: ", d)
  res.render('profile',d)
})
app.get('/profile/:id/upload',function(req,res){
  var d = req.session.user_data
  res.render('upload',{id: d.id})
})

app.post('/upload',function(req,res){
  if(done==true){
    res.end("File uploaded.");
  }
})

app.post('/blobCatcher', function(req, res){
  var temp_files = req.session.user_data.temp_files
  var whole_name = temp_files[0].substring(0,temp_files[0].lastIndexOf(".part"))
  console.log(whole_name, temp_files.length)
  var file_data = {
    filename: whole_name,
    parts: 2,
    locations: ["", ""]
  }
  console.log('GET THIS', file_data)
  req.session.user_data.files = req.session.user_data.files || []
  req.session.user_data.files.push(file_data)
  clusterpoint.api_call('update', req.session.user_data, req.session, res)
})


// Run the server
app.listen(3000, function(){
  console.log('horcrux server working on port 3000')

})

//