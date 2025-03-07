"use client";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { messageSchema } from "@/schema/messageSchema";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import axios, { AxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiResponse } from "@/types/ApiResponse";

const splChar = "||";

const makeArr = (message: string): string[] => {
  return message.split(splChar);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

const page = () => {
  const { username } = useParams();
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const [suggestedMessages, setSuggestedMessages] = useState("");
  const [loading, setLoading] = useState(false);
  const [isloading, setIsLoading] = useState(false);

  const { toast } = useToast();
  // const content = form.watch("content");

  const sendToTextArea = (message: string) => {
    form.setValue("content", message);
  };

  const suggestMessageMethod = async () => {
    setIsLoading(true);
    try {
      const getSuggestedMessage = await axios.post("/api/suggest-messages");
      // console.log(getSuggestedMessage);
      setSuggestedMessages(getSuggestedMessage.data.suggestedMessages);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description: axiosError.response?.data.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setLoading(false);
    try {
      const getSuggestedMessage = await axios.post("/api/send-messages", {
        content: data.content,
        username,
      });
      toast({
        title: "Success",
        description: "Your message has been sent to the creator.",
      });
      form.reset({content:""});
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description: axiosError.response?.data.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Public Profile Link
      </h1>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Anonymous Message to {username}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your message here..."
                      {...field}
                      className="resize-none"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            {loading ? (
              <Button disabled>
                <Loader2 className="animate-spin">Please wait</Loader2>
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                Send
              </Button>
            )}
          </form>
        </Form>
      </div>
      <div>
        <Button onClick={suggestMessageMethod} disabled={isloading}>
          Suggest message
        </Button>
        <Card className="w-5/6">
          <CardHeader>
            <CardTitle>Suggested messages: </CardTitle>
          </CardHeader>
          <p>Click on any message below to select it.</p>
          <CardContent className="flex flex-col space-y-4">
            {suggestedMessages.length > 0
              ? makeArr(suggestedMessages).map((message, index) => (
                  <div className="flex my-2" key={index}>
                    <Button onClick={() => sendToTextArea(message)}>
                      {message}
                    </Button>
                  </div>
                ))
              : makeArr(initialMessageString).map((message, index) => (
                  <div className="flex my-2" key={index}>
                    <Button onClick={() => sendToTextArea(message)}>
                      {message}
                    </Button>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
