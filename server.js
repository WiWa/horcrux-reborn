var express = require('express'),
    multer = require('multer'),
    fs = require('fs'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    mkdirp = require('mkdirp'),
    hbs = require('hbs'),
    url = require('url'),
    request = require('request'),
    crypto = require('crypto')

// var config = require('./config.js'), //config file contains all tokens and other private info
//    funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work

var app = express()



module.exports = {
  app: app
}

app.set('view engine', 'html');
app.engine('html', hbs.__express);


app.use(express.static('public'));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret: 'darkmeme'}))
app.use(cookieParser())


var clusterpoint = require('./clusterpoint.js').clusterpoint,
    googledrive = require('./googledrive.js').googledrive,
    google = require('googleapis'),
    dropbox = require('./dropbox.js').dropbox


var dropbox_creds = require('./dropbox_creds.js')
var google_creds = require('./google_creds.js')

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
    req.session.user_data.part_files = req.session.user_data.part_files || []
    req.session.user_data.part_files.push(file.originalname)
    console.log(req.session.user_data.part_files)
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
  //console.log(req.body)
  //console.log("FROM AUTH: ", sess.user_data, req.body)
  sess.user_data.files = []
  sess.user_data.part_files = []
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
  //googledrive.upload_file('./uploads/'+req.params.id+'/reddits.py', 'reddit.py')
  res.render('profile',d)
})
app.post('/profile/:id', function(req,res){
  googledrive.list_files()
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

function generateRedirectURI(req) {
  return url.format({
      protocol: req.protocol,
      host: req.headers.host,
      pathname: app.path() + '/dropbox_success'
  });
}
function generateCSRFToken() {
  return crypto.randomBytes(18).toString('base64')
    .replace(/\//g, '-').replace(/\+/g, '_');
}
app.get('/auth/dropbox', function (req, res) {
var csrfToken = generateCSRFToken();
res.cookie('csrf', csrfToken);
res.redirect(url.format({
    protocol: 'https',
    hostname: 'www.dropbox.com',
    pathname: '1/oauth2/authorize',
    query: {
        client_id: dropbox_creds.drop_key,//App key of dropbox api
        response_type: 'code',
        state: csrfToken,
        redirect_uri: generateRedirectURI(req)
    }
}));
});
app.get('/dropbox_success', function (req, res) {
  if (req.query.error) {
      return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
  }

  if (req.query.state !== req.cookies.csrf) {
      return res.status(401).send(
          'CSRF token mismatch, possible cross-site request forgery attempt.'
      );
  }

  request.post('https://api.dropbox.com/1/oauth2/token', {
      form: {
          code: req.query.code,
          grant_type: 'authorization_code',
          redirect_uri: generateRedirectURI(req)
      },
      auth: {
          user: dropbox_creds.drop_key,
          pass: dropbox_creds.drop_secret
      }
  }, function (error, response, body) {
      var data = JSON.parse(body);
      if (data.error) {
          return res.send('ERROR: ' + data.error);
      }

      var token = dropbox_creds.drop_token;
      req.session.token=dropbox_creds.drop_token;
      request.post('https://api.dropbox.com/1/account/info', {
          headers: { Authorization: 'Bearer ' + token }
      }, function (error, response, body) {
          //res.send('Logged in successfully as ' + JSON.parse(body).display_name + '.');
          res.redirect('/profile/'+req.session.user_data.id)
      });

  });
});

app.post('/upload/dropbox', function (req, res) {
  var sess = req.session.user_data

    var sess_id = sess.id
    var parts = req.body.parts
    var counter = 0
    var rsud = req.session.user_data
    var rs = req.session
    var uploader = function(){
      var partname = parts[counter]
      var localpath = "./uploads/" + sess_id + partname
      var serverpath = "./horcrux" + partname

      if (req.query.error) {
        return res.send('ERROR ' + req.query.error + ': ' + req.query.error_description);
      }
        fs.readFile(localpath,'utf8', function read(err, data) {
          if (err) {
              throw err;
          }

          content = data;
          //console.log(content); 
          //console.log(counter)
          //fileupload(dropbox_creds.drop_token,content,serverpath,res);
          var token = dropbox_creds.drop_token
          //console.log("Checking serverpath...", serverpath)
            
          request.put('https://api-content.dropbox.com/1/files_put/auto/'+serverpath, {
              headers: { Authorization: 'Bearer ' + token 
             // ,      'Content-Type': 'text/plain'
              },body:content}, function optionalCallback (err, httpResponse, bodymsg) {
              if (err) {
                  console.log(err);
                  res.end("Errored from Dropbox")
              }
              else
              { 
                  //console.log(bodymsg);
                  console.log("Dropbox Upload Success!")
                  counter++
                  //console.log(counter)
                  if(counter < parts.length){
                    uploader()
                  }
                  else{
                    //console.log(rsud)
                    clusterpoint.api_call('update', rsud, rs, res)
                    res.redirect('/profile/'+sess_id)
                  }
              }
          });

        });
    }
    uploader()
  
});
/*
app.post('/upload/googledrive',function(req, res){
  var YOUR_API_KEY = 
  request.post('https://www.googleapis.com/drive/v2/files?convert=false&ocr=false&pinned=true&visibility=PRIVATE&key=')
{
 "ownedByMe": true
}
})
*/
app.post('/download/', function(req, res){

})

app.post('/blobCatcher', function(req, res){
  var part_files = req.session.user_data.part_files
  var whole_name = part_files[0].substring(0,part_files[0].lastIndexOf(".part"))
  console.log(whole_name, part_files.length)
  var file_data = {
    filename: whole_name,
    parts: 2,
    locations: ["dropbox", "dropbox"]
  }
  console.log('GET THIS', file_data)
  req.session.user_data.part_files = []
  req.session.user_data.files = req.session.user_data.files || []
  req.session.user_data.files.push(file_data)
  //clusterpoint.api_call('update', req.session.user_data, req.session, res)
    res.send({
      status: 'done',
      id: req.session.user_data.id
    })

})


// Run the server
app.listen(3000, function(){
  console.log('horcrux server working on port 3000')

})

//