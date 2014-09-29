var should = require('should');
var through = require('through2');
var Location = require('../').Location;
var LocationDeltaTransform = require('../').LocationDeltaTransform;

var PORT = process.env.PORT || 8080;

var endpoint = process.env.SLS_TEST_REAL_API ? null : 'http://localhost:' + PORT + '/';
if (endpoint) {
  var mockApi = require('./mock/mock-api.js');
}

describe('location', function() {
  var location = null;
  var writable = null;

  beforeEach(function() {
    location = new Location(25544, {rate: 1000, endpoint: endpoint});
  });

  afterEach(function() {
    location.close();
    location = null;
  });

  it('should deliver JSON data from its upstream source', function(done) {
    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        chunk.should.be.type('object');
        done();
      }
      cb();
    }));
  });

  it('should have latitude and longitude present', function(done) {
    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        chunk.latitude.should.be.type('number');
        chunk.longitude.should.be.type('number');
        done();
      }
      cb();
    }));
  });

  it('should support multiple reads', function(done) {
    this.timeout(5000);
    var count = 0;
    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        chunk.should.be.type('object');
        count++;
        if (count === 4) {
          done();
        }
      }
      cb();
    }));
  });

  it('should deliver data at approximately the correct rate', function(done) {
    this.timeout(5000);
    var count = 0;
    var last = null;
    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        if (last) {
          (new Date() - last).should.be.approximately(1000, 100);
          last = new Date();
        }
        else {
          last = new Date();
        }
        count++;
        if (count === 4) {
          done();
        }
      }
      cb();
    }));
  });

  it('should deliver different lat/long data each time', function(done) {
    this.timeout(5000);
    var count = 0;
    var lastData = null;
    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        if (lastData) {
          chunk.latitude.should.not.equal(lastData.latitude);
          lastData = chunk;
        }
        else {
          lastData = chunk;
        }
        count++;
        if (count === 4) {
          done();
        }
      }
      cb();
    }));
  });
});

describe('different rates', function() {
  it('should allow for different rates to be set', function(done) {
    this.timeout(7000);
    var location = new Location(25544, {rate: 2000, endpoint: endpoint});
    var last = null;
    var count = 0;

    location.pipe(through.obj(function(chunk, enc, cb) {
      if(chunk) {
        if (last) {
          (new Date() - last).should.be.approximately(2000, 100);
          last = new Date();
        }
        else {
          last = new Date();
        }
        count++;
        if (count === 3) {
          location.close();
          done();
        }
      }
      cb();
    }));
  });
});

describe('slow consumer', function() {
  it('shouldn\'t be tripped up by a slow consumer', function(done) {
    this.timeout(9000);
    var location = new Location(25544, {rate: 1000, endpoint: endpoint});
    var count = 0;

    location.pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        count++;
        if (count === 3) {
          location.close();
          done();
        }
      }
      setTimeout(cb, 2000);
    }));
  });
});

describe('lat/long delta', function() {
  it('should provide the lat/long change delta on the second reply', function(done) {
    this.timeout(5000);
    var location = new Location(25544, {rate: 1000, endpoint: endpoint});
    var change = new LocationDeltaTransform();
    var count = 0;

    location.pipe(change).pipe(through.obj(function(chunk, enc, cb) {
      if (chunk) {
        count++;
        if (count === 1) {
          should(chunk.latitude_delta).not.be.ok;
          should(chunk.longitude_delta).not.be.ok;
        }
        else if (count > 3) {
          location.close();
          done();
        }
        else {
          chunk.latitude_delta.should.be.type('number');
          chunk.longitude_delta.should.be.type('number');
        }
      }
      cb();
    }));
  });
});
