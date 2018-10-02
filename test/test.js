const request = require('supertest');
const minify = require('..');
const http = require('http');
const htmlminify = require('html-minifier').minify;
const async = require('async');
const postcss = require('postcss');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const csso = require('csso').minify;

function createServer(middlewares, fn) {
  return http.createServer(function(req, res) {
    async.eachSeries(middlewares, function(middleware, callback) {
      middleware(req, res, callback)
    }, function(err) {
      if (err) {
        res.statusCode = err.status || 500
        res.end(err.message)
        return;
      }
      fn(req, res);
    });
  });
}

describe('minify()', () => {
	it('HTML', (done) => {
		const app = createServer([minify([
			{
				contentType: 'html', 
				minify: (data) => { 
					let res = htmlminify(data, {
						removeAttributeQuotes: true,
						collapseWhitespace: true,
						conservativeCollapse: false,
						decodeEntities: true,
						keepClosingSlash: false,
						preserveLineBreaks: false,
						preventAttributesEscaping: true,
						processConditionalComments: true,
						removeAttributeQuotes: true,
						removeComments: true,
						trimCustomFragments: true,
						useShortDoctype: true
		    		});
		   			return res;
		  		}
			}
		])], function(req, res) {
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
		    res.end(`<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">



</head>

<body>
	<h1>Test</h1>

	<p>Test</p>
</body>`);
		});


		request(app)
		  .get('/')
		  .set('Accept', 'text/html; charset=utf-8')
		  .expect('Content-Type', 'text/html; charset=utf-8')
		  .expect('<!doctype html><html lang=en><head><meta charset=utf-8></head><body><h1>Test</h1><p>Test</p></body></html>')
		  .expect(200)
		  .end(done)
	});

	it('CSS', (done) => {
		const app = createServer([minify([
			{
				contentType: /css/,
				minify: async (data, req, res) => {
					let resData = (await postcss([precss, autoprefixer]).process(data, { from: undefined })).css;

					resData = csso(resData).css;

					return resData;
				}
			}
		])], function(req, res) {
			res.setHeader('Content-Type', 'text/css; charset=utf-8');
		    res.end(`
$xs:100px;

.temp {
	display: flex
}

@media(min-width:$xs) {
	.temp {
		text-align:center
	}
}
`);
		});


		request(app)
		  .get('/')
		  .set('Accept', 'text/css; charset=utf-8')
		  .expect('Content-Type', 'text/css; charset=utf-8')
		  .expect('.temp{display:flex}@media (min-width:100px){.temp{text-align:center}}')
		  .expect(200)
		  .end(done)
	});

	it('JSON', (done) => {
		const app = createServer([minify([
			{
				contentType: /json/,
				minify: (data, req, res) => {
					return new Promise(function(resolve, reject) {
						try {
							res.statusCode = 456;
							let o = JSON.parse(data);
							o.dt = new Date('2018-09-28T11:05:13.492Z') 
							resolve(JSON.stringify(o))
						}
						catch(exc) {
							reject(exc)
						}
					})
					
				}
			}
		])], function(req, res) {
			res.setHeader('Content-Type', 'application/json; charset=utf-8');
		    res.end(JSON.stringify({a: 12}));
		});


		request(app)
		  .get('/')
		  .set('Accept', 'application/json; charset=utf-8')
		  .expect('Content-Type', 'application/json; charset=utf-8')
		  .expect('{"a":12,"dt":"2018-09-28T11:05:13.492Z"}')
		  .expect(456)
		  .end(done)
	});
});