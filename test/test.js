import {port as _p, serverUrl as _s} from './_setup.js';
import http from 'http';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import multipart from 'parse-multipart-data';

import Request, {AbortError, ConnectionError} from '../src/request.js';

chai.use(chaiAsPromised);
chai.should();

const server = http.createServer(
  function (req, res)
  {
    if(req.url === '/error')
    {
      req.destroy(new Error('error'));
      return;
    }

    if(req.url === '/fail')
    {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end();
      return;
    }

    let body = '';
    req.on('data', function (data)
    {
      body += data;
    });

    req.on('end', function ()
    {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      if(req.method.toLowerCase() === Request.GET)
      {
        const [, query] = req.url.split('?');
        let data = Object.fromEntries((new URLSearchParams(query)).entries());
        data = Object.keys(data).length > 0 && JSON.stringify(data) || 'abc123';
        res.end(data);
      }
      else
      {
        let data = {};
        const _boundary = multipart.getBoundary(req.headers['content-type']);
        if(req.headers['content-type'] && _boundary)
        {
          multipart.parse(Buffer.from(body, 'utf8'), _boundary)
                   .forEach((d) => {data[d.name] = d.data.toString();});
        }
        else
        {
          data = Object.fromEntries((new URLSearchParams(body)).entries());
        }

        data = Object.keys(data).length > 0 && JSON.stringify(data) || 'abc123';
        res.end(data);
      }
    });
  },
);

before(function () {server.listen(_p);});

after(function () {server.close();});

describe('request', function ()
{
  it('abort', function ()
  {
    const req = new Request(_s + '/abort');
    const a = req.send()
                 .then(x => x instanceof AbortError)
                 .catch(x => x instanceof AbortError);

    req.xhr.abort();
    return a.should.eventually.equal(true);
  });

  it('error', function ()
  {
    const req = new Request(_s + '/error');
    const a = req.send()
                 .then(x => x instanceof ConnectionError)
                 .catch(x => x instanceof ConnectionError);

    return a.should.eventually.equal(true);
  });

  it('request', function ()
  {
    const req = new Request('/test');
    const a = req.send()
                 .then(x => x.response);

    return a.should.eventually.be.equal('abc123');
  });

  it('formData', function ()
  {
    const data = new FormData();
    data.set('test1', 'value1');
    data.set('test2', 'value2');
    const req = new Request(_s + '/test');
    const a = req.setMethod(Request.POST).setData(data)
                 .send()
                 .then(x => x.response);

    return a.should.eventually.be.equal(JSON.stringify(Object.fromEntries(data)));
  });

  it('formData - get', function ()
  {
    const data = new FormData();
    data.set('test1', 'value1');
    data.set('test2', 'value2');
    const req = new Request(_s + '/test');
    const a = req.setMethod(Request.GET).setData(data)
                 .send()
                 .then(x => x.response);

    return a.should.eventually.be.equal(JSON.stringify(Object.fromEntries(data)));
  });

  it('urlSearchParams', function ()
  {
    const data = new URLSearchParams();
    data.set('test1', 'value1');
    data.set('test2', 'value2');
    const req = new Request(_s + '/test');
    const a = req.send(data)
                 .then(x => x.response);

    const _compare = {};
    data.forEach((v, k) => _compare[k] = v);
    return a.should.eventually.be.equal(JSON.stringify(_compare));
  });

  it('urlSearchParams.toString()', function ()
  {
    const data = new URLSearchParams();
    data.set('test1', 'value1');
    data.set('test2', 'value2');
    const req = new Request(_s + '/test');
    const a = req.setMethod(Request.GET).setData(data.toString())
                 .send()
                 .then(x => x.response);

    const _compare = {};
    data.forEach((v, k) => _compare[k] = v);
    return a.should.eventually.be.equal(JSON.stringify(_compare));
  });
});
