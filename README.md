## Smart Kiln (Pi server)

This is the Pi server fro the "Smart Kiln" project.

## Hardware Setup

#### Parts:
- <a href="https://www.amazon.com/gp/product/B07BC6WH7V/ref=oh_aui_detailpage_o00_s00?ie=UTF8&psc=1">Raspberry Pi</a>
- <a href="https://www.amazon.com/gp/product/B06XWN9Q99/ref=oh_aui_detailpage_o00_s00?ie=UTF8&psc=1">SD Card</a>
- <a href="https://www.amazon.com/gp/product/B0753XW76H/ref=oh_aui_detailpage_o00_s01?ie=UTF8&psc=1">Solid State Relay</a>
- <a href="https://www.amazon.com/gp/product/B00SK8NDAI/ref=oh_aui_detailpage_o00_s01?ie=UTF8&psc=1">Thermocouple Amplifier</a>
- <a href="http://www.theceramicshop.com/product/10885/Type-K-Thermocouple-8B/">Ceramic type-k Thermocouple</a>

### Wiring:

#### soldered parts
![simple-wiring](https://github.com/ZachJMoore/smart-kiln-pi-server/blob/master/simple-wiring.png?raw=true)

The thermocouple are screwed directly to the amp. Neutral/ground coming back from the kiln elements can then also be screwed into the relay to programatically close the circuit

### Software Setup

Due to data caps on firebase, everyone must run their own version for now. Refer to <a href="https://github.com/ZachJMoore/smart-kiln-pi-server/blob/master/js/static/firebase/firebase-example.js">firebase-example</a> for setting api keys with your own firebase project, and then rename your edited file to exactly "firebase.js" in the firebase folder inorder to keep relative paths correct.
Also, in the static folder, config needs to be filled in with your login credentials for an account on your firebase. Refer to <a href="https://github.com/ZachJMoore/smart-kiln-pi-server/blob/master/js/static/config-example.json">config-example</a> for format. Then rename exactly to config.json in the same folder.

Until otherwise decided. My server smartkiln.xyz can be used for proxying requests and is open for people to use within reason (credits to <a href="https://github.com/ericbarch/socket-tunnel">this</a> project for the proxy software). Everything is setup to run correctly if the above steps were followed.

in the root directory run in terminal the following to start the server

```
    $npm install
    $node js/server.js
```

~~At the moment, this will only let you be able to check temperature from the web interface. Currently selecting a schedule and pressing start will only console log the recieved schedule. I have commented out the PID portion as it is not ready yet and needs more work.~~

The kiln object is now a class and has propper intergration for firing a schedule. Very little error handling has been added, but the ability to fire a schedule completely from the web interface is now supported.

Help is very welcome, please feel free to make a pull request!