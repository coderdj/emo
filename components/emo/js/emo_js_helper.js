/**
 * Created by dan on 5/30/15.
 */
function get_browser_info(){
// Shamelessly lifted from http://stackoverflow.com/questions/5916900/how-can-you-detect-the-version-of-a-browser
    var ua=navigator.userAgent,tem,M=ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []; 
    if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(ua) || []; 
        return {name:'IE',version:(tem[1]||'')};
        }   
    if(M[1]==='Chrome'){
        tem=ua.match(/\bOPR\/(\d+)/)
        if(tem!=null)   {return {name:'Opera', version:tem[1]};}
        }   
    M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem=ua.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
    return {
      name: M[0],
      version: M[1]
    };
 }


function write_file(data) {
    thedata = data;
    function onInitFs(fs) {
    console.log(thedata);
    filename = "dump_run_" + thedata['run_name'] + "_" + thedata['event_number'];
    fs.root.getFile(filename, {create: true}, function(fileEntry) {

        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
            console.log('Write completed.');
        };

        fileWriter.onerror = function(e) {
            console.log('Write failed: ' + e.toString());
        };

        // Create a new Blob and write it to log.txt.
            var json = JSON.stringify(thedata);
     // var blob = new Blob([json], {type: 'application/json'});
        var blob = new Blob(thedata, {type: 'application/json'});

      fileWriter.write(blob);

    });

  });

}

    console.log(data);
    window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 10, onInitFs);
}
