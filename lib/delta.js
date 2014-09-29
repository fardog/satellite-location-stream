"use strict";
var Transform = require('stream').Transform;
var util = require('util');
var debug = require('debug')('change');

/**
 * Creates a new Location Delta transform.
 *
 * @access public
 * @constructor
 * @extends stream.Transform
 * 
 * @returns {LocationDeltaTransform} The stream transform.
 */
function LocationDeltaTransform(opts) {
  if (!opts) opts = {};
  opts.objectMode = true;
  Transform.call(this, opts);

  this.last = null;
  this.lastCallTime = null;
};
util.inherits(LocationDeltaTransform, Transform);

/**
 * Implements the Transform Stream's _transform method.
 *
 * @access private
 */
LocationDeltaTransform.prototype._transform = function(chunk, enc, cb) {
  debug("_transform()");
  // if we have an old chunk, and got one this time, do the calculation
  if (this.last && chunk) {
    var time = (new Date() - this.lastCallTime) / 1000;
    chunk.latitude_delta = (chunk.latitude - this.last.latitude) / time,
    chunk.longitude_delta = (chunk.longitude - this.last.longitude) / time
  }
  // special case for first-time read; we can't determine change, so just set null
  else if (!this.last && chunk) {
    chunk.latitude_delta = null;
    chunk.longitude_delta = null;
  }

  // save the chunk for the next calculation
  if (chunk) {
    this.last = chunk;
    this.lastCallTime = new Date();
    this.push(chunk);
  }
  cb();
};

module.exports = LocationDeltaTransform;
