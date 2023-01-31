import * as isIPFS from 'is-ipfs'
import {defaultIpfsGateways, defaultIpnsGateways} from "./defaultGateways";
import {isValidHttpUrl} from "./isValidHttpUrl";
import any from "promise.any";
import {AbortController} from "node-abort-controller";

export type FetchType = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface ResolveOptions {
    ipfsGateways?: string[];
    ipnsGateways?: string[];
    defaultProtocolIfUnspecified?: "ipfs" | "ipns";
    fetchOverride?: FetchType;
    logErrors?: boolean;
}

const defaultResolveOptions: Required<Omit<ResolveOptions, "fetchOverride">> = {
    ipfsGateways: defaultIpfsGateways,
    ipnsGateways: defaultIpnsGateways,
    defaultProtocolIfUnspecified: "ipfs",
    logErrors: false,
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
 *      - ip(f|n)s/<CID>
 *      - ip(f|n)s/<CID>/path
 *      - http(s)://<gateway domain>/ip(f|n)s/<CID>
 *      - http(s)://<gateway domain>/ip(f|n)s/<CID>/<path>
 *      - ip(f|n)s://<CID>
 *      - ip(f|n)s://<CID>/<path>
 *      - http(s)://<CID>.ip(f|n)s.<gateway domain>/<path>
 *      - https(s)://<regular url> - this will resolve a http request for a generic url
 * @param options
 */
async function resolve(uri: string, options?: ResolveOptions): Promise<ResolveOutput> {

    // The library will check many common spots for a fetch object. Depending on the ecosystem, lots of these variables don't
    // exist and throw errors, so I put them in try catch block.
    let fetchOverride: FetchType | undefined = options?.fetchOverride;
    if (!options?.fetchOverride) {
        try {
            fetchOverride = globalThis.fetch;
        } catch (err) {
        }


        if (!fetchOverride) {
            try {
                fetchOverride = window.fetch.bind(window);
            } catch (err) {
            }
        }

        if (!fetchOverride) {
            try {
                // This will only work in node-fetch <= 2.6.6
                fetchOverride = await import("node-fetch") as unknown as FetchType;
            } catch (err) {
                console.error(err)
            }
        }
    }

    if (!fetchOverride) {
        throw new Error("Fetch library not found, please pass in 'fetchOverride'. If you are running in the browser, this will likely be window.fetch, if in a node version >16.x.x it is global. If importing before 16.x.x then you will likely need to install 'node-fetch'.");
    }

    // merge the options with the default options
    const _options: Required<ResolveOptions> = {
        ...defaultResolveOptions,
        fetchOverride,
        ...(options || {})
    };


    let gatewaySuffix: string;
    let protocol: "ipfs" | "ipns" = _options.defaultProtocolIfUnspecified;
    let callOriginalUri: boolean = isValidHttpUrl(uri);

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

    // check to see if a subdomain uri
    else if (isIPFS.ipfsSubdomain(uri) || isIPFS.ipnsSubdomain(uri)) {

        // check to see if ipfs or ipns
        if (isIPFS.ipfsSubdomain(uri)) {
            protocol = "ipfs";
        } else if (isIPFS.ipnsSubdomain(uri)) {
            protocol = "ipns";
        }

        // get everything to the left of the protocol for the CID
        let tmp = uri.split(`.${protocol}.`);
        let cid = tmp[0];

        // remove the http or https if it exists
        if (cid.startsWith("https://")) {
            cid = cid.replace("https://", "");
        } else if ("http://") {
            cid = cid.replace("http://", "");
        }

        // get everything to the right of the domain, this will be the path
        tmp = tmp[1].split("/");
        tmp.shift();
        const path = tmp.join("/");

        // compile into the suffix
        gatewaySuffix = `/${protocol}/${cid}/${path}`;
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

    // when all other methods fail, it is a regular URL and will be requested like normal
    else if (callOriginalUri) {
        const response: Response = await _options.fetchOverride(uri, {
            method: "get",
        });

        if (response.status >= 300 || response.status < 200) {
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

    // keep a list of all the abortControllers that will need to be called to abort the fetch calls.
    // also if we are calling the originalUri then we will expand the array by 1.
    const abortControllers = Array(callOriginalUri ? gateways.length + 1 : gateways.length);

    // keep a list of all promises for resolving
    const promises: Promise<ResolveOutput>[] = [];

    // if the original uri is a valid url, then also call it
    if (callOriginalUri) {
        promises.push((async (): Promise<ResolveOutput> => {

            // create an abort controller to stop the fetch requests when the first one is resolved.
            const controller = new AbortController();
            const signal = controller.signal;
            abortControllers[gateways.length] = controller;

            const response = await _options.fetchOverride(uri, {
                method: "get",
                signal,
            } as RequestInit);

            // check the response because a lot of gateways will do redirects and other checks which will not be compatible
            // with this library
            if (response.status >= 300 || response.status < 200) {
                throw new Error(`Url (${uri}) did not return a 2xx response`);
            }

            // remove the abort controller for the completed response
            abortControllers[gateways.length] = undefined;

            return {
                response,
                urlResolvedFrom: uri
            }
        })())
    }

    // create a promise to each gateway
    promises.push(...gateways.map(async (gatewayUrl, i): Promise<ResolveOutput> => {

        try {
            const urlResolvedFrom = `${gatewayUrl}${gatewaySuffix}`;
            // if the urlResolvedFrom is already the original URI then this can be skipped
            if (uri === urlResolvedFrom) {
                throw new Error(`Skipping duplicate check of the original URI`);
            }

            // create an abort controller to stop the fetch requests when the first one is resolved.
            const controller = new AbortController();
            const signal = controller.signal;
            abortControllers[i] = controller;

            const response = await _options.fetchOverride(urlResolvedFrom, {
                method: "get",
                signal,
            } as RequestInit);

            // remove the abort controller for the completed response
            abortControllers[i] = undefined;

            // check the response because a lot of gateways will do redirects and other checks which will not be compatible
            // with this library
            if (response.status >= 300 || response.status < 200) {
                throw new Error(`Url (${urlResolvedFrom}) did not return a 2xx response`);
            }

            return {
                response,
                urlResolvedFrom
            }
        } catch (err) {
            if (_options.logErrors) {
                console.error(gatewayUrl, err);
            }
            throw err;
        }
    }));

    // get the first response from the gateway
    const result = await any(promises);

    // abort all the other requests
    for (const abortController of abortControllers) {
        if (abortController) {
            try {
                abortController.abort()
            } catch (err) {
                if (_options.logErrors) {
                    throw err;
                }
            }
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