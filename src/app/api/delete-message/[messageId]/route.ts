import connectDB from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession, User } from "next-auth";

export async function DELETE(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;
  await connectDB();
  const session = await getServerSession(authOptions);
  const user: User = session?.user;
  if (!user || !session) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 400 }
    );
  }
  try {
    const updatedMessages = await UserModel.findOneAndUpdate(
      { _id: user._id },
      {
        $pull: { messages: { _id: messageId } },
      }
    );
    if (!updatedMessages) {
      return Response.json(
        { success: false, message: "Message no found or already deleted" },
        { status: 400 }
      );
    }
    return Response.json(
      { success: true, message: "Message has been deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    return Response.json(
      {
        success: false,
        message: "Something went wrong while deleting the message",
      },
      { status: 500 }
    );
  }
}
