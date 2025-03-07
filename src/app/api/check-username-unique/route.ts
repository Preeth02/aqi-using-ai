import connectDB from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { z } from "zod";
import { usernameValidation } from "@/schema/signUpSchema";

const usernameQuerySchema = z.object({ username: usernameValidation });

export async function GET(request: Request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    console.log("SearchParams ---->", searchParams);
    const queryParam = {
      username: searchParams.get("username"),
    };

    const result = usernameQuerySchema.safeParse(queryParam);
    console.log(result);

    if (!result.success) {
      console.log("Verification error ---->", result.error);
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            usernameErrors?.length > 0
              ? usernameErrors.join(", ")
              : "Invalid query parameters",
        },
        {
          status: 400,
        }
      );
    }
    const { username } = result.data;
    const user = await UserModel.findOne({ username });
    if (user && user.isVerified) {
      return Response.json(
        {
          success: false,
          message: "Username has been taken already",
        },
        {
          status: 400,
        }
      );
    }
    return Response.json(
      {
        success: true,
        message: "Username available",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while checking for the username",
      },
      {
        status: 400,
      }
    );
  }
}
