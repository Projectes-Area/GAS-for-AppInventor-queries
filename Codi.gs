function doGet(e) {
  var document = e.parameter.document;
  var from = e.parameter.from;
  var query = e.parameter.query; 
  var where = e.parameter.where;
  var is = e.parameter.is;
  var order = e.parameter.order;
  var values = e.parameter.values;   
  var response = getData(document,from,query,where,is,order,values); 
  return ContentService
    .createTextOutput(response)
    .setMimeType(ContentService.MimeType.JSON);  
}
 
function getData(document,from,query,where,is,order,values){
  if(document == undefined) {
    var doc = SpreadsheetApp.getActive();
  } else {
    var doc = SpreadsheetApp.openById(document);
  }  
  if(from == undefined) {
    var sheet = doc.getSheets()[0];
  } else {
    var sheet = doc.getSheetByName(from);
  }
  var numColumns = sheet.getLastColumn();
  var fields = sheet.getRange(1,1,1,numColumns).getValues();
  var data = sheet.getRange(2,1,sheet.getLastRow()-1,numColumns).getValues();
  var numField; 
  var numOrder;
  for(var i=0;i<fields[0].length;i++){
    if(fields[0][i] == where){
      numField = i;
    }
    if(fields[0][i] == order){
      numOrder = i;
    }
  }
  var response;
  if(query == "count"){
    response = data.length;
  }
  if(query == "insert"){
    sheet.appendRow(values.split('$$'));
    response = "ok";
  } 
  if(query == "select" || query == "delete" || query == "update"){
    if(query == "select" & numOrder != undefined){
      data = data.sort(function(a,b){
        var type = typeof a[numOrder];
        if(type === "string") {
          return a[numOrder].localeCompare(b[numOrder]);
        }
        if(type === "number"){
          return b[numOrder]-a[numOrder];
        }
        if(type === "object"){
          return a[numOrder]-b[numOrder];
        }
      });
    }
    var count = 0;
    response = '[';   
    for(var i=0;i<data.length;i++){
      if (data[i][numField] == is){
        if(query == "select"){
          if(count>0) {
            response+= ',';
          }
          response+='{';
            for(var j=0;j<fields[0].length;j++) {
            response+='"'+fields[0][j]+'":"'+data[i][j]+'"';
            if(j<fields[0].length-1) {
              response+= ',';
            }        
          }
          response+='}';  
        }
        if(query == "delete"){
          sheet.deleteRow(i+2-count);
        }
        if(query == "update"){
          var regIns = values.split('$$');
          var regReplace = [];
          regReplace[0] = regIns;
          for(var j=0;j<fields[0].length;j++) {
            if(regIns[j] == "*"){
              regReplace[0][j] = data[i][j];
            }
          }
          var range = sheet.getRange(i+2,1,1,fields[0].length);
          range.setValues(regReplace);
        }
        count++;
      }
    }
    response+= ']';
    if(query == "delete" || query == "update"){
      response = count;
    }
  }
  if(query == "fields"){
    response = '[{';
    for(var i=0;i<fields[0].length;i++){
      response+= '"'+i+'":"'+fields[0][i]+'"';
       if(i<fields[0].length-1) {
        response+= ',';
      }                      
    } 
    response+= '}]';
  }
  return response;
}