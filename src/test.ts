import {resolve} from "./resolve";
import { expect } from "chai";
import {defaultIpfsGateways, defaultIpnsGateways} from "./defaultGateways";
import {isValidHttpUrl} from "./isValidHttpUrl";

describe("Tests the ipfs-race library.", () => {

    const testCidWithNoPath = "QmaiJczLW9X1Gk7rQH7CgYCuquLZMbdWB6hhqznDBoqdLE" // https://etherscan.io/address/0x7239d51f7fc1b37ca350e3ad816dc32b2f8764d6#readContract
    const testCidWithNoPathResult = {"name":"AFTRMATH Deluxe 001","description":"AFTRMATH is a thrill-seeking, cola-drinking, dune Surfer. Cares more about cactus than he cares about people.","decimals":0,"image":"ipfs://QmSJdVXDmPCU7L3houziZeqt6ATv58EvYxZkpuYamVprK7","animation_url":"https://ipfs.io/ipfs/QmeFFAYUsy4isdzszxCJgLd12UjYubeuHtwtkZ2BQt6vHG","legal":"https://www.lamoverse.com/nftlegal","attributes":[{"trait_type":"Rarity","value":"Deluxe"},{"trait_type":"Collection","value":"Cali Fallout"},{"trait_type":"Season","value":"Pre Season"},{"trait_type":"Mantra","value":"Opportunist Junker"},{"trait_type":"Hair","value":"Sun-Bleached Dreads"},{"trait_type":"Face","value":"Beard"},{"trait_type":"Clothing","value":"Casual Surfer"},{"trait_type":"Shoes","value":"Flip-Flops"}]};
    const testCidWithPath = "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/0" // bored ape yacht club number 0 https://etherscan.io/address/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d#readContract
    const testCidWithPathResult = {"image":"ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ","attributes":[{"trait_type":"Earring","value":"Silver Hoop"},{"trait_type":"Background","value":"Orange"},{"trait_type":"Fur","value":"Robot"},{"trait_type":"Clothes","value":"Striped Tee"},{"trait_type":"Mouth","value":"Discomfort"},{"trait_type":"Eyes","value":"X Eyes"}]};
    const testUrlSubdomainWithPath = "https://bafybeih3dhxuzle4nt2rirdezbssc43vjrws2f7zocbzrsgjqe5zo3b23e.ipfs.nftstorage.link/10896.json";
    const testUrlSubdomainWithResult = {"name":"Iron Pigeon #10896 1st Edition","symbol":"XPTCS","description":"Mike Tyson brings his love for pigeons to the Metaverse by making them the second set in the Ex Populus Trading Card System. Mint your own Iron Pigeon and evolve your way to Legendary in the game Final Form. Learn more about Final Form: https://expopulus.com/games/final-form","seller_fee_basis_points":1000,"image":"https://ipfs.io/ipfs/QmbrCdrecFDeuDKukaC97vb3uZ5ioHiWzzb1VncLDKhFGA","external_url":"https://ironpigeons.expopulus.com","attributes":[{"trait_type":"Rarity","value":"rare"},{"trait_type":"Power","value":"286"},{"trait_type":"Health","value":"healthy"},{"trait_type":"Attack","value":"formidable"},{"trait_type":"Ability 1","value":"Evade"},{"trait_type":"House","value":"Machines"},{"trait_type":"Set Name","value":"Iron Pigeons"},{"trait_type":"Set Number","value":"2"},{"trait_type":"Edition","value":"1st Edition"},{"trait_type":"Card Number","value":"10896"},{"trait_type":"Body","value":"shredded white"},{"trait_type":"Costume","value":"high-top fade"},{"trait_type":"Beak","value":"standard"},{"trait_type":"Eyes","value":"pink"},{"trait_type":"Background","value":"blue"}],"collection":{"name":"Iron Pigeons","family":"Ex Populus Trading Card System"},"properties":{"creators":[{"address":"3NXTh2Bw64a72RGGJ2mh8V7YEW2jERGdESjqxyvBoXo1","share":35},{"address":"39gMkx283UsuKNt5ogETWdHHaGyBwbh8sU5cKAEQjU2w","share":15},{"address":"4MnG71K4EXDHFysnnftV9YLDhnUjfxY5jTE34QAx4Pho","share":50}],"files":[{"uri":"https://ipfs.io/ipfs/QmbrCdrecFDeuDKukaC97vb3uZ5ioHiWzzb1VncLDKhFGA","type":"image/png"},{"uri":"https://ipfs.io/ipfs/QmXT3yXQ6dEZawcGTwXjwQhTaDgKMwuTts6fU9S2jyyPoh","type":"image/png"},{"uri":"https://ipfs.io/ipfs/QmUCSep13eQCrNpAnQSwpadtJDgUW4D1CWUUooFYeUMUGt","type":"image/png"},{"uri":"https://ipfs.io/ipfs/QmY9KQYHTMxGHK7VizvmyqDFxR5LgRfEGjkJmuuax7nvVL","type":"image/png"}],"category":"image"}};
    const testUrlWith2SubdomainsWhere1IsIpfs = "https://bafybeicqjhjcar5x7jvtz62zc4hbakczvktbu3zvbn3o3wnmqpbxgbdkli.ipfs.nftstorage.link/0.json";
    const testUrlWith2SubdomainsWhere1IsIpfsResult = {"name":"Ryder One","symbol":"RO","description":"Wall Street Degens Bid Goodbye Seed phrases” is a special Ryder NFT for Magic Eden created by Quentin Saubadu.","seller_fee_basis_points":500,"image":"https://bafybeihphsiusu2iyw42qjfm7yngieayscfbxmzmjm4zovzt6lxszjelia.ipfs.nftstorage.link/0.png?ext=png","attributes":[],"collection":{"name":"Ryder One","family":"Ryder One"},"properties":{"creators":[{"address":"CxsRPwBU4HdpzEPGVAvX1vxnfSZFDBcMmv8TqBww7Mpw","share":100}],"category":"image","files":[{"uri":"https://bafybeihphsiusu2iyw42qjfm7yngieayscfbxmzmjm4zovzt6lxszjelia.ipfs.nftstorage.link/0.png?ext=png","type":"image/png"}]}};

    it("cid with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(testCidWithNoPath);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult);
    });

    it("cid with path", async () => {
        const {response, urlResolvedFrom} = await resolve(testCidWithPath);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult);
    })

    it("gateway url with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(`https://ipfs.io/ipfs/${testCidWithNoPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult);
    });

    it("gateway url with path", async () => {
        const {response, urlResolvedFrom} = await resolve(`https://ipfs.io/ipfs/${testCidWithPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult);
    });

    it("ipfs protocol with no path", async () => {
        const {response, urlResolvedFrom} = await resolve(`ipfs://${testCidWithNoPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithNoPathResult);
    });

    it("ipfs protocol with path", async () => {
        const {response, urlResolvedFrom} = await resolve(`ipfs://${testCidWithPath}`);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testCidWithPathResult);
    });

    it("test ipfs subdomain with path", async () => {
        const {response, urlResolvedFrom} = await resolve(testUrlSubdomainWithPath);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testUrlSubdomainWithResult);
    });

    it("test ipfs subdomain with 2 subdomains where 1 is ipfs", async () => {
        const {response, urlResolvedFrom} = await resolve(testUrlWith2SubdomainsWhere1IsIpfs);
        expect(await response.json(), urlResolvedFrom).to.deep.equal(testUrlWith2SubdomainsWhere1IsIpfsResult);
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