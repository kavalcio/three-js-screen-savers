// import initBezier from './bezier';
// import initPipes from './pipes';
// import initMystify from './mystify';

// initPipes();
// initBezier();
// initMystify();

// var app = require('http').createServer(createServer);
// var http = require('http');
// var fs = require('fs'); 
// var url = require('url');

// function createServer(req, res) {
//   var path = url.parse(req.url).pathname;
//   var fsCallback = function(error, data) {
//     if(error) throw error;

//     res.writeHead(200);
//     res.write(data);
//     res.end();
//   }

//   switch(path) {
//     case '/subpage':
//       doc = fs.readFile(__dirname + '/subpage.html', fsCallback);
//     break;
//     default:
//       doc = fs.readFile(__dirname + '/index.html', fsCallback);
//     break;
//   }
// }

// var app = http.createServer(createServer);

// app.listen(3010);
