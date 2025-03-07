"use client";
import MessageCard from "@/components/MessageCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/model/User";
import { acceptMessageSchema } from "@/schema/acceptMessageSchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2, RefreshCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

function page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // const [refresh, setRefresh] = useState<boolean>(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState<boolean>(false);

  const messDelete = (messageId: string): void => {
    setMessages(messages.filter((message) => message._id !== messageId));
  };

  const { toast } = useToast();
  const { register, watch, setValue } = useForm({
    resolver: zodResolver(acceptMessageSchema),
  });
  const { data: session } = useSession();

  const acceptingMessage = watch("acceptMessages");
  // console.log(acceptingMessage);

  const fetchMessages = useCallback(async (refresh: boolean = false) => {
    setIsSwitchLoading(false);
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>("/api/get-messages");
      setMessages(res.data.messages || []);
      if (refresh) {
        toast({
          title: "Refreshed message",
          description: "Showing latest messages",
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data.message ??
          "Something went wrong while fetching the messages",
      });
    } finally {
      setIsSwitchLoading(false);
      setLoading(false);
    }
  }, []);
  const fetchAcceptingMessage = useCallback(async () => {
    setIsSwitchLoading(true);
    try {
      const res = await axios.get<ApiResponse>("/api/accept-messages");
      // console.log("acceptMessages", res.data.isAcceptingMessages);
      // if (!res.data.isAcceptingMessages) return;
      setValue("acceptMessages", res.data?.isAcceptingMessages as boolean);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data.message ??
          "Something went wrong while fetching the messages",
      });
    } finally {
      setIsSwitchLoading(false);
    }
  }, [toast, setValue]);

  const handleAcceptMessage = async (newVal: boolean) => {
    setIsSwitchLoading(true);
    // console.log(newVal);
    try {
      const res = await axios.post<ApiResponse>("/api/accept-messages", {
        acceptingMessages: newVal,
      });
      // console.log(res.data);
      setValue("acceptMessages", newVal);
      toast({
        title: res.data.message,
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data.message ??
          "Something went wrong while fetching the messages",
      });
    } finally {
      setIsSwitchLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !session.user) return;
    fetchAcceptingMessage();
    fetchMessages();
  }, [
    session?.user?._id,
    setValue,
    toast,
    fetchAcceptingMessage,
    fetchMessages,
  ]);

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  if (!session || !session.user) return <></>;
  const profileUrl = `${baseUrl}//u/${session.user.username}`;
  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Url copied",
      description: "Profile URL has been copied to the clipboard.",
    });
  };
  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>{" "}
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
        <div>
          <div className="mb-4">
            <Switch
              // {...register("acceptMessages")}
              checked={acceptingMessage}
              onCheckedChange={handleAcceptMessage}
              disabled={isSwitchLoading}
            />
            <span className="ml-2">
              Accept Messages: {acceptingMessage ? "On" : "Off"}
            </span>
          </div>
          <Separator />
          <Button
            variant={"outline"}
            onClick={(e) => {
              e.preventDefault();
              fetchMessages(true);
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
          <Separator />
          <div>
            {messages.length > 0 ? (
              messages.map((mess, index) => (
                <MessageCard
                  key={mess?._id as string}
                  message={mess}
                  onMessageDelete={messDelete}
                />
              ))
            ) : (
              <p>No messages to display</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default page;
