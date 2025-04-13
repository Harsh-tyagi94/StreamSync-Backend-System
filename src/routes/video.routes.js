import { Router } from "express"
import { verifyJWT } from "../middlewares/Auth.middleware.js"
import { getVideobyId, publishAVideo } from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = new Router();

router.use(verifyJWT);

router.route("/uploadVideo").post(
    upload.fields([
            {
                name: "videoFile",
                maxCount: 1
            }, 
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
);

router.route("/v/:videoId").get(getVideobyId)

// router.route("/video").get(getvideo)

export default router