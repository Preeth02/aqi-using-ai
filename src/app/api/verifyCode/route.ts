import connectDB from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function POST(request: Request) {
  await connectDB();
  try {
    const { username, verifyCode } = await request.json();

    //? We are using the decodedUsername as we are passing the username in the frontend which is taken by the url. So it might conatain a space which will be replaced by %20 in the url.
    const decodedUsername = decodeURIComponent(username);
    const user = await UserModel.findOne({ username: decodedUsername });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }
    const isValidCode = user.verifyCode === verifyCode;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    if (isValidCode && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();
      return Response.json(
        {
          success: true,
          message: "User verified successfully",
        },
        {
          status: 200,
        }
      );
    } else if (!isValidCode) {
      return Response.json(
        {
          success: false,
          message: "Invalid verification code",
        },
        {
          status: 400,
        }
      );
    } else {
      return Response.json(
        {
          success: false,
          message:
            "Code has been expired please signup again to get a new code",
        },
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while checking the verification code",
      },
      {
        status: 400,
      }
    );
  }
}
