import { User } from "../models/user.models.js"
import { Video } from "../models/video.models.js"
import { asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose, { isValidObjectId } from "mongoose"

const page = 1;
const limit = 10;
const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
};

const getAllVideos = asyncHandler(async (req, res) => {
    const { page=1, limit=10, query, sortBy, sortType, userId} = req.query

    const pipeline = [];

    if(query) {
        pipeline.push( {
            $search: {
                index: "search-video",
                text: {
                    query: query,
                    path: ["title", "description"] //search only on title, desc
                }
            }
        })
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        });
    }

    pipeline.push({ $match: { isPublished: true } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration } = req.body

    if(!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath) {
        throw new ApiError(400, "Video file are required")
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file are required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile) {
        throw new ApiError(500, "Error uploading video")
    }
    if(!thumbnail) {
        throw new ApiError(500, "Error uploading thumbnail")
    }


    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: duration,
        owner: req.user._id,
    })


    if(!video) {
        throw new ApiError(500, "Error creating video")
    }

    const videoResponse = await Video.findById(video._id)


    return res
            .status(201)
            .json(
                new ApiResponse(201, "Video published successfully", videoResponse)
            )

})


const getVideobyId = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(videoId),
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    ]);

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    //increment views count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    }, 
    { 
        new: true
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video fetched successfully")
        )
})


const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const { title, description} = req.body

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    //deleting old thumbnail and updating with new one
    const thumbnailToDelete = video.thumbnail.public_id;

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file are required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not uploaded successfully");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    public_id: thumbnail.public_id,
                    url: thumbnail.url
                }
            }
        }, {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Error updating video");
    }

    //delete old thumbnail from cloudinary
    await deleteOnCloudinary(thumbnailToDelete, "image");

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Video updated successfully")
        )
});


const deleteVideo = asyncHandler(async (req, res) => {
    //check if videoId is valid
    //find video by videoId
    //check if video exists
    //check if user is owner of the video
    //delete video from db
    //delete video from cloudinary
    //retrun success response
    const { videoId } = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    const videoDeleted = await Video.findByIdAndDelete(video?._id)
    if(!videoDeleted) {
        throw new ApiError(500, "Failed to delete the video please try again")
    }

    await deleteOnCloudinary(video.videoFile, "video")
    await deleteOnCloudinary(video.thumbnail)

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoDeleted, "Video deleted successfully")
        )
})


export {
    publishAVideo,
    getAllVideos,
    getVideobyId,
    updateVideo,
    deleteVideo
}