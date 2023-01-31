# IPFS Race
[![NPM](https://img.shields.io/npm/v/ipfs-race.svg)](https://www.npmjs.com/package/ipfs-race)
[![NPM](https://img.shields.io/npm/dt/ipfs-race.svg)](https://www.npmjs.com/package/ipfs-race)
[![GITHUB](https://img.shields.io/github/issues/Frame-One-Software/ipfs-race.svg)](https://github.com/Frame-One-Software/ipfs-race/issues)

Resolve an IPFS path using multiple gateways and methods to get data the fastest.

```bash
npm i ipfs-race
```

```typescript
import {resolve} from "ipfs-race";

resolve("QmaiJczLW9X1Gk7rQH7CgYCuquLZMbdWB6hhqznDBoqdLE")
  .then(({response, urlResolvedFrom}) => {
    console.log("received data first from: ", urlResolvedFrom);
    console.log("data: ", await response.json());
  })
  .catch(console.error);
```

## Node-Fetch Support
If using this library in `<16.x.x` versions of node on a backend and not a browser, then you will need to use [node-fetch](https://www.npmjs.com/package/node-fetch). However, only versions `<=2.6.6` will work automatically. If you are using `>2.6.6` then you will need to pass in your fetch function manually.

```typescript
import {resolve} from "ipfs-race";
import fetch from "node-fetch";

resolve("QmaiJczLW9X1Gk7rQH7CgYCuquLZMbdWB6hhqznDBoqdLE", {fetchOverride: fetch})
  .then(...)
  .catch(console.error);
```
