import {resolve} from "./resolve";
import { expect } from "chai";
import {defaultIpfsGateways, defaultIpnsGateways} from "./defaultGateways";
import {isValidHttpUrl} from "./isValidHttpUrl";

describe("Tests the ipfs-race library.", () => {

    const testCidWithNoPath = "QmaiJczLW9X1Gk7rQH7CgYCuquLZMbdWB6hhqznDBoqdLE" // https://etherscan.io/address/0x7239d51f7fc1b37ca350e3ad816dc32b2f8764d6#readContract
    const testCidWithNoPathResult = {"name":"AFTRMATH Deluxe 001","description":"AFTRMATH is a thrill-seeking, cola-drinking, dune Surfer. Cares more about cactus than he cares about people.","decimals":0,"image":"ipfs://QmSJdVXDmPCU7L3houziZeqt6ATv58EvYxZkpuYamVprK7","animation_url":"https://ipfs.io/ipfs/QmeFFAYUsy4isdzszxCJgLd12UjYubeuHtwtkZ2BQt6vHG","legal":"https://www.lamoverse.com/nftlegal","attributes":[{"trait_type":"Rarity","value":"Deluxe"},{"trait_type":"Collection","value":"Cali Fallout"},{"trait_type":"Season","value":"Pre Season"},{"trait_type":"Mantra","value":"Opportunist Junker"},{"trait_type":"Hair","value":"Sun-Bleached Dreads"},{"trait_type":"Face","value":"Beard"},{"trait_type":"Clothing","value":"Casual Surfer"},{"trait_type":"Shoes","value":"Flip-Flops"}]};
    const testCidWithPath = "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/0" // bored ape yacht club number 0 https://etherscan.io/address/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#readContract
    const testCidWithPathResult = {"image":"ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ","attributes":[{"trait_type":"Earring","value":"Silver Hoop"},{"trait_type":"Background","value":"Orange"},{"trait_type":"Fur","value":"Robot"},{"trait_type":"Clothes","value":"Striped Tee"},{"trait_type":"Mouth","value":"Discomfort"},{"trait_type":"Eyes","value":"X Eyes"}]};

    it("cid with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(testCidWithNoPath);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult)
    });

    it("cid with path", async () => {
        const {response, urlResolvedFrom} = await resolve(testCidWithPath);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult)
    })

    it("gateway url with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(`https://ipfs.io/ipfs/${testCidWithNoPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult)
    });

    it("gateway url with path", async () => {
        const {response, urlResolvedFrom} = await resolve(`https://ipfs.io/ipfs/${testCidWithPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult)
    });

    it("ipfs protocol with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(`ipfs:///${testCidWithNoPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult)
    });

    it("ipfs protocol with path", async () => {
        const {response, urlResolvedFrom} = await resolve(`ipfs:///${testCidWithPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult)
    });

    it("check that each default ipfs gateway to be a valid url", () => {
        for (const url of defaultIpfsGateways) {
            expect(isValidHttpUrl(url)).to.be.true;
        }
    })

    it("check that each default ipns gateway to be a valid url", () => {
        for (const url of defaultIpnsGateways) {
            expect(isValidHttpUrl(url)).to.be.true;
        }
    })
});