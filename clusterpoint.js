
var cps = require('cps-api'); // Clusterpoint API
var creds = require('./cps_creds_dont_push.js') // please don't push

var clusterpoint = (function(){
  var tmp = {}

  var DB_NAME = creds.cps_db_name
  var USERNAME = creds.cps_username
  var PASSWORD = creds.cps_password

  tmp.api_call = function(document){

    if (!document){
      console.log("No document sent")
      return
    }

  var conn = new cps.Connection('tcp://cloud-us-0.clusterpoint.com:9007', 
    DB_NAME, USERNAME, PASSWORD, 'document', 'document/id', {account: 100800});

    console.log("Clusterpoint call!")

    var insert_request = new cps.InsertRequest(document);

    conn.sendRequest(insert_request, function(err, insert_response) {
       if (err) return console.error(err);
       console.log('New user registered: ' + insert_response.document[0].id);
    });

  }

  return tmp
}())

exports.clusterpoint = clusterpoint