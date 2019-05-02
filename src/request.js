export default class Request
{
  static get GET() {return 'get'};

  static get POST() {return 'post'};

  static get PUT() {return 'put'};

  static get DELETE() {return 'delete'};

  constructor(url)
  {
    this.setUrl(url);
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

  send()
  {
    return new Promise(
      (resolve, reject) =>
      {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function () {resolve(xhr)});
        xhr.addEventListener('error', function () {reject(xhr)});

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

        xhr.open(this.method || Request.GET, this.url, true);
        xhr.send(data);
      }
    );
  }
}
