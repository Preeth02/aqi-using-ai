import { authOptions } from "./options"; //Referring to the auth.ts we just created
import NextAuth from "next-auth";
const handlers = NextAuth(authOptions);
export { handlers as GET, handlers as POST };
