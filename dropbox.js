
var creds = require('./dropbox_creds.js')
var crypto = require('crypto')
var app = require('./server.js').app,
    url = require('url')
var dropbox = (function(){

  /*

*/
  tmp = {}

  tmp.generateRedirectURI = function(req) {
    return url.format({
        protocol: req.protocol,
        host: req.headers.host,
        pathname: app.path() + '/dropbox_success'
    });
  }
  tmp.generateCSRFToken = function() {
    return crypto.randomBytes(18).toString('base64')
        .replace(/\//g, '-').replace(/\+/g, '_');
  }

  

  var path = "lol/wut"
  var uploadHtml = "https://api-content.dropbox.com/1/files_put/auto/"+ path +"?param=val"

  tmp.fileupload = function(token,content,serverpath){
      request.put('https://api-content.dropbox.com/1/files_put/auto/'+serverpath, 'overwrite', 
      {
        headers: {
         Authorization: 'Bearer ' + token ,  'Content-Type': 'text/plain'
        },
        body:content
      }, function optionalCallback (err, httpResponse, bodymsg) {
      if (err) {
          console.log(err);
      }
      else
      { 
          console.log(bodymsg);
      }
  })};

  return tmp
}())

exports.dropbox = dropbox