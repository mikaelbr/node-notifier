var notifier = require("../index");

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