import * as isIPFS from 'is-ipfs'
import {defaultIpfsGateways, defaultIpnsGateways} from "./defaultGateways";
import {isValidHttpUrl} from "./isValidHttpUrl";

interface ResolveOptions {
    ipfsGateways?: string[];
    ipnsGateways?: string[];
    defaultProtocolIfUnspecified: "ipfs" | "ipns";
}

const defaultResolveOptions: Required<ResolveOptions> = {
    ipfsGateways: defaultIpfsGateways,
    ipnsGateways: defaultIpnsGateways,
    defaultProtocolIfUnspecified: "ipfs"
}

interface ResolveOutput {
    response: Response;
    urlResolvedFrom?: string;
}

/**
 * Fetches data from an ipfs uri using multiple methods and resolving the first one that returns a value.
 *
 * @param {string} uri - the uri on ipfs that needs to be resolved, it can follow any of the following formats...
 *      - <CID>
 *      - <CID>/<path>
 *      - ipfs/<CID>
 *      - ipfs/<CID>/path
 *      - ipns/<CID>
 *      - ipns/<CID>/path
 *      - http(s)://<gateway domain>/ipfs/<CID>
 *      - http(s)://<gateway domain>/ipfs/<CID>/<path>
 *      - http(s)://<gateway domain>/ipns/<CID>
 *      - http(s)://<gateway domain>/ipns/<CID>/<path>
 *      - ipfs://<CID>
 *      - ipfs://<CID>/<path>
 *      - ipns://<CID>
 *      - ipns://<CID>/<path>
 *      - https(s)://<regular url> - this will resolve an http request for a generic url
 * @param options
 */
async function resolve(uri: string, options?: ResolveOptions): Promise<ResolveOutput> {

    // merge the options with the default options
    const _options: Required<ResolveOptions> = {
        ...defaultResolveOptions,
        ...(options || {})
    };

    let gatewaySuffix: string;
    let protocol: "ipfs" | "ipns" = _options.defaultProtocolIfUnspecified;

    // determine what type of uri was passed in
    // CID or CID with path passed in directly
    if (isIPFS.cid(uri) || isIPFS.cidPath(uri)) {
        gatewaySuffix = `/${protocol}/${uri}`;
    }

    // ipfs path passed in
    else if (isIPFS.ipfsPath(uri)) {
        protocol = "ipns";
        gatewaySuffix = `/${protocol}/${uri}`;
    }

    // ipns path passed in
    else if (isIPFS.ipnsPath(uri)) {
        protocol = "ipns";
        gatewaySuffix = `/${protocol}/${uri}`;
    }

    // check to see if uri is a link to a gateway and ipfs
    else if (isIPFS.ipfsUrl(uri) || isIPFS.ipnsUrl(uri)) {

        // remove splits between "/"s until it is a valid ipfs or ipns path
        const tmp: string = uri;
        do {
            tmp.split("/").pop();
        } while (tmp.includes("/") && !isIPFS.path(uri));

        // determine the correct protocol
        if (isIPFS.ipfsPath(tmp)) {
            protocol = "ipfs";
        } else if (isIPFS.ipnsPath(tmp)) {
            protocol = "ipns";
        }

        gatewaySuffix = `/${protocol}/${tmp}`;
    }

    // check to see if the link has the ipfs:// or ipns:// protocol/scheme
    else if ((uri as string).startsWith("ipfs://") || (uri as string).startsWith("ipns://")) {

        // check to see if the CID after the ipfs protocal/scheme is valid
        const cidWithOptionalPath = (uri as string).substring(7);
        if (!isIPFS.cid(cidWithOptionalPath) && !isIPFS.cidPath(cidWithOptionalPath)) {
            throw new Error(`The uri (${uri}) passed in was malformed.`);
        }

        if ((uri as string).startsWith("ipfs://")) {
            protocol = "ipfs";
        } else if ((uri as string).startsWith("ipns://")) {
            protocol = "ipns";
        }

        gatewaySuffix = `/${protocol}/${cidWithOptionalPath}`;
    }

    // check to see if the uri is just a regular url that we can request
    else if (isValidHttpUrl(uri)) {
        return {
            response: await fetch(uri),
            urlResolvedFrom: uri,
        };
    }

    // throw an error because could not parse the uri
    else {
        throw new Error(`The uri (${uri}) passed in was malformed.`);
    }

    // determine if we are using ipfs or ipns gateways
    const gateways: string[] = protocol === "ipfs" ? _options.ipfsGateways : _options.ipnsGateways;

    // create an abort controller to stop the fetch requests when the first one is resolved.
    const controller = new AbortController();
    const signal = controller.signal;

    // create a promise to each gateway
    const promises = gateways.map(async (gatewayUrl): Promise<ResolveOutput> => {
        const urlResolvedFrom = `${gatewayUrl}${gatewaySuffix}`;
        const response = await  fetch(urlResolvedFrom, {
            method: "get",
            signal,
        });
        return {
            response,
            urlResolvedFrom
        }
    })

    // get the first response from the gateway
    return await Promise.race(promises);
}

export {
    ResolveOptions,
    defaultResolveOptions,
    defaultIpfsGateways,
    defaultIpnsGateways,
    resolve
}