/*global PxLoader: true, define: true, Howler: true, Howl: true */
;(function(global){

  var HowlProxy = function (opts) {
    var me = this;
    me.id = opts.id;
    me.url = opts.url;
    me.onLoad = opts.onLoad;
  };

  HowlProxy.prototype = {
    constructor: HowlProxy,

    load: function () {
      var me = this;

      var url = me.url;
      var regex = /\.(.*)$/g;

      var urls = [];
      var formats = ['m4a', 'ogg', 'mp3'];

      formats.forEach(function (format) {
        urls.push(url.replace(regex, function (a, b) {
          return '.' + format;
        }))
      });

      me.howl = new Howl({
        urls: urls,
        autoplay : false,
        onload : function () {
          me.onLoad && me.onLoad(me.id);
        },
        onloaderror : function () {
          me.onError && me.onError(me.id);
        }
      });
    },

    isLoaded : function () {
      var me = this;
      return !!me.howl._loaded;
    }
  };

  // PxLoader plugin to load sound using Howler
  function PxLoaderHowl(id, url, tags, priority) {
    var me = this,
      loader = null;

    me.tags = tags;
    me.priority = priority;

    me.sound = new HowlerProxy({
      id : id,
      url : url,
      onLoad : function () {
        loader && loader.onLoad(me);
      },
      onError : function () {
        loader && loader.onError(me);
      }
    });

    me.start = function (pxLoader) {
      // we need the loader ref so we can notify upon completion
      loader = pxLoader;
      me.sound.load();
    };

    me.checkStatus = function () {
      if (me.sound.isLoaded()) {
        loader.onLoad(me);
      }
    };

    me.onTimeout = function () {
      loader.onTimeout(me);
    };

    me.getName = function () {
      return url;
    };
  }

// add a convenience method to PxLoader for adding a sound
  PxLoader.prototype.addHowl = function (id, url, tags, priority) {
    var howlerLoader = new PxLoaderHowl(id, url, tags, priority);
    this.add(howlerLoader);
    return howlerLoader.sound;
  };

// AMD module support
  if (typeof define === 'function' && define.amd) {
    define('PxLoaderHowl', [], function () {
      return PxLoaderHowl;
    });
  }

}(this));