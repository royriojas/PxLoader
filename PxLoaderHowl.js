/*global PxLoader: true, define: true, Howler: true, Howl: true */
;(function($, global){

  var soundCounter = 0;

  var channels = {};

  var oldPlay = Howl.prototype.play,
    oldStop = Howl.prototype.stop;

  Howl.prototype.play = function () {
    var me = this;
    me.playing = true;
    oldPlay && oldPlay.apply(me, arguments);
  };

  Howl.prototype.stop = function () {
    var me = this;
    me.playing = false;
    oldStop && oldStop.apply(me, arguments);
  };

  var HowlProxy = function (opts) {
    var me = this;
    me.id = opts.id;
    me.url = opts.url;
    me.channel = opts.channel;
    me.onLoad = opts.onLoad;
    me.onError = opts.onError;
    me.xFadeTime = (opts.xFadeTime || 0.5) * 1000;
    me.instanceId = soundCounter++;
    me.opts = opts;
  };

  HowlProxy.getSoundInChannel = function (channel) {
    var currentSound = channels[channel];
    return currentSound;
  };

  HowlProxy.stopSoundInChannel = function (channel) {
    var currentSound = channels[channel];

    if (currentSound) {
      channels[channel] = null;
      currentSound.fadeOut(0, currentSound.xFadeTime, function () {
        currentSound.stop();
      });  
    }
  };

  HowlProxy.prototype = {

    load: function () {
      var me = this;

      var url = me.url;
      var regex = /\.(.*)$/g;

      var urls = [];
      var formats = ['m4a', 'ogg', 'mp3'];

      formats.forEach(function (format) {
        urls.push(url.replace(regex, function (a, b) {
          return '.' + format;
        }));
      });

      me.howl = new Howl($.extend(me.opts, {
        urls: urls,
        autoplay : false,
        onload : function () {
          me.onLoad && (me.onLoad(me.id));
        },
        onloaderror : function () {
          me.onError && me.onError(me.id);
        }
      }));
    },

    play : function (atVolume) {
      var me = this,
        doFadeIn = false,
        d = $.Deferred();

      if (me.channel) {
        var currentSound = channels[me.channel];
        if (currentSound && currentSound !== me) {
          doFadeIn = true;
          currentSound.fadeOut(0, me.xFadeTime, function () {
            currentSound.stop();
          });
        }
      }

      var ns = 'end.end_' + me.instanceId;
      var howl = me.howl;

      if (howl) {
        if (typeof atVolume !== "undefined") {
          howl.volume(atVolume);
        }


        howl.on(ns, function () {
          d.resolve({});
          howl.off(ns);
        });

        if (!doFadeIn) {
          if (!me.howl.playing) {
            howl.play();
          }
        }
        else {
          me.fadeIn(atVolume || 1, me.xFadeTime);
        }

        if (me.channel) {
          channels[me.channel] = me;
        }
      }

      return d.promise();
    },

    playAsLoop : function () {
      var me = this;
      me.loop(true);
      me.play();
      return me;
    },

    isLoaded : function () {
      var me = this;
      return !!me.howl._loaded;
    }
  };

  var methods = ["urls", "mute", "unmute", "pause", "stop",
    "volume", "loop", "sprite", "pos", "pos3d", "fade", "fadeIn",
    "fadeOut", "on", "off", "unload", "fadeStep"];

  // add methods to the proxy
  methods.forEach(function (name) {
    HowlProxy.prototype[name] = function () {
      var me = this;
      var howl = me.howl || {};
      var method = howl[name];
      method && method.apply(howl, arguments);
    };
  });

  // PxLoader plugin to load sound using Howler
  function PxLoaderHowl(options) {
    var me = this,
      loader = null;

    me.tags = options.tags;
    me.priority = options.priority;

    me.sound = new HowlProxy($.extend({
      onLoad : function () {
        loader && loader.onLoad(me);
      },
      onError : function () {
        loader && loader.onError(me);
      }
    }, options));

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
      return options.url;
    };
  }

// add a convenience method to PxLoader for adding a sound
  PxLoader.prototype.addHowl = function (id, url, tags, priority) {
    var howlerLoader = new PxLoaderHowl({id: id, url: url, tags: tags, priority: priority});
    this.add(howlerLoader);
    return howlerLoader.sound;
  };

// AMD module support
  if (typeof define === 'function' && define.amd) {
    define('PxLoaderHowl', [], function () {
      return PxLoaderHowl;
    });
  }

  global.HowlProxy = HowlProxy;
  global.PxLoaderHowl = PxLoaderHowl;

}(jQuery, this));
