import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint:  process.env.IMAGEKIT_URL_ENDPOINT
});

// Add this line to make the variable available for import
export default imagekit ;
// OR you can define and export in one line:
// export const imagekit = new ImageKit({ ... });