"use client";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signUpSchema } from "@/schema/signUpSchema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { verifySchema } from "@/schema/verifySchema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });
  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    try {
      const res = await axios.post("/api/verifyCode", {
        username: params.username,
        verifyCode: data.code,
      });
      // console.log("Response from the verify code --->", res);
      toast({
        title: "Verification Success",
        description: res.data.message,
      });
      router.replace("/sign-in");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      // console.log(axiosError);
      toast({
        description:
          axiosError.response?.data.message ??
          "An error occured. Please try again.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join Mystery Message
          </h1>{" "}
          <p className="mb-4">Sign up to start your anonymous adventure</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    {" "}
                    <FormLabel className="flex">Code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        {...field}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="border-black" />
                          <InputOTPSlot index={1} className="border-black" />
                          <InputOTPSlot index={2} className="border-black" />
                          <InputOTPSlot index={3} className="border-black" />
                          <InputOTPSlot index={4} className="border-black" />
                          <InputOTPSlot index={5} className="border-black" />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormDescription className="flex">
                      Enter your 6 digit verification code
                    </FormDescription>
                    <FormMessage className="flex" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className={`bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded `}
              >
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
