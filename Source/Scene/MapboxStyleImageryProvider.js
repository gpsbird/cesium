import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import MapboxApi from "../Core/MapboxApi.js";
import Resource from "../Core/Resource.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

var trailingSlashRegex = /\/$/;
var defaultCredit = new Credit(
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/">Improve this map</a></strong>'
);

/**
 * Provides tiled imagery hosted by Mapbox.
 *
 * @alias MapboxStyleImageryProvider
 * @constructor
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Resource|String} [options.url='https://api.mapbox.com/styles/v1/'] The Mapbox server url.
 * @param {String} [options.username='mapbox'] The username of the map account.
 * @param {String} options.styleId The Mapbox Style ID.
 * @param {String} [options.accessToken] The public access token for the imagery.
 * @param {Number} [options.tilesize=512] The size of the image tiles.
 * @param {Boolean} [options.scaleFactor] Determines if tiles are rendered at a @2x scale factor.
 * @param {Ellipsoid} [options.ellipsoid] The ellipsoid.  If not specified, the WGS84 ellipsoid is used.
 * @param {Number} [options.minimumLevel=0] The minimum level-of-detail supported by the imagery provider.  Take care when specifying
 *                 this that the number of tiles at the minimum level is small, such as four or less.  A larger number is likely
 *                 to result in rendering problems.
 * @param {Number} [options.maximumLevel] The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
 * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] The rectangle, in radians, covered by the image.
 * @param {Credit|String} [options.credit] A credit for the data source, which is displayed on the canvas.
 *
 *
 * @example
 * // Mapbox style provider
 * var mapbox = new Cesium.MapboxStyleImageryProvider({
 *     styleId: 'streets-v11',
 *     accessToken: 'thisIsMyAccessToken'
 * });
 *
 * @see {@link https://docs.mapbox.com/api/maps/#styles}
 * @see {@link https://docs.mapbox.com/api/#access-tokens-and-token-scopes}
 */
function MapboxStyleImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  var styleId = options.styleId;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(styleId)) {
    throw new DeveloperError("options.styleId is required.");
  }
  //>>includeEnd('debug');

  var resource = Resource.createIfNeeded(
    defaultValue(options.url, "https://api.mapbox.com/styles/v1/")
  );

  var accessToken = MapboxApi.getAccessToken(options.accessToken);
  this._styleId = styleId;
  this._accessToken = accessToken;

  this._accessTokenErrorCredit = Credit.clone(
    MapboxApi.getErrorCredit(options.accessToken)
  );

  var tilesize = defaultValue(options.tilesize, 512);
  this._tilesize = tilesize;

  var username = defaultValue(options.username, "mapbox");
  this._username = username;

  var scaleFactor = defined(options.scaleFactor) ? "@2x" : "";

  var templateUrl = resource.getUrlComponent();
  if (!trailingSlashRegex.test(templateUrl)) {
    templateUrl += "/";
  }
  templateUrl +=
    this._username +
    "/" +
    styleId +
    "/tiles/" +
    this._tilesize +
    "/{z}/{x}/{y}" +
    scaleFactor;
  resource.url = templateUrl;

  resource.setQueryParameters({
    access_token: accessToken,
  });

  var credit;
  if (defined(options.credit)) {
    credit = options.credit;
    if (typeof credit === "string") {
      credit = new Credit(credit);
    }
  } else {
    credit = defaultCredit;
  }

  this._resource = resource;
  this._imageryProvider = new UrlTemplateImageryProvider({
    url: resource,
    credit: credit,
    ellipsoid: options.ellipsoid,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    rectangle: options.rectangle,
  });
}

