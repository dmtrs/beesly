import Http from '../http/http';
import Request from '../http/request';
import uriTemplate from 'uri-templates';

function buildOptions(name, single, options) {
  options = options || {};

  options.single = single;
  options.name = name;

  if (!options.accessor) {
    options.accessor = name;
  }

  if (!options.class) {
    options.class = Resource;
  }

  return options;
}

class Resource {
  constructor(data) {
    this.internalHalLinks = {};
    this.embeddedConfig = {};
    this.embeddedResources = {};

    this.setup();

    if (data) {
      this.hydrate(data);
    }
  }

  setup() {

  }

  hasOne(name, options) {
    this.embeddedConfig[name] = buildOptions(name, true, options);
  }

  hasMany(name, options) {
    this.embeddedConfig[name] = buildOptions(name, false, options);
  }

  getLink(name) {
    if (name in this.internalHalLinks) {
      return this.internalHalLinks[name].href;
    }
  }

  getEmbedded(name) {
    if (name in this.embeddedResources) {
      return this.embeddedResources[name];
    }
  }

  // @todo @fixme refactor this mess
  hydrate(data) {
    Object.keys(data).forEach((key) => {
      if (key === '_embedded') {
        Object.keys(data[key]).forEach((embeddedKey) => {
          let collection = data[key][embeddedKey];

          collection.forEach((embeddedData) => {
            let configuredKey = embeddedKey;

            if (embeddedKey in this.embeddedConfig) {
              configuredKey = this.embeddedConfig[embeddedKey].accessor;

              if (this.embeddedConfig[embeddedKey].single) {
                this.embeddedResources[configuredKey] = new this.embeddedConfig[embeddedKey].class(embeddedData);
                this[configuredKey] = () => {
                  return this.embeddedResources[configuredKey];
                };
                return;
              } else {
                embeddedData = new this.embeddedConfig[embeddedKey].class(embeddedData);
              }
            }

            if (!(configuredKey in this.embeddedResources)) {
              this.embeddedResources[configuredKey] = [];
            }

            this[configuredKey] = () => {
              return this.embeddedResources[configuredKey];
            };

            this.embeddedResources[configuredKey].push(embeddedData);
          });
        });

        return;
      }

      if (key === '_links') {
        this.internalHalLinks = data[key];
        return;
      }

      this[key] = data[key];
    });
  }

  static get(params) {
    if (!this.url) {
      throw 'Resource url not defined';
    }

    var http = new Http(),
      url = uriTemplate(this.url).fill(params);

    var request = new Request(url);

    return http.get(request).then((response) => {
      return new this(response.json);
    });
  }

  create() {

  }

  update() {

  }

  delete() {

  }
}

export default Resource;
