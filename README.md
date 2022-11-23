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
