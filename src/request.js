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

        let data;
        if(this.data instanceof FormData)
        {
          data = this.data;
        }
        else if(this.data instanceof URLSearchParams)
        {
          data = this.data.toString();
        }
        else if(this.data && typeof this.data === 'object')
        {
          data = Object.entries(this.data)
                       .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
                       .join('&');
        }
        else
        {
          data = this.data;
        }

        xhr.open(this.method || Request.GET, this.url, true);

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

        xhr.send(data);
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
