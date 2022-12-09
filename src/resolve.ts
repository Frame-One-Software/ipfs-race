import * as isIPFS from 'is-ipfs'
import {defaultIpfsGateways, defaultIpnsGateways} from "./defaultGateways";
import {isValidHttpUrl} from "./isValidHttpUrl";
import any from "promise.any";
import { AbortController } from "node-abort-controller";

export type FetchType = (input: RequestInfo | URL , init?: RequestInit) => Promise<Response>;

interface ResolveOptions {
    ipfsGateways?: string[];
    ipnsGateways?: string[];
    defaultProtocolIfUnspecified?: "ipfs" | "ipns";
    fetchOverride?: FetchType;
}

const defaultResolveOptions: Required<ResolveOptions> = {
    ipfsGateways: defaultIpfsGateways,
    ipnsGateways: defaultIpnsGateways,
    defaultProtocolIfUnspecified: "ipfs",
    fetchOverride: globalThis?.fetch
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

    if (!_options.fetchOverride) {
        throw new Error("Fetch library not found, please pass in 'fetchOverride'. If you are running in the browser, this will likely be window.fetch, if in a node version >16.x.x it is global. If importing before 16.x.x then you will likely need to install 'node-fetch'.");
    }

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
        let tmp = (uri as string).split("/");
        let cid = uri;
        do {
            tmp.shift();
            cid = `/${tmp.join("/")}`;
        } while (tmp.length > 1 && !isIPFS.path(cid));

        // determine the correct protocol
        if (isIPFS.ipfsPath(cid)) {
            protocol = "ipfs";
        } else if (isIPFS.ipnsPath(cid)) {
            protocol = "ipns";
        }

        gatewaySuffix = cid
    }

    // check to see if the link has the ipfs:// or ipns:// protocol/scheme
    else if ((uri as string).startsWith("ipfs://") || (uri as string).startsWith("ipns://")) {

        const cidWithOptionalPath = (uri as string).substring(7);

        // check to see if the CID after the ipfs protocal/scheme is valid
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
        const response: Response = await fetch(uri, {
            method: "get",
        });

        if(response.status >= 300 || response.status < 200) {
            throw new Error(`Url (${uri}) did not return a 2xx response and did not match a valid IPFS/IPNS format.`);
        }

        return {
            response,
            urlResolvedFrom: uri,
        };
    }

    // throw an error because could not parse the uri
    else {
        throw new Error(`The uri (${uri}) passed in was malformed.`);
    }

    // determine if we are using ipfs or ipns gateways
    const gateways: string[] = protocol === "ipfs" ? _options.ipfsGateways : _options.ipnsGateways;

    // keep a list of all the abortControllers that will need to be called to abort the fetch calls
    const abortControllers = Array(gateways.length);

    // create a promise to each gateway
    const promises = gateways.map(async (gatewayUrl, i): Promise<ResolveOutput> => {

        try {
            // create an abort controller to stop the fetch requests when the first one is resolved.
            const controller = new AbortController();
            const signal = controller.signal;
            abortControllers[i] = controller;

            const urlResolvedFrom = `${gatewayUrl}${gatewaySuffix}`;
            const response = await _options.fetchOverride(urlResolvedFrom, {
                method: "get",
                signal,
            } as RequestInit);

            // remove the abort controller for the completed response
            abortControllers[i] = undefined;

            // check the response because a lot of gateways will do redirects and other checks which will not be compatible
            // with this library
            if(response.status >= 300 || response.status < 200) {
                throw new Error(`Url (${urlResolvedFrom}) did not return a 2xx response`);
            }

            return {
                response,
                urlResolvedFrom
            }
        } catch (err) {
            console.error(gatewayUrl, err);
            throw err;
        }
    })

    // get the first response from the gateway
    const result = await any(promises);

    // abort all the other requests
    for (const abortController of abortControllers) {
        if (abortController) {
            abortController.abort()
        }
    }

    return result;
}

export {
    ResolveOptions,
    defaultResolveOptions,
    ResolveOutput,
    resolve
}