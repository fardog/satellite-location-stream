# satellite-location-stream 1.0.1

Get information about current satellite locations (via [Where the ISS at?][where]) as a readable stream.

## Installation

To install the module for use in your projects:

```bash
npm install satellite-location-stream
```

## Usage

```js
var Location = require('satellite-location-stream').Location;

// The options object; what's shown is the defaults
var opts = {
	endpoint: "https://api.wheretheiss.at/v1/satellites/", //endpoint URL with trailing slash
	rate: 1000, //request rate (in milliseconds)
	strictSSL: false //whether to use strict SSL or not
}
var location = new Location(25544, opts); //Location(id, [options]) where `id` is the NORAD catalog id

location.pipe(your_consumer);

/* data: 
{ name: 'iss',
  id: 25544,
  latitude: 49.477175433505,
  longitude: -11.026155815963,
  altitude: 419.42741087365,
  velocity: 27598.337754058,
  visibility: 'eclipsed',
  footprint: 4504.5492361955,
  timestamp: 1411782438,
  daynum: 2456927.5745139,
  solar_lat: -1.5449609088441,
  solar_lon: 150.96137394295,
  units: 'kilometers' }
*/

// There is also a stream transform provided, which gives the latitude/longitude per second
var LocationDeltaTransform = require('satellite-location-stream').LocationDeltaTransform;
var change = new LocationDeltaTransform();

location.pipe(change).pipe(your_consumer);

/* data:
{ name: 'iss',
  id: 25544,
  latitude: 50.426977383558,
  longitude: 28.080581998245,
  altitude: 419.21472141233,
  velocity: 27599.974048594,
  visibility: 'eclipsed',
  footprint: 4503.466155975,
  timestamp: 1411782840,
  daynum: 2456927.5791667,
  solar_lat: -1.5467722126556,
  solar_lon: 149.28597784223,
  units: 'kilometers',
  latitude_delta: -0.015389977590230464,
  longitude_delta: 0.09389492416600079 }
*/
```

**Note:** [Where the ISS at?][where] rate limits to about 1 request per second. Until this rate is lifted, setting a rate less than 1000ms will result in an error being thrown.

[where]: http://wheretheiss.at

## API

### satellite.Location(id, [options])

Create an [object mode](http://nodejs.org/api/stream.html#stream_object_mode) readable stream of location data for a satellite who's `id` matches the NORAD catalog id.

Options is an optional object with any of the following keys:

```
{
	endpoint: "http://some_url_with_trailing_slash/",
	rate: some_number_in_ms,
	strictSSL: true_or_false
}
```

### satellite.LocationDeltaTransform()

Create a [transform stream](http://nodejs.org/api/stream.html#stream_class_stream_transform) that, when applied to the satellite.Location readable stream, will add the change in latitude and longitude each second. Until two data points are available, these change deltas will be `null`.

## Environment Variables

- **SLS_STRICT_SSL:** node may report that [wheretheiss.at](http://wheretheiss.at) has an incorrect certificate, and so by default Strict SSL is off. You an turn it back on by setting this to a truth-y value, in lieu of setting in in the options object.
- **SLS_DISABLE_RATE_LIMIT:** set this to a truth-y value to disable the error thrown when you try to set the limit to less than 1000ms. This may cause you to hit the rate limit of Where the ISS at? and the stream to emit errors.
- **SLS_TEST_REAL_API:** set this to a truth-y value to run tests using the real API, rather than the mock API.
- **PORT:** The port to be used for the mock API during testing.

## Known Issues

- By default, the tests spawn a mock-API server on port 8080. Tests will fail if this port is already in use. See the **PORT** environment variable above.

## Contributing

Feel free to send pull requests! I'm not picky, but would like the following:

1. Write tests for any new features, and do not break existing tests.
2. Be sure to point out any changes that break API.

## History

- **v1.0.1**  
Now stops requests to Where the ISS at? if our stream's buffer is filled, and re-starts after it's consumed.

- **v1.0.0**  
Initial Release.

## The MIT License (MIT)

Copyright (c) 2014 Nathan Wittstock

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
