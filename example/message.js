var Notify = require("../index");
var notifier = new Notify();

notifier.notify({
  "message": "Hello"
}
, function (err, data) {
  if (err) {
    return console.error("Error: ", err);
  }

  console.log(data);
});


setTimeout(function() {
  console.log("Done");
}, 5000);