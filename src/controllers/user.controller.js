import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
    
        if (!user) {
            throw new ApiError(401, "user not found")
        }
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
        
    }
}

const options = {
    httponly: true,
    secure: true
}


const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, chack for avatar
    //available then upload to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check foor user creation (by response check)
    //return res


    const {fullName, email, username, password} = await req.body
    // console.log("email: ", email);

    // if (fullName == "") {
    //     throw new ApiError(400, "fullName is required")
    // }

    if (
        [fullName, email, username, password].some( (field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if (!existedUser) {
        throw new ApiError(409, "user with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} )

const loginUser = asyncHandler( async (req,res) => {
    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username or email required")
    }

    if(!password){
        throw new ApiError(400, "password required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(401, "invalid user credentials")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    console.log("successfully loggedIn")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
})


const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})



export { 
    registerUser,
    loginUser,
    logoutUser
}