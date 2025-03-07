import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/schema/signInSchema";
import { ZodError } from "zod";
import connectDB from "@/lib/dbConnect";
import UserModel, { User } from "@/model/User";
import bcryptjs from "bcryptjs";
import { NextAuthOptions } from "next-auth";
// Your own logic for dealing with plaintext password strings; be careful!
export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifer", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<any> => {
        await connectDB();
        try {
          console.log("Yo baby 1");
          const { identifier, password } =
            await signInSchema.parseAsync(credentials);
          console.log("Yo baby 2");
          const user = await UserModel.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          });
          console.log("Yo baby 3");

          if (!user) {
            throw new Error("No user found with the credentials.");
          }
          console.log("Yo baby 4");
          if (!user.isVerified) {
            throw new Error("Please verify before login.");
          }
          console.log("Yo baby 5");
          const isPasswordCorrect = await bcryptjs.compare(
            password,
            user.password
          );
          console.log("Yo baby 6");
          if (!isPasswordCorrect) {
            throw new Error("Incorrect Password.");
          }
          console.log("Yo baby 7");
          // return JSON object with the user data
          return user;
        } catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid
            return null;
          }
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token._id = user._id;
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      session.user._id = token._id;
      session.user.isVerified = token.isVerified;
      session.user.isAcceptingMessages = token.isAcceptingMessages;
      session.user.username = token.username;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.AUTH_SECRET,
};
