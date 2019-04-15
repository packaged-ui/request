export default class Request
{
  constructor(url, callback)
  {
    this
      .setUrl(url)
      .onSuccess(callback);
  }

  setUrl(url)
  {
    this.url = url;
    return this;
  }

  setData(data)
  {
    this.data = data;
    return this;
  }

  onSuccess(callback)
  {
    this.successCallback = callback;
    return this;
  }

  setHeaders(headers)
  {
    this.headers = headers;
    return this;
  }

  send()
  {
    const self = this;
    const xhr = new XMLHttpRequest();
    xhr.addEventListener(
      'readystatechange',
      function ()
      {
        switch(xhr.readyState)
        {
          case XMLHttpRequest.DONE:
            if(self.successCallback)
            {
              self.successCallback(xhr.response, xhr);
            }
            break;
        }
      }
    );

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
    if(typeof this.data === 'object')
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

    xhr.open(data ? 'POST' : 'GET', this.url, true);
    xhr.send(data);
  }
}
