
var cps = require('cps-api'); // Clusterpoint API
var creds = require('./cps_creds_dont_push.js') // please don't push
var return_user = require('./server.js').return_user
console.log(return_user)

var clusterpoint = (function(){
  var tmp = {}

  var DB_NAME = creds.cps_db_name
  var USERNAME = creds.cps_username
  var PASSWORD = creds.cps_password


  tmp.api_call = function(type, document, session, res){

    if (!document){
      console.log("No document sent")
      return
    }

  var conn = new cps.Connection('tcp://cloud-us-0.clusterpoint.com:9007', 
    DB_NAME, USERNAME, PASSWORD, 'document', 'document/id', {account: 100800});

   function find(user){
    var id = user.id
      var search_req = new cps.SearchRequest(cps.Term(id, "id"));
      conn.sendRequest(search_req, function (err, search_resp) {
         if (err) {
          console.log(err)
          if(err.toString() == "TypeError: Cannot read property 'document' of undefined"){
            console.log("Why does not finding something give a type error??")
            insert(user)
          }
         }
         else{
           var result = search_resp.results.document[0]
           console.log("User found: ", result)
           delete result['_locals']
           session.user_data = result
           res.send('done')
         }
      });
    }
    function insert(document){
      console.log(document)
      var insert_request = new cps.InsertRequest(document);

      conn.sendRequest(insert_request, function(err, insert_response) {
         if (err) {
          console.error(err);
          return
         }
         var result = insert_response.document[0]
           delete result['_locals']
         console.log('Inserted: ', result);
         //session.user_data = result
         res.send('done')
      });
    }

    console.log("Clusterpoint call!")

    if(type == 'login'){
      return find(document)
    }
    else if(type == 'update'){
      conn.sendRequest(new cps.UpdateRequest(document), function (err, resp) {
        if (err) {
          console.error(err); 
          return
        }// Handle error 
        
        var result = resp.document[0]
        console.log("CPS UPDATED", result)

        res.send({
          status: 'done',
          id: session.user_data.id
        })

      });
    }
    else{
      console.log("No such call")
      return null
    }
 

  }

  return tmp
}())

exports.clusterpoint = clusterpoint