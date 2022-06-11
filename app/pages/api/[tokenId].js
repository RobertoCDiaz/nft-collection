export default function handler(req, res) {
    // extract token id from query params
    const tokenId = req.query.tokenId;

    // source of the nft (extracted directly from the github repository)
    const imageUrl = 
        'https://raw.githubusercontent.com/RobertoCDiaz/nft-collection/main/app/public/nfts/';

    // return nft usgin the OpenSea standard (more info on https://docs.opensea.io/docs/metadata-standards)
    res.status(200).json({
        name: "WNC #" + tokenId,
        description: "A NFT from the WNC collection!",
        image: imageUrl + tokenId + ".svg",
    });
}