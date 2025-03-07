import connectDB from "@/lib/dbConnect";
import { sendVerificationEmail } from "@/lib/resend";
import UserModel from "@/model/User";
import bcryptjs from "bcryptjs";

export async function POST(request: Request) {
  await connectDB();
  try {
    const { username, email, password } = await request.json();
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }
    const existingUserByEmail = await UserModel.findOne({
      email,
    });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exists with the following email",
          },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcryptjs.hash(password, 10);
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
        await existingUserByEmail.save();
      }
    } else {
      const hashedPassword = await bcryptjs.hash(password, 10);
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      const user = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiry,
        messages: [],
      });
      await user.save();
    }
    const emailRes = await sendVerificationEmail(email, username, verifyCode);
    if (!emailRes.success) {
      return Response.json(
        {
          success: false,
          message: emailRes.messages,
        },
        { status: 400 }
      );
    }
    return Response.json(
      {
        success: true,
        message: "User registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while registering the user",
        error,
      },
      { status: 500 }
    );
  }
}
