/*!
 * minify
 * Copyright(c) 2014-2015 dmitriym09
 * MIT Licensed
 */

const createBuffer = (req, res) => {
  if(typeof res._createdMinifyBuffer != 'undefined') {
    return res._createdMinifyBuffer
  }
  res._createdMinifyBuffer = false;

  let contentType = res.getHeader('Content-Type');
  if(typeof contentType == 'string') {
    contentType = contentType.toLowerCase();
  }

  if(!!contentType) {
    const find = options.find((option) => {
      const ct = option.contentType;

      if(typeof ct == 'string') {
        return contentType.indexOf(ct.toLowerCase()) > -1;
      }

      if(ct instanceof RegExp) {
        return ct.test(contentType);
      }

      throw Error(`Not support ${option}`);
    });

    if(!!find) {
      res.minifyBuffer = new Buffer.from('');
      res.minify = find.minify;

      if(res.headersSent) {
        throw Error('Headers sent')
      }

      res.removeHeader('Content-Length')

      if(typeof res.minify != 'function') {
        throw Error(`Error minify ${res.minify}`);
      }

      res._createdMinifyBuffer = true;
      return true;
    }
  }
}

const addToBuffer = (res, chunk, encoding) => {
  if(!(res.minifyBuffer instanceof Buffer)) {
    throw Error('minifyBuffer not created');
  }

  if(!!chunk) {
    if(typeof chunk == 'string') {
      res.minifyBuffer = Buffer.concat([res.minifyBuffer, new Buffer.from(chunk, encoding)]);
    }
    else if(chunk instanceof Buffer) {
      res.minifyBuffer = Buffer.concat([res.minifyBuffer, chunk]);
    }
    else {
      throw Error(`Unsupport ${chunk}`);
    }
  }
}

const finish = (req, res, encoding, end, callback) => {
  if(!(res.minifyBuffer instanceof Buffer)) {
    throw Error('minifyBuffer not created');
  }

  if(res.finished) {
    throw Error('Response finished');
  }

  if(res.headersSent) {
    throw Error('Headers sent')
  }

  const _ = (minData)=>{
    if(typeof minData != 'string') {
      throw Error(`Error ${minData}`)
    }
    let tmpBuf = new Buffer.from(minData, encoding);
    res.setHeader('Content-Length', tmpBuf.length)
    end.call(res, tmpBuf, encoding, callback);
  }

  try { 
    let minify_ = res.minify(res.minifyBuffer.toString(encoding || 'utf-8'), req, res);
    

    if(minify_ instanceof Promise) {
      minify_
      .then(_)
      .catch((err) => {
        console.warn(`Exception minify ${err}`);
        res.statusCode = 500;
        res.setHeader('Content-Length', 0);        
        res._end.call(res, null, encoding, callback);
      });
    }
    else {
      _(minify_);
    }
  }
  catch(exc) {
    console.warn(`Exception minify ${exc}`);
    res.statusCode = 500;
    res.setHeader('Content-Length', 0)    
    res._end.call(res, null, encoding, callback);
  }
  
}

let options = [];
const middle = (req, res, next) => {
  const _write = res.write;
  res.write = (chunk, encoding, callback) => {
    if(createBuffer(req, res)) {
      addToBuffer(res, chunk, encoding)
      if(typeof callback == 'function') callback();
    }
    else {
      _write.call(res, chunk, encoding, callback);
    }
  };

  const _end = res.end;
  res._end = _end;
  res.end = (data, encoding, callback) => {
    if(createBuffer(req, res)) {
      addToBuffer(res, data, encoding)
      finish(req, res, encoding, _end, callback)
    }
    else {
      _end.call(res, data, encoding, callback);
    }
  };

  next();
}


/**
 * Initialization middleware,
 * hint write to client and store data
 * @param {Array}
 * @return {Function}
 */

module.exports = (options_) => {options = options_; return middle};