Object.defineProperties(MapboxStyleImageryProvider.prototype, {
  /**
   * Gets the URL of the Mapbox server.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {String}
   * @readonly
   */
  url: {
    get: function () {
      return this._imageryProvider.url;
    },
  },

  /**
   * Gets a value indicating whether or not the provider is ready for use.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._imageryProvider.ready;
    },
  },

  /**
   * Gets a promise that resolves to true when the provider is ready for use.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Promise.<Boolean>}
   * @readonly
   */
  readyPromise: {
    get: function () {
      return this._imageryProvider.readyPromise;
    },
  },

  /**
   * Gets the rectangle, in radians, of the imagery provided by the instance.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._imageryProvider.rectangle;
    },
  },

  /**
   * Gets the width of each tile, in pixels.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._imageryProvider.tileWidth;
    },
  },

  /**
   * Gets the height of each tile, in pixels.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._imageryProvider.tileHeight;
    },
  },

  /**
   * Gets the maximum level-of-detail that can be requested.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._imageryProvider.maximumLevel;
    },
  },

  /**
   * Gets the minimum level-of-detail that can be requested.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true. Generally,
   * a minimum level should only be used when the rectangle of the imagery is small
   * enough that the number of tiles at the minimum level is small.  An imagery
   * provider with more than a few tiles at the minimum level will lead to
   * rendering problems.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._imageryProvider.minimumLevel;
    },
  },

  /**
   * Gets the tiling scheme used by the provider.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._imageryProvider.tilingScheme;
    },
  },

  /**
   * Gets the tile discard policy.  If not undefined, the discard policy is responsible
   * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
   * returns undefined, no tiles are filtered.  This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * Gets an event that is raised when the imagery provider encounters an asynchronous error..  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of {@link TileProviderError}.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._imageryProvider.errorEvent;
    },
  },

  /**
   * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
   * the source of the imagery. This function should
   * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._imageryProvider.credit;
    },
  },

  /**
   * Gets the proxy used by this provider.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._imageryProvider.proxy;
    },
  },

  /**
   * Gets a value indicating whether or not the images provided by this imagery provider
   * include an alpha channel.  If this property is false, an alpha channel, if present, will
   * be ignored.  If this property is true, any images without an alpha channel will be treated
   * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
   * and texture upload time are reduced.
   * @memberof MapboxStyleImageryProvider.prototype
   * @type {Boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._imageryProvider.hasAlphaChannel;
    },
  },
});

/**
 * Gets the credits to be displayed when a given tile is displayed.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level;
 * @returns {Credit[]} The credits to be displayed when the tile is displayed.
 *
 * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
 */
MapboxStyleImageryProvider.prototype.getTileCredits = function (x, y, level) {
  if (defined(this._accessTokenErrorCredit)) {
    return [this._accessTokenErrorCredit];
  }
};

/**
 * Requests the image for a given tile.  This function should
 * not be called before {@link MapboxStyleImageryProvider#ready} returns true.
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Request} [request] The request object. Intended for internal use only.
 * @returns {Promise.<Image|Canvas>|undefined} A promise for the image that will resolve when the image is available, or
 *          undefined if there are too many active requests to the server, and the request
 *          should be retried later.  The resolved image may be either an
 *          Image or a Canvas DOM object.
 *
 * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
 */
MapboxStyleImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request
) {
  return this._imageryProvider.requestImage(x, y, level, request);
};

/**
 * Asynchronously determines what features, if any, are located at a given longitude and latitude within
 * a tile.  This function should not be called before {@link MapboxStyleImageryProvider#ready} returns true.
 * This function is optional, so it may not exist on all ImageryProviders.
 *
 *
 * @param {Number} x The tile X coordinate.
 * @param {Number} y The tile Y coordinate.
 * @param {Number} level The tile level.
 * @param {Number} longitude The longitude at which to pick features.
 * @param {Number} latitude  The latitude at which to pick features.
 * @return {Promise.<ImageryLayerFeatureInfo[]>|undefined} A promise for the picked features that will resolve when the asynchronous
 *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
 *                   instances.  The array may be empty if no features are found at the given location.
 *                   It may also be undefined if picking is not supported.
 *
 * @exception {DeveloperError} <code>pickFeatures</code> must not be called before the imagery provider is ready.
 */
MapboxStyleImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

// Exposed for tests
MapboxStyleImageryProvider._defaultCredit = defaultCredit;
export default MapboxStyleImageryProvider;
