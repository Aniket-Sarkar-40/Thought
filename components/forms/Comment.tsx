"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CommentValidation } from "@/lib/validation/thought";
import { Input } from "../ui/input";
import Image from "next/image";
import { addCommentToThought } from "@/lib/actions/thought.actions";
import { usePathname } from "next/navigation";

interface PropsType {
  thoughtId: string;
  currentUserId: string;
  currentUserImage: string;
}

const Comment = ({ thoughtId, currentUserImage, currentUserId }: PropsType) => {
  const pathname = usePathname();
  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thought: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    await addCommentToThought(
      JSON.parse(thoughtId),
      values.thought,
      JSON.parse(currentUserId),
      pathname
    );

    form.reset();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="comment-form">
        <FormField
          control={form.control}
          name="thought"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 w-full">
              <FormLabel>
                <Image
                  src={currentUserImage}
                  alt="profile image"
                  width={48}
                  height={48}
                  className="rounded-full object-cover h-11 w-12 "
                />
              </FormLabel>
              <FormControl className="border-none bg-transparent">
                <Input
                  type="text"
                  placeholder="Comment..."
                  className="text-light-1 outline-none no-focus"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="comment-form_btn">
          Reply
        </Button>
      </form>
    </Form>
  );
};

export default Comment;
