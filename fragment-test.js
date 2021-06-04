const Fragmenter = require('./fragment');
const fs = require('fs');
require('dotenv').config();

let fragmenter = new Fragmenter(process.env.ABLY_OPTIONS);

fragmenter.subscribe((msg) => { 
	fs.writeFile('newmountain.jpg', msg, 'base64', err => {
	  if (err) {
	    console.error(err)
	    return;
	  }
	  console.log("Image saved!");
	})
});

fs.readFile('mountain.jpg', function (err,data) {
  if (err) {
    return console.log(err);
  }
  setTimeout(() => { 
  	fragmenter.publish(Buffer.from(data).toString('base64'));
  }, 2000);
});
