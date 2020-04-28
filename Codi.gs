function doGet(e) {
  var p = e.parameter;
  var response = getData(p.document,p.from,p.query,p.where,p.is,p.isnot,p.and,p.or,p.equal,p.order,p.values); 
  return ContentService.createTextOutput(response).setMimeType(ContentService.MimeType.JSON);  
}
 
function getData(document,from,query,where,is,isnot,and,or,equal,order,values){
  if(document == undefined) { var doc = SpreadsheetApp.getActive(); } 
  else { var doc = SpreadsheetApp.openById(document); }  
  if(from == undefined) { var sheet = doc.getSheets()[0]; }
  else { var sheet = doc.getSheetByName(from); }
  var numColumns = sheet.getLastColumn();
  var fields = sheet.getRange(1,1,1,numColumns).getValues();
  var data = [];
  var numRegs = sheet.getLastRow() - 1;
  if(numRegs > 0){ data = sheet.getRange(2,1,numRegs,numColumns).getValues(); }
  var numField1,numField2,numOrder; 
  for(var i=0;i<fields[0].length;i++){
    if(fields[0][i] == where){ numField1 = i; }
    if(fields[0][i] == and || fields[0][i] == or){ numField2 = i; }
    if(fields[0][i] == order){ numOrder = i; }
  }
  var response;
  if(query == "count"){ response = data.length; }
  if(query == "insert"){
    sheet.appendRow(values.split('$$'));
    response = "ok";
  } 
  if(query == "select" || query == "delete" || query == "update"){
    if(query == "select" & numOrder != undefined){
      data = data.sort(function(a,b){
        var type = typeof a[numOrder];
        if(type === "string") { return a[numOrder].localeCompare(b[numOrder]); }
        if(type === "number"){ return b[numOrder]-a[numOrder]; }
        if(type === "object"){ return a[numOrder]-b[numOrder]; }
      });
    }
    var count = 0;
    response = '[';   
    for(var i=0;i<data.length;i++){
      var first = false;
      if(numField1 == undefined) { first = true; }
      else if(is != undefined && data[i][numField1] == is) { first = true; }
      else if(isnot != undefined && data[i][numField1] != isnot) { first = true; }
      var getRow = false;
      if(and == undefined && or == undefined && first) { getRow = true; }
      else if(and != undefined && first && data[i][numField2] == equal) { getRow = true; }
      else if(or != undefined && (first || data[i][numField2] == equal)) { getRow = true; }    
      if (getRow){
        if(query == "select"){
          if(count>0) { response+= ','; }
          response+='{';
          for(var j=0;j<fields[0].length;j++) {
            if(data[i][j] instanceof Date) {
              data[i][j] = data[i][j].toLocaleDateString("ca-ES");
            } 
            response+='"'+fields[0][j]+'":"'+data[i][j]+'"';
            if(j<fields[0].length-1) { response+= ','; }        
          }
          response+='}';  
        }
        if(query == "delete"){ sheet.deleteRow(i+2-count); }
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
    if(query == "delete" || query == "update"){ response = count; }
  }
  if(query == "fields"){
    response = '[{';
    for(var i=0;i<fields[0].length;i++){
      response+= '"'+i+'":"'+fields[0][i]+'"';
       if(i<fields[0].length-1) { response+= ','; }                      
    } 
    response+= '}]';
  }
  return response;
}