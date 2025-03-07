import { Resend } from "resend";
import verificationEmail from "../../emails/verificationEmail";
import { ApiResponse } from "@/types/ApiResponse";

const resend = new Resend(process.env.RESEND_EMAIL_API);

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Anonymous Message | Verification Code",
      react: verificationEmail({ username, otp: verifyCode }),
    });
    return {
      success: true,
      message: "Failed to send verification email",
    };
  } catch (error) {
    console.log("Error while sending verification email", error);
    return {
      success: false,
      message: "Failed to send verification email",
    };
  }
}
