export default class Request
{
  get xhrClass()
  {
    return this._xhrClass || Request._XHR || XMLHttpRequest;
  }

  static set xhrClass(xhr)
  {
    Request._XHR = xhr;
  }

  static get GET() {return 'get'};

  static get POST() {return 'post'};

  static get PUT() {return 'put'};

  static get DELETE() {return 'delete'};

  /**
   * @param {string} url
   * @param {object} [xhrClass]
   */
  constructor(url, xhrClass)
  {
    this.url = url;
    this.method = Request.GET;
    this.data = {};
    this.headers = {};
    this.responseType = null;
    this.eventCallback = null;
    this._xhr = null;
    this._xhrClass = xhrClass;
  }

  setUrl(url)
  {
    this.url = url;
    return this;
  }

  setMethod(url)
  {
    this.method = url;
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

  setEventCallback(cb)
  {
    this.eventCallback = cb;
    return this;
  }

  send()
  {
    const self = this;
    return new Promise(
      (resolve, reject) =>
      {
        const xhr = this._xhr = new (this.xhrClass)();

        if(this.eventCallback)
        {
          xhr.addEventListener('loadstart', this.eventCallback);
          xhr.addEventListener('load', this.eventCallback);
          xhr.addEventListener('loadend', this.eventCallback);
          xhr.addEventListener('progress', this.eventCallback);
          xhr.addEventListener('error', this.eventCallback);
          xhr.addEventListener('abort', this.eventCallback);
        }

        xhr.addEventListener('load', () =>
        {
          self._xhr = null;
          resolve(xhr);
        });
        xhr.addEventListener('error', () =>
        {
          self._xhr = null;
          reject(xhr);
        });
        xhr.addEventListener('abort', () =>
        {
          self._xhr = null;
          reject(xhr);
        });

        if(this.responseType)
        {
          xhr.responseType = this.responseType;
        }

        let data;
        if((typeof this.data === 'object') && !(this.data instanceof FormData))
        {
          data = new FormData();
          for(let name in this.data)
          {
            if(this.data.hasOwnProperty(name))
            {
              data.append(name, this.data[name]);
            }
          }
        }
        else
        {
          data = this.data;
        }

        xhr.open(this.method, this.url, true);

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
      }
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
