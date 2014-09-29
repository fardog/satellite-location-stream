"use strict";
var request = require('request');
var Readable = require('stream').Readable;
var util = require('util');
var debug = require('debug')('location');

var MIN_RATE = 1000;

/**
 * Create a new Location stream.
 *
 * @access public
 * @constructor
 * @extends stream.Readable
 * @param {number} id - The NORAD catalog id of the satellite you wish to track.
 * @param {object} [opts] - The optional array of options.
 *
 * @returns {Location} The location readable stream.
 */
function Location(id, opts) {
  if (!opts) opts = {};

  // we emit objects, not buffers
  opts.objectMode = true;
  Readable.call(this, opts);

  this.opts = opts;
  this.id = id;

  // set defaults
  opts.endpoint = opts.endpoint || "https://api.wheretheiss.at/v1/satellites/";
  opts.rate = opts.rate || 1000;
  opts.strictSSL = opts.strictSSL || (process.env.SLS_STRICT_SSL ? true : false) || false;
  opts.uri = opts.endpoint + id;

  // verify options
  if (!this.id) {
    throw new Error('`id` is a required parameter');
  }
  if (opts.rate < MIN_RATE && !process.env.SLS_DISABLE_RATE_LIMIT) {
    throw new Error('Rate cannot be less than ' + MIN_RATE);
  }

  debug('Location() instantiated. rate: %dms, url: %s', 
        opts.rate, opts.endpoint + id);

  this.timeout = null;

  return this;
};
util.inherits(Location, Readable);

/**
 * Implements the Readable Stream's _read method.
 *
 * @access private
 */
Location.prototype._read = function() {
  // don't make our first call until we're read
  if (!this.running) {
    debug('_read() making first request');
    this._doRequest();
    this.running = true;
  }
};

/**
 * Performs a request to the API endpoint.
 *
 * @access private
 */
Location.prototype._doRequest = function() {
  debug('_doRequest() called');
  var options = {
    uri: this.opts.uri,
    strictSSL: this.opts.strictSSL
  };
  this.requestStartTime = new Date();
  request(options, this._onResponse.bind(this));
};

/**
 * Receives the response from an API request.
 *
 * @access private
 * @param {Error} [err] - An error, if one occurred.
 * @param {http.ServerResponse} res - The response object.
 * @param {object} [body] - The response body.
 * @emits {Location#error} An error, if one occurred.
 */
Location.prototype._onResponse = function (err, res, body) {
  debug('_onResponse() called');
  // if we fail, emit an error and shut down
  if(err || res.statusCode !== 200) {
    this.emit('error', err || new Error('endpoint responded with error: ' + res.statusCode));
    this.close();
    return;
  }
  else if (!body) {
    this.emit('error', new Error('endpoint did not provide a response body'));
    this.close();
    return;
  }

  // if we were closed while queued, do nothing
  if(!this.running) {
    return;
  }

  // parse response body and emit
  try {
    var data = JSON.parse(body);
    if(!this.push(data)) {
      debug('_onResponse() pushed too much data. shutting down.')
      this.running = false;
      return;
    }
  }
  catch (e) {
    this.emit('error', e);
    this.close();
    return;
  }

  this.timeout = setTimeout(this._doRequest.bind(this), 
                            this.opts.rate - (new Date() - this.requestStartTime));
};

/**
 * Closes the location readable stream.
 *
 * @access public
 */
Location.prototype.close = function () {
  if (this.timeout) {
    clearTimeout(this.timeout);
  }
  this.running = false;
  this.push(null);
};

module.exports = Location;
