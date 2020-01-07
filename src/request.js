export default class Request
{
  static get xhrClass()
  {
    return Request._XHR || XMLHttpRequest;
  }

  static set xhrClass(xhr)
  {
    Request._XHR = xhr;
  }

  static get GET() {return 'get'};

  static get POST() {return 'post'};

  static get PUT() {return 'put'};

  static get DELETE() {return 'delete'};

  constructor(url)
  {
    this.url = url;
    this.method = Request.GET;
    this.data = {};
    this.headers = {};
    this.responseType = null;
    this.eventCallback = null;
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
    return new Promise(
      (resolve, reject) =>
      {
        const xhr = new (Request.xhrClass)();

        if(this.eventCallback)
        {
          xhr.addEventListener('loadstart', this.eventCallback);
          xhr.addEventListener('load', this.eventCallback);
          xhr.addEventListener('loadend', this.eventCallback);
          xhr.addEventListener('progress', this.eventCallback);
          xhr.addEventListener('error', this.eventCallback);
          xhr.addEventListener('abort', this.eventCallback);
        }

        xhr.addEventListener('load', function () {resolve(xhr)});
        xhr.addEventListener('error', function () {reject(xhr)});
        xhr.addEventListener('abort', function () {reject(xhr)});

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
}
