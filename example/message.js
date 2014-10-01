var Notify = require("../index");
var notifier = new Notify();

notifier.notify({
  "message": "Hello",
  "wait": true
}, function (err, data) {
  if (err) {
    return console.error("Error: ", err);
  }

  console.log("data:", data);
});
