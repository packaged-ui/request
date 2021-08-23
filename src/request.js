export default class Request
{
  get xhr()
  {
    return this._xhr;
  }

  get xhrClass()
  {
    return this._xhrClass || Request._XHR || XMLHttpRequest;
  }

  static set xhrClass(xhr)
  {
    Request._XHR = xhr;
  }

  static get GET() {return 'get';}

  static get POST() {return 'post';}

  static get PUT() {return 'put';}

  static get DELETE() {return 'delete';}

  /**
   * @param {string} url
   * @param {object} [xhrClass]
   */
  constructor(url, xhrClass)
  {
    this.url = url;
    this.method = null;
    this.data = null;
    this.headers = {};
    this.responseType = null;
    this.downloadEventCallback = null;
    this.uploadEventCallback = null;
    this.withCredentials = null;

    this._xhr = null;
    this._xhrClass = xhrClass;
  }

  setUrl(url)
  {
    this.url = url;
    return this;
  }

  setMethod(method)
  {
    this.method = method;
    return this;
  }

  setData(data)
  {
    this.data = data;
    return this;
  }

  setHeaders(headers)
  {
    this.headers = headers;
    return this;
  }

  setResponseType(type)
  {
    this.responseType = type;
    return this;
  }

  setEventCallback(downloadCallback, uploadCallback)
  {
    this.downloadEventCallback = downloadCallback;
    this.uploadEventCallback = uploadCallback;
    return this;
  }

  setWithCredentials(withCredentials)
  {
    this.withCredentials = withCredentials;
    return this;
  }

  send(data, method)
  {
    const self = this;
    if(data)
    {
      this.setData(data);
      if(!this.method && !method)
      {
        method = Request.POST;
      }
    }
    if(method !== undefined)
    {
      this.setMethod(method);
    }
    return new Promise(
      (resolve, reject) =>
      {
        /**
         * @type {XMLHttpRequest}
         */
        const xhr = this._xhr = new (this.xhrClass)();

        if(this.downloadEventCallback)
        {
          xhr.addEventListener('loadstart', this.downloadEventCallback);
          xhr.addEventListener('load', this.downloadEventCallback);
          xhr.addEventListener('loadend', this.downloadEventCallback);
          xhr.addEventListener('progress', this.downloadEventCallback);
          xhr.addEventListener('error', this.downloadEventCallback);
          xhr.addEventListener('abort', this.downloadEventCallback);
        }

        if(this.uploadEventCallback)
        {
          xhr.upload.addEventListener('loadstart', this.uploadEventCallback);
          xhr.upload.addEventListener('load', this.uploadEventCallback);
          xhr.upload.addEventListener('loadend', this.uploadEventCallback);
          xhr.upload.addEventListener('progress', this.uploadEventCallback);
          xhr.upload.addEventListener('error', this.uploadEventCallback);
          xhr.upload.addEventListener('abort', this.uploadEventCallback);
        }

        xhr.addEventListener('load', () =>
        {
          self._xhr = null;
          resolve(xhr);
        });
        xhr.addEventListener('error', () =>
        {
          self._xhr = null;
          reject(new ConnectionError(xhr.statusText || 'socket closed', xhr));
        });
        xhr.addEventListener('abort', () =>
        {
          self._xhr = null;
          reject(new AbortError('aborted', xhr));
        });

        if(this.responseType)
        {
          xhr.responseType = this.responseType;
        }

        const _method = this.method || Request.GET;
        let _requestBody;
        let _requestQuery = new URLSearchParams();
        if(this.data instanceof FormData)
        {
          if(_method === Request.GET)
          {
            this.data.forEach((v, k) => _requestQuery.append(k, v));
          }
          else
          {
            _requestBody = this.data;
          }
        }
        else if(this.data instanceof URLSearchParams)
        {
          if(_method === Request.GET)
          {
            _requestQuery = this.data.toString();
          }
          else
          {
            _requestBody = this.data.toString();
          }
        }
        else if(this.data && typeof this.data === 'object')
        {
          if(_method === Request.GET)
          {
            _requestQuery = Object.entries(this.data)
                                  .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
                                  .join('&');
          }
          else
          {
            _requestBody = Object.entries(this.data)
                                 .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
                                 .join('&');
          }
        }
        else if(this.data !== undefined && this.data !== null)
        {
          if(_method === Request.GET)
          {
            _requestQuery = (new URLSearchParams(this.data));
          }
          else
          {
            _requestBody = this.data;
          }
        }

        xhr.open(_method, _concatPath(this.url, _requestQuery.toString()), true);

        if(this.withCredentials)
        {
          xhr.withCredentials = this.withCredentials;
        }

        if(this.headers)
        {
          for(let name in this.headers)
          {
            if(this.headers.hasOwnProperty(name))
            {
              xhr.setRequestHeader(name, this.headers[name]);
            }
          }
        }

        xhr.send(_requestBody);
      },
    );
  }

  abort()
  {
    if(this._xhr && this._xhr.abort)
    {
      this._xhr.abort();
    }
  }
}

export class AbortError extends Error
{
  #_xhr;

  constructor(message, xhr)
  {
    super(message);
    this.#_xhr = xhr;
  }
}

export class ConnectionError extends Error
{
  #_xhr;

  constructor(message, xhr)
  {
    super(message);
    this.#_xhr = xhr;
  }
}

function _concatPath(path, query)
{
  let qs;
  [path, qs] = path.split('?');
  qs = new URLSearchParams(qs);
  (new URLSearchParams(query)).forEach((v, k) => qs.append(k, v));
  if(Array.from(qs).length > 0)
  {
    path = path + '?' + qs.toString();
  }
  return path;
}
