/**
 * Created by dan on 5/30/15.
 */



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
