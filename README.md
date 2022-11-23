# IPFS Race

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
