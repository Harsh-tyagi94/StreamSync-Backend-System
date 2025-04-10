import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload file
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file uploaded successfully
        console.log("file is successfully uploaded in cloudinary", response.url);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved file as the upload operation is failed
        return null;
    }
}


export {uploadOnCloudinary}