web-minify
==============

Library for post-processing http response. For example, you can use it for minify or for other changes in the response body.

# Basic Usage

Web minify - middleware function. You should create a handler function and specify the Content-Type response.

Best manual for programmist is an example of source code =) 

## Example

Minify css and html with [html-minifier](https://github.com/kangax/html-minifier.git), [csso](https://github.com/css/csso.git), [postcss](https://github.com/postcss/postcss.git), [precss](https://github.com/jonathantneal/precss.git), [autoprefixer](https://github.com/postcss/autoprefixer.git) for [Express](https://github.com/expressjs/express.git):

```javascript
const htmlminify = require('html-minifier').minify;

const csso = require('csso').minify;
const postcss = require('postcss');
const precss = require('precss');
const autoprefixer = require('autoprefixer');

const minify = require('web-minify');

app.use(minify([
  {
    contentType: 'html', 
    minify: (data)=>{ 
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
  },
  {
    contentType: /css/,
    minify: async (data, req, res) => {
      let resData = (await postcss([precss, autoprefixer]).process(data, { from: undefined })).css;
      
      resData = csso(resData).css;

      return resData;
    }
  }
]));
```

## Options

```javascript
app.use(minify([{
    contentType: /css/,
    minify: async (data, req, res) => {
      let resData = (await postcss([precss, autoprefixer]).process(data, { from: undefined })).css;
      
      resData = csso(resData).css;

      return resData;
    }
  }]));
```

- `contentType`: `String | RegExp`

  Check Content-Type response for minify() will be called

- `minify`: `Function(data:String, req:Request, res:Response)`

  Postprocess response function. Returning String or Promise;

  - data - Response body

# Examples

## Modify status code and json body usage Promise

```javascript
app.use(minify([
    {
      contentType: /json/,
      minify: (data, req, res) => {
        return new Promise(function(resolve, reject) {
          try {
            res.statusCode = 456;
            let o = JSON.parse(data);
            o.dt = new Date('2018-09-28T11:05:13.492Z') ;
            resolve(JSON.stringify(o));
          }
          catch(exc) {
            reject(exc);
          }
        })
        
      }
    }
]));
```

Thx you for your time!
Criticism, suggestions and comments are welcome!

# Change Log

0.0.1

- Published for community


# License

MIT License

Copyright (c) 2018 dmitriym09

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
